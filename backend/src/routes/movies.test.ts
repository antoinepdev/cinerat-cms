import request from 'supertest'
import type { Mock } from 'vitest'
import { describe, expect, it, vi } from 'vitest'

import { pool } from '../database/index.ts'
import type { IMovie } from '../entities/movie.ts'
import { bot, MOVIE_CONTAINER_GROUP_ID, MOVIE_LISTENER_GROUP_ID } from '../provider/telegram.ts'
import { app } from '../server.ts'

vi.mock('../database/index.ts', () => ({ pool: { query: vi.fn() } }))
vi.mock('../provider/telegram.ts', () => ({
	bot: { sendPhoto: vi.fn(), copyMessage: vi.fn() },
	MOVIE_CONTAINER_GROUP_ID: 111,
	MOVIE_LISTENER_GROUP_ID: 222,
}))

const poolQuery = vi.mocked(pool).query as unknown as Mock<(text: string, values?: unknown[]) => Promise<{ rows: IMovie[] }>>
const sendPhoto = vi.mocked(bot.sendPhoto) as unknown as Mock<(...args: unknown[]) => Promise<{ message_id: number }>>
const copyMessage = vi.mocked(bot.copyMessage) as unknown as Mock<(...args: unknown[]) => Promise<{ message_id: number }>>

const CREATED_AT = new Date('2026-01-15T10:00:00.000Z')
const UPDATED_AT = new Date('2026-02-20T18:30:00.000Z')

function makeMovie(overrides: Partial<IMovie> = {}): IMovie {
	return {
		id: 1,
		title_en: 'Avatar',
		year: 2009,
		language_cas: false,
		language_lat: false,
		poster: 'https://example.com/poster.jpg',
		description: 'A paraplegic marine dispatched to the moon Pandora.',
		tmdb_id: 19995,
		popularity: 100,
		backdrop_path: 'https://example.com/backdrop.jpg',
		genres: ['Action', 'Adventure'],
		telegram_poster_id: 500,
		catalog_name: 'test-catalog',
		catalog_version: 1,
		created_at: CREATED_AT,
		updated_at: UPDATED_AT,
		...overrides,
	}
}

// res.json() serializes the Dates that the pg driver returns into ISO 8601 strings
function toMovieJson(movie: IMovie) {
	return { ...movie, created_at: movie.created_at.toISOString(), updated_at: movie.updated_at.toISOString() }
}

