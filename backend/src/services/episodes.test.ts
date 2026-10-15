import { describe, expect, it, vi } from 'vitest'
import type { IEpisode, IEpisodeToSave } from '../entities/episode.ts'
import type { ISeries, ISeriesToSave } from '../entities/series.ts'
import type { ISeriesSendDelay } from '../helpers/seriesSendDelay.ts'
import { episodeRepository } from '../repositories/episode.ts'
import { incomingEpisodesRepository } from '../repositories/incomingEpisode.ts'
import { seriesRepository } from '../repositories/series.ts'
import { NotFoundError } from '../utils/errors.ts'
import { episodeService } from './episodes.ts'
import { telegramService } from './telegram.ts'

vi.mock('../repositories/episode.ts', () => ({
	episodeRepository: {
		getEpisodes: vi.fn(),
		saveEpisodes: vi.fn(),
		updateEpisodes: vi.fn(),
	},
}))

vi.mock('../repositories/series.ts', () => ({
	seriesRepository: {
		getSeries: vi.fn(),
		saveSeries: vi.fn(),
		deleteSeries: vi.fn(),
	},
}))

vi.mock('../repositories/incomingEpisode.ts', () => ({
	incomingEpisodesRepository: {
		markEpisodeAsProcessed: vi.fn(),
	},
}))

