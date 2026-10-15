import request from 'supertest'
import { describe, expect, it, vi } from 'vitest'
import type { IEpisode } from '../entities/episode.ts'
import type { IIncomingEpisode } from '../entities/incomingEpisode.ts'
import type { ISeries } from '../entities/series.ts'
import { SERIES_CONTAINER_GROUP_ID, SERIES_LISTENER_GROUP_ID, seriesBot } from '../provider/telegram.ts'
import { episodeRepository } from '../repositories/episode.ts'
import { incomingEpisodesRepository } from '../repositories/incomingEpisode.ts'
import { seriesRepository } from '../repositories/series.ts'
import { app } from '../server.ts'

vi.mock('../repositories/series.ts', () => ({
	seriesRepository: {
		getSeries: vi.fn(),
		saveSeries: vi.fn(),
		deleteSeries: vi.fn(),
	},
}))

vi.mock('../repositories/episode.ts', () => ({
	episodeRepository: {
		getEpisodes: vi.fn(),
		saveEpisodes: vi.fn(),
		updateEpisodes: vi.fn(),
	},
}))

vi.mock('../repositories/incomingEpisode.ts', () => ({
	incomingEpisodesRepository: {
		markEpisodeAsProcessed: vi.fn(),
	},
}))

vi.mock('../provider/telegram.ts', () => ({
	bot: { copyMessage: vi.fn() },
	seriesBot: { sendPhoto: vi.fn(), copyMessage: vi.fn() },
	MOVIE_CONTAINER_GROUP_ID: 101,
	MOVIE_LISTENER_GROUP_ID: 102,
	SERIES_CONTAINER_GROUP_ID: 103,
	SERIES_LISTENER_GROUP_ID: 104,
	SERIES_SEND_MAX_ATTEMPTS: 3,
}))

const CREATED_AT = new Date('2026-01-15T10:00:00.000Z')
const UPDATED_AT = new Date('2026-02-20T18:30:00.000Z')

function makeSeries(overrides: Partial<ISeries> = {}): ISeries {
	return {
		id: 7,
		tmdb_id: 1396,
		title_en: 'Breaking Bad',
		title_cas: 'Breaking Bad',
		title_lat: 'Breaking Bad',
		year: 2008,
		poster: 'https://image.tmdb.org/t/p/poster.jpg',
		telegram_poster_id: 500,
		backdrop_path: 'https://image.tmdb.org/t/p/backdrop.jpg',
		description: 'A chemistry teacher turns to crime.',
		popularity: 100.5,
		genres: ['Drama'],
		created_at: CREATED_AT,
		updated_at: UPDATED_AT,
		...overrides,
	}
}

function makeEpisode(overrides: Partial<IEpisode> = {}): IEpisode {
	return {
		id: 1,
		series_id: 7,
		episode_number: 7,
		season: 4,
		language_cas: true,
		language_lat: true,
		telegram_file_id_cas: 1111,
		telegram_file_id_lat: 1222,
		created_at: CREATED_AT,
		updated_at: UPDATED_AT,
		...overrides,
	}
}

const validBody = {
	series: {
		tmdb_id: 1396,
		title_en: 'Breaking Bad',
		title_cas: 'Breaking Bad',
		title_lat: 'Breaking Bad',
		year: 2008,
		poster: 'https://image.tmdb.org/t/p/poster.jpg',
		description: 'A chemistry teacher turns to crime.',
		popularity: 100.5,
		backdrop_path: 'https://image.tmdb.org/t/p/backdrop.jpg',
		genres: ['Drama'],
	},
	episodesToSave: [
		{
			episode_number: 7,
			season: 4,
			language_cas: true,
			language_lat: true,
			telegram_file_id_cas: 111,
			telegram_file_id_lat: 222,
		},
	],
}

function makeIncomingEpisode(): IIncomingEpisode {
	return {
		id: 1,
		message_id: 111,
		caption: 'Breaking Bad s04e07',
		episode_number: 7,
		season: 4,
		language: 'castellano',
		batch_id: 555,
		batch_name: 'Breaking Bad',
		is_processed: true,
		created_at: CREATED_AT,
		updated_at: UPDATED_AT,
	}
}

describe('POST /series', () => {
	it('publishes the poster and the episodes to Telegram, saves the serie and returns 201', async () => {
		vi.mocked(seriesRepository.getSeries).mockResolvedValue([])
		vi.mocked(seriesRepository.saveSeries).mockResolvedValue(makeSeries())
		vi.mocked(episodeRepository.getEpisodes).mockResolvedValue([])
		vi.mocked(episodeRepository.saveEpisodes).mockResolvedValue([makeEpisode()])
		vi.mocked(seriesBot.sendPhoto).mockResolvedValue({ message_id: 500 } as never)
		vi.mocked(seriesBot.copyMessage)
			.mockResolvedValueOnce({ message_id: 1111 } as never)
			.mockResolvedValueOnce({ message_id: 1222 } as never)
		vi.mocked(incomingEpisodesRepository.markEpisodeAsProcessed).mockResolvedValue(makeIncomingEpisode() as never)

		const res = await request(app).post('/series').send(validBody).expect(201)

		expect(res.body).toEqual({})
		expect(seriesBot.sendPhoto).toHaveBeenCalledWith(SERIES_CONTAINER_GROUP_ID, validBody.series.poster, {
			caption: expect.any(String),
		})
		expect(seriesRepository.saveSeries).toHaveBeenCalledWith({ ...validBody.series, telegram_poster_id: 500 })
		expect(seriesBot.copyMessage).toHaveBeenNthCalledWith(1, SERIES_CONTAINER_GROUP_ID, SERIES_LISTENER_GROUP_ID, 111, {
			caption: '4x07\nEspañol castellano 🇪🇸',
		})
		expect(seriesBot.copyMessage).toHaveBeenNthCalledWith(2, SERIES_CONTAINER_GROUP_ID, SERIES_LISTENER_GROUP_ID, 222, {
			caption: '4x07\nEspañol latino 🇲🇽',
		})
		expect(episodeRepository.saveEpisodes).toHaveBeenCalledWith(7, [
			{ ...validBody.episodesToSave[0], telegram_file_id_cas: 1111, telegram_file_id_lat: 1222 },
		])
		expect(incomingEpisodesRepository.markEpisodeAsProcessed).toHaveBeenCalledWith(111)
		expect(incomingEpisodesRepository.markEpisodeAsProcessed).toHaveBeenCalledWith(222)
	})

	it('rejects an invalid body with 422 problem+json without touching Telegram nor the repositories', async () => {
		const res = await request(app).post('/series').send({ series: validBody.series }).expect(422)

		expect(res.headers['content-type']).toContain('application/problem+json')
		expect(res.body).toMatchObject({ status: 422, title: 'Unprocessable Entity', detail: 'Invalid request body' })
		expect(seriesBot.copyMessage).not.toHaveBeenCalled()
		expect(seriesRepository.getSeries).not.toHaveBeenCalled()
	})

	it('rejects a malformed JSON body with 400 problem+json', async () => {
		const res = await request(app).post('/series').set('Content-Type', 'application/json').send('{not valid json').expect(400)

		expect(res.headers['content-type']).toContain('application/problem+json')
		expect(res.body).toMatchObject({ status: 400, title: 'Bad Request' })
	})
})