describe('GET /movies', () => {
	it('returns the movies and forwards the filters down to the SQL query', async () => {
		poolQuery.mockResolvedValue({ rows: [makeMovie()] })

		const res = await request(app).get('/movies?catalog_name=kids').expect(200)

		expect(res.body).toEqual([toMovieJson(makeMovie())])
		expect(poolQuery).toHaveBeenCalledTimes(1)
		expect(poolQuery.mock.calls[0]![0]).toContain('where catalog_name = $1')
		expect(poolQuery.mock.calls[0]![1]).toEqual(['kids'])
	})

	it('rejects an unknown sort_by with 422 problem+json', async () => {
		const res = await request(app).get('/movies?sort_by=invalid').expect(422)

		expect(res.headers['content-type']).toContain('application/problem+json')
		expect(res.body).toMatchObject({ status: 422, title: 'Unprocessable Entity', detail: 'Invalid query params' })
	})

	it('sorts by popularity descending by default', async () => {
		poolQuery.mockResolvedValue({ rows: [makeMovie()] })

		const res = await request(app).get('/movies?sort_by=popularity').expect(200)

		expect(res.body).toEqual([toMovieJson(makeMovie())])
		expect(poolQuery.mock.calls[0]![0]).toContain('order by popularity desc')
	})

	it.for(['asc', 'desc'])('sorts by popularity %s when requested', async (sort_direction) => {
		poolQuery.mockResolvedValue({ rows: [makeMovie()] })

		await request(app).get(`/movies?sort_by=popularity&sort_direction=${sort_direction}`).expect(200)

		expect(poolQuery).toHaveBeenCalledTimes(1)
		expect(poolQuery.mock.calls[0]![0]).toContain(`order by popularity ${sort_direction}`)
	})

	it.for(['created_at', 'updated_at'])('sorts by %s descending by default over http', async (sort_by) => {
		poolQuery.mockResolvedValue({ rows: [makeMovie()] })

		await request(app).get(`/movies?sort_by=${sort_by}`).expect(200)

		expect(poolQuery).toHaveBeenCalledTimes(1)
		expect(poolQuery.mock.calls[0]![0]).toContain(`order by ${sort_by} desc`)
	})

	it.for(['created_at', 'updated_at'])('sorts by %s asc when requested over http', async (sort_by) => {
		poolQuery.mockResolvedValue({ rows: [makeMovie()] })

		await request(app).get(`/movies?sort_by=${sort_by}&sort_direction=asc`).expect(200)

		expect(poolQuery).toHaveBeenCalledTimes(1)
		expect(poolQuery.mock.calls[0]![0]).toContain(`order by ${sort_by} asc`)
	})

	it.for(['created_at', 'updated_at'] as const)('serializes the %s timestamp as ISO 8601 in UTC', async (column) => {
		poolQuery.mockResolvedValue({ rows: [makeMovie()] })

		const res = await request(app).get('/movies').expect(200)

		expect(res.body[0][column]).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
		expect(res.body[0][column]).toBe(toMovieJson(makeMovie())[column])
	})

	it('returns the creation and modification timestamps of every movie', async () => {
		poolQuery.mockResolvedValue({ rows: [makeMovie()] })

		const res = await request(app).get('/movies').expect(200)

		expect(res.body[0]).toMatchObject({
			created_at: CREATED_AT.toISOString(),
			updated_at: UPDATED_AT.toISOString(),
		})
	})

	it('combines the sorting with the filters in the same query', async () => {
		poolQuery.mockResolvedValue({ rows: [makeMovie()] })

		await request(app).get('/movies?catalog_name=kids&year=2020&sort_by=popularity&sort_direction=asc').expect(200)

		expect(poolQuery.mock.calls[0]![0]).toContain('where catalog_name = $1 and year = $2')
		expect(poolQuery.mock.calls[0]![0]).toContain('order by popularity asc')
		expect(poolQuery.mock.calls[0]![1]).toEqual(['kids', 2020])
	})

	it('does not sort the movies when no sort_by is given', async () => {
		poolQuery.mockResolvedValue({ rows: [makeMovie()] })

		await request(app).get('/movies').expect(200)

		expect(poolQuery.mock.calls[0]![0]).not.toContain('order by')
	})

	it.for(['sideways', 'DESC', 'ascending', 'desc%20asc'])(
		'rejects the invalid sort_direction %s with 422 problem+json without touching the database',
		async (sort_direction) => {
			const res = await request(app).get(`/movies?sort_by=popularity&sort_direction=${sort_direction}`).expect(422)

			expect(res.body).toMatchObject({ status: 422, detail: 'Invalid query params' })
			expect(poolQuery).not.toHaveBeenCalled()
		},
	)

	it('rejects a repeated sort_direction with 422 problem+json', async () => {
		const res = await request(app).get('/movies?sort_by=popularity&sort_direction=asc&sort_direction=desc').expect(422)

		expect(res.body).toMatchObject({ status: 422, detail: 'Invalid query params' })
		expect(poolQuery).not.toHaveBeenCalled()
	})

	it('rejects sort_direction without sort_by with 422 problem+json', async () => {
		const res = await request(app).get('/movies?sort_direction=desc').expect(422)

		expect(res.body).toMatchObject({
			status: 422,
			detail: 'If you use sort_direction filter you need also specify sort_by filter',
		})
		expect(poolQuery).not.toHaveBeenCalled()
	})

	it('rejects catalog_version without catalog_name with 422 problem+json', async () => {
		const res = await request(app).get('/movies?catalog_version=1').expect(422)

		expect(res.body).toMatchObject({
			status: 422,
			detail: 'If you use catalog_version filter you need also specify catalog_name filter',
		})
	})
})