vi.mock('./telegram.ts', () => ({
	telegramService: {
		sendSeriesPoster: vi.fn(),
		sendEpisode: vi.fn(),
	},
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

function makeSeriesToSave(overrides: Partial<ISeriesToSave> = {}): ISeriesToSave {
	const { id, created_at, updated_at, ...toSave } = makeSeries()
	return { ...toSave, ...overrides }
}

function makeEpisodeToSave(overrides: Partial<IEpisodeToSave> = {}): IEpisodeToSave {
	return {
		episode_number: 7,
		season: 4,
		language_cas: true,
		language_lat: false,
		telegram_file_id_cas: 111,
		telegram_file_id_lat: 0,
		...overrides,
	}
}

function makeEpisode(overrides: Partial<IEpisode> = {}): IEpisode {
	return {
		...makeEpisodeToSave(),
		id: 1,
		series_id: 7,
		created_at: CREATED_AT,
		updated_at: UPDATED_AT,
		...overrides,
	}
}

function mockMarkAsProcessed() {
	vi.mocked(incomingEpisodesRepository.markEpisodeAsProcessed).mockResolvedValue({
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
	})
}

function mockSendEpisode() {
	vi.mocked(telegramService.sendEpisode).mockImplementation(
		async (messageId: number, _episodeCaption: string, _delay: ISeriesSendDelay) => messageId + 1000,
	)
}

function mockSendSeriesPoster() {
	vi.mocked(telegramService.sendSeriesPoster).mockResolvedValue(500)
}

describe('episodeService', () => {
	describe('saveSeriesWithEpisodes', () => {
		it('publishes the poster then creates the serie when no serie exists with that tmdb_id', async () => {
			const series = makeSeriesToSave()
			vi.mocked(seriesRepository.getSeries).mockResolvedValue([])
			vi.mocked(seriesRepository.saveSeries).mockResolvedValue(makeSeries())
			vi.mocked(episodeRepository.getEpisodes).mockResolvedValue([])
			mockSendSeriesPoster()
			mockMarkAsProcessed()
			mockSendEpisode()

			await episodeService.saveSeriesWithEpisodes({ episodesToSave: [makeEpisodeToSave()], series })

			expect(seriesRepository.getSeries).toHaveBeenCalledWith({ tmdb_id: 1396 })
			expect(telegramService.sendSeriesPoster).toHaveBeenCalledWith(series)
			expect(seriesRepository.saveSeries).toHaveBeenCalledWith(series)
			expect(episodeRepository.getEpisodes).toHaveBeenCalledWith({ series_id: 7 })
		})

		it('reuses the existent serie and does not create another one', async () => {
			vi.mocked(seriesRepository.getSeries).mockResolvedValue([makeSeries({ id: 42 })])
			vi.mocked(episodeRepository.getEpisodes).mockResolvedValue([])
			mockMarkAsProcessed()
			mockSendEpisode()

			await episodeService.saveSeriesWithEpisodes({ episodesToSave: [makeEpisodeToSave()], series: makeSeriesToSave() })

			expect(seriesRepository.getSeries).toHaveBeenCalledWith({ tmdb_id: 1396 })
			expect(seriesRepository.saveSeries).not.toHaveBeenCalled()
			expect(episodeRepository.getEpisodes).toHaveBeenCalledWith({ series_id: 42 })
		})

		it('saves the episodes under the row id of the serie, not its tmdb_id', async () => {
			const episodesToSave = [makeEpisodeToSave()]
			vi.mocked(seriesRepository.getSeries).mockResolvedValue([makeSeries({ id: 42 })])
			vi.mocked(episodeRepository.getEpisodes).mockResolvedValue([])
			vi.mocked(episodeRepository.saveEpisodes).mockResolvedValue([makeEpisode({ series_id: 42 })])
			mockMarkAsProcessed()
			mockSendEpisode()

			await episodeService.saveSeriesWithEpisodes({ episodesToSave, series: makeSeriesToSave() })

			expect(telegramService.sendEpisode).toHaveBeenCalledWith(111, '4x07\nEspañol castellano 🇪🇸', expect.any(Object))
			expect(episodeRepository.saveEpisodes).toHaveBeenCalledWith(42, [{ ...makeEpisodeToSave(), telegram_file_id_cas: 1111 }])
			expect(episodeRepository.updateEpisodes).not.toHaveBeenCalled()
		})

		it('marks the incoming episodes that bring nothing new as processed instead of deleting them', async () => {
			vi.mocked(seriesRepository.getSeries).mockResolvedValue([makeSeries()])
			vi.mocked(episodeRepository.getEpisodes).mockResolvedValue([makeEpisode({ language_cas: true })])
			mockMarkAsProcessed()

			await episodeService.saveSeriesWithEpisodes({
				episodesToSave: [makeEpisodeToSave({ language_cas: true })],
				series: makeSeriesToSave(),
			})

			expect(episodeRepository.saveEpisodes).not.toHaveBeenCalled()
			expect(episodeRepository.updateEpisodes).not.toHaveBeenCalled()
			expect(telegramService.sendEpisode).not.toHaveBeenCalled()
			expect(incomingEpisodesRepository.markEpisodeAsProcessed).toHaveBeenCalledWith(111)
		})

		it('does not publish the poster nor create the serie when there is no episode to save', async () => {
			vi.mocked(seriesRepository.getSeries).mockResolvedValue([])

			await episodeService.saveSeriesWithEpisodes({ episodesToSave: [], series: makeSeriesToSave() })

			expect(telegramService.sendSeriesPoster).not.toHaveBeenCalled()
			expect(seriesRepository.saveSeries).not.toHaveBeenCalled()
			expect(episodeRepository.getEpisodes).not.toHaveBeenCalled()
		})

		it('creates the serie when at least one episode was saved', async () => {
			vi.mocked(seriesRepository.getSeries).mockResolvedValue([])
			vi.mocked(seriesRepository.saveSeries).mockResolvedValue(makeSeries())
			vi.mocked(episodeRepository.getEpisodes).mockResolvedValue([])
			vi.mocked(episodeRepository.saveEpisodes).mockResolvedValue([makeEpisode()])
			mockSendSeriesPoster()
			mockMarkAsProcessed()
			mockSendEpisode()

			await episodeService.saveSeriesWithEpisodes({ episodesToSave: [makeEpisodeToSave()], series: makeSeriesToSave() })

			expect(telegramService.sendSeriesPoster).toHaveBeenCalled()
			expect(episodeRepository.saveEpisodes).toHaveBeenCalled()
		})

		it('never deletes a serie that already existed', async () => {
			vi.mocked(seriesRepository.getSeries).mockResolvedValue([makeSeries({ id: 42 })])
			vi.mocked(episodeRepository.getEpisodes).mockResolvedValue([])

			await episodeService.saveSeriesWithEpisodes({ episodesToSave: [], series: makeSeriesToSave() })

			expect(seriesRepository.saveSeries).not.toHaveBeenCalled()
			expect(seriesRepository.deleteSeries).not.toHaveBeenCalled()
		})

		it('marks every message id of the payload as processed, dropping the empty ones', async () => {
			vi.mocked(seriesRepository.getSeries).mockResolvedValue([makeSeries()])
			vi.mocked(episodeRepository.getEpisodes).mockResolvedValue([])
			vi.mocked(episodeRepository.saveEpisodes).mockResolvedValue([makeEpisode()])
			mockMarkAsProcessed()
			mockSendEpisode()

			await episodeService.saveSeriesWithEpisodes({
				episodesToSave: [
					makeEpisodeToSave({ telegram_file_id_cas: 111, telegram_file_id_lat: 222 }),
					makeEpisodeToSave({ episode_number: 8, telegram_file_id_cas: 333, telegram_file_id_lat: 0 }),
				],
				series: makeSeriesToSave(),
			})

			expect(incomingEpisodesRepository.markEpisodeAsProcessed).toHaveBeenCalledTimes(3)
			expect(incomingEpisodesRepository.markEpisodeAsProcessed).toHaveBeenCalledWith(111)
			expect(incomingEpisodesRepository.markEpisodeAsProcessed).toHaveBeenCalledWith(222)
			expect(incomingEpisodesRepository.markEpisodeAsProcessed).toHaveBeenCalledWith(333)
		})

		it('marks a message id that appears twice only once', async () => {
			vi.mocked(seriesRepository.getSeries).mockResolvedValue([makeSeries()])
			vi.mocked(episodeRepository.getEpisodes).mockResolvedValue([])
			vi.mocked(episodeRepository.saveEpisodes).mockResolvedValue([makeEpisode()])
			mockMarkAsProcessed()
			mockSendEpisode()

			await episodeService.saveSeriesWithEpisodes({
				episodesToSave: [
					makeEpisodeToSave({ telegram_file_id_cas: 111 }),
					makeEpisodeToSave({ episode_number: 8, telegram_file_id_cas: 111 }),
				],
				series: makeSeriesToSave(),
			})

			expect(incomingEpisodesRepository.markEpisodeAsProcessed).toHaveBeenCalledTimes(1)
			expect(incomingEpisodesRepository.markEpisodeAsProcessed).toHaveBeenCalledWith(111)
		})

		it('does not mark anything when the payload is empty', async () => {
			vi.mocked(seriesRepository.getSeries).mockResolvedValue([])
			vi.mocked(seriesRepository.saveSeries).mockResolvedValue(makeSeries())
			vi.mocked(episodeRepository.getEpisodes).mockResolvedValue([])

			await episodeService.saveSeriesWithEpisodes({ episodesToSave: [], series: makeSeriesToSave() })

			expect(incomingEpisodesRepository.markEpisodeAsProcessed).not.toHaveBeenCalled()
		})

		it('does not mark anything when saving the episodes fails', async () => {
			vi.mocked(seriesRepository.getSeries).mockResolvedValue([makeSeries()])
			vi.mocked(episodeRepository.getEpisodes).mockResolvedValue([])
			vi.mocked(episodeRepository.saveEpisodes).mockRejectedValue(new Error('db down'))
			mockSendEpisode()

			await expect(
				episodeService.saveSeriesWithEpisodes({ episodesToSave: [makeEpisodeToSave()], series: makeSeriesToSave() }),
			).rejects.toThrow('db down')

			expect(incomingEpisodesRepository.markEpisodeAsProcessed).not.toHaveBeenCalled()
		})

		it('throws NotFoundError when an incoming episode no longer exists', async () => {
			vi.mocked(seriesRepository.getSeries).mockResolvedValue([makeSeries()])
			vi.mocked(episodeRepository.getEpisodes).mockResolvedValue([])
			vi.mocked(incomingEpisodesRepository.markEpisodeAsProcessed).mockResolvedValue(undefined)
			mockSendEpisode()

			await expect(
				episodeService.saveSeriesWithEpisodes({ episodesToSave: [makeEpisodeToSave()], series: makeSeriesToSave() }),
			).rejects.toThrow(NotFoundError)
		})

		it('publishes the files in Telegram before writing anything to the database', async () => {
			vi.mocked(seriesRepository.getSeries).mockResolvedValue([makeSeries()])
			vi.mocked(episodeRepository.getEpisodes).mockResolvedValue([])
			vi.mocked(telegramService.sendEpisode).mockRejectedValue(new Error('telegram down'))

			await expect(
				episodeService.saveSeriesWithEpisodes({ episodesToSave: [makeEpisodeToSave()], series: makeSeriesToSave() }),
			).rejects.toThrow('telegram down')

			expect(episodeRepository.saveEpisodes).not.toHaveBeenCalled()
			expect(episodeRepository.updateEpisodes).not.toHaveBeenCalled()
			expect(incomingEpisodesRepository.markEpisodeAsProcessed).not.toHaveBeenCalled()
		})

		it('saves the episodes with the message ids returned by Telegram', async () => {
			vi.mocked(seriesRepository.getSeries).mockResolvedValue([makeSeries()])
			vi.mocked(episodeRepository.getEpisodes).mockResolvedValue([])
			vi.mocked(episodeRepository.saveEpisodes).mockResolvedValue([makeEpisode()])
			mockSendEpisode()
			mockMarkAsProcessed()

			const incoming = makeEpisodeToSave({ telegram_file_id_cas: 111, telegram_file_id_lat: 222 })

			await episodeService.saveSeriesWithEpisodes({ episodesToSave: [incoming], series: makeSeriesToSave() })

			expect(telegramService.sendEpisode).toHaveBeenNthCalledWith(1, 111, '4x07\nEspañol castellano 🇪🇸', expect.any(Object))
			expect(telegramService.sendEpisode).toHaveBeenNthCalledWith(2, 222, '4x07\nEspañol latino 🇲🇽', expect.any(Object))
			expect(episodeRepository.saveEpisodes).toHaveBeenCalledWith(7, [
				{ ...incoming, telegram_file_id_cas: 1111, telegram_file_id_lat: 1222 },
			])
		})

		it('shares the same adaptive delay across every episode of the run', async () => {
			vi.mocked(seriesRepository.getSeries).mockResolvedValue([makeSeries()])
			vi.mocked(episodeRepository.getEpisodes).mockResolvedValue([])
			vi.mocked(episodeRepository.saveEpisodes).mockResolvedValue([makeEpisode()])
			mockSendEpisode()
			mockMarkAsProcessed()

			const incoming = makeEpisodeToSave({ telegram_file_id_cas: 111, telegram_file_id_lat: 222 })

			await episodeService.saveSeriesWithEpisodes({ episodesToSave: [incoming], series: makeSeriesToSave() })

			const firstDelay = vi.mocked(telegramService.sendEpisode).mock.calls[0]![2]
			const secondDelay = vi.mocked(telegramService.sendEpisode).mock.calls[1]![2]

			expect(firstDelay).toBe(secondDelay)
		})

		it('copies only the new language when filling a cell', async () => {
			vi.mocked(seriesRepository.getSeries).mockResolvedValue([makeSeries()])
			vi.mocked(episodeRepository.getEpisodes).mockResolvedValue([
				makeEpisode({ language_cas: true, language_lat: false, telegram_file_id_cas: 555, telegram_file_id_lat: 0 }),
			])
			vi.mocked(episodeRepository.updateEpisodes).mockResolvedValue([makeEpisode()])
			mockSendEpisode()
			mockMarkAsProcessed()

			const incoming = makeEpisodeToSave({
				language_cas: false,
				language_lat: true,
				telegram_file_id_cas: 0,
				telegram_file_id_lat: 222,
			})

			await episodeService.saveSeriesWithEpisodes({ episodesToSave: [incoming], series: makeSeriesToSave() })

			expect(telegramService.sendEpisode).toHaveBeenCalledTimes(1)
			expect(telegramService.sendEpisode).toHaveBeenCalledWith(222, '4x07\nEspañol latino 🇲🇽', expect.any(Object))
			expect(episodeRepository.updateEpisodes).toHaveBeenCalledWith([{ ...incoming, id: 1, telegram_file_id_lat: 1222 }])
			expect(episodeRepository.saveEpisodes).not.toHaveBeenCalled()
		})
	})
})