describe('POST /movies', () => {
	const validBody = {
		title_en: 'Avatar',
		year: 2009,
		poster: 'https://example.com/poster.jpg',
		description: 'A paraplegic marine dispatched to the moon Pandora.',
		tmdb_id: 19995,
		popularity: 100,
		backdrop_path: 'https://example.com/backdrop.jpg',
		genres: ['Action', 'Adventure'],
		language_cas: true,
		telegram_file_id_cas: 12,
		catalog_name: 'test-catalog',
		catalog_version: 1,
	}

	it('sends the poster and the movie to Telegram, saves the movie and returns 201', async () => {
		sendPhoto.mockResolvedValue({ message_id: 500 })
		copyMessage.mockResolvedValue({ message_id: 501 })
		poolQuery
			.mockResolvedValueOnce({ rows: [makeMovie()] }) // INSERT the saved movie
			.mockResolvedValueOnce({ rows: [makeMovie()] }) // mark incoming video as processed

		const res = await request(app).post('/movies').send(validBody).expect(201)

		expect(res.body).toEqual(toMovieJson(makeMovie()))
		expect(sendPhoto).toHaveBeenCalledTimes(1)
		expect(sendPhoto).toHaveBeenCalledWith(MOVIE_CONTAINER_GROUP_ID, validBody.poster, expect.any(Object))
		expect(copyMessage).toHaveBeenCalledTimes(1)
		expect(copyMessage).toHaveBeenCalledWith(
			MOVIE_CONTAINER_GROUP_ID,
			MOVIE_LISTENER_GROUP_ID,
			validBody.telegram_file_id_cas,
			expect.any(Object),
		)
		expect(poolQuery).toHaveBeenCalledTimes(2)
	})

	it('rejects an invalid body with 422 problem+json without touching Telegram nor the database', async () => {
		const res = await request(app).post('/movies').send({ title_en: 'Avatar', year: 2009 }).expect(422)

		expect(res.body).toMatchObject({ status: 422, title: 'Unprocessable Entity' })
		expect(sendPhoto).not.toHaveBeenCalled()
		expect(copyMessage).not.toHaveBeenCalled()
		expect(poolQuery).not.toHaveBeenCalled()
	})

	it('rejects a malformed JSON body with 400 problem+json', async () => {
		const res = await request(app).post('/movies').set('Content-Type', 'application/json').send('{not valid json').expect(400)

		expect(res.headers['content-type']).toContain('application/problem+json')
		expect(res.body).toMatchObject({ status: 400, title: 'Bad Request' })
	})
})

describe('PATCH /movies', () => {
	it('adds a new audio file to an existing movie and returns 200', async () => {
		copyMessage.mockResolvedValue({ message_id: 601 })
		const updated = makeMovie({ telegram_file_id_cas: 601 })
		poolQuery
			.mockResolvedValueOnce({ rows: [makeMovie()] }) // find existing movie by tmdb_id (no audio yet)
			.mockResolvedValueOnce({ rows: [updated] }) // update the movie
			.mockResolvedValueOnce({ rows: [makeMovie()] }) // mark incoming video as processed

		const res = await request(app).patch('/movies').send({ tmdb_id: 19995, telegram_file_id_cas: 12 }).expect(200)

		expect(res.body).toEqual(toMovieJson(updated))
		expect(copyMessage).toHaveBeenCalledTimes(1)
		expect(poolQuery).toHaveBeenCalledTimes(3)
	})

	it('returns 404 problem+json when the movie does not exist', async () => {
		poolQuery.mockResolvedValue({ rows: [] })

		const res = await request(app).patch('/movies').send({ tmdb_id: 999, telegram_file_id_lat: 12 }).expect(404)

		expect(res.body).toMatchObject({ status: 404, title: 'Not Found' })
		expect(copyMessage).not.toHaveBeenCalled()
		expect(poolQuery).toHaveBeenCalledTimes(1)
	})

	it('returns 409 problem+json when the movie already has that audio', async () => {
		poolQuery.mockResolvedValue({ rows: [makeMovie({ language_cas: true })] })

		const res = await request(app).patch('/movies').send({ tmdb_id: 19995, telegram_file_id_cas: 12 }).expect(409)

		expect(res.body).toMatchObject({ status: 409, title: 'Conflict', detail: 'Movie already has castellano audio' })
		expect(copyMessage).not.toHaveBeenCalled()
		expect(poolQuery).toHaveBeenCalledTimes(1)
	})

	it('returns 409 problem+json naming both languages when the movie already has both audios', async () => {
		poolQuery.mockResolvedValue({ rows: [makeMovie({ language_cas: true, language_lat: true })] })

		const res = await request(app)
			.patch('/movies')
			.send({ tmdb_id: 19995, telegram_file_id_cas: 12, telegram_file_id_lat: 13 })
			.expect(409)

		expect(res.body).toMatchObject({
			status: 409,
			title: 'Conflict',
			detail: 'Movie already has castellano and latino audio',
		})
		expect(copyMessage).not.toHaveBeenCalled()
		expect(poolQuery).toHaveBeenCalledTimes(1)
	})
})
