import request from 'supertest'
import type { Mock } from 'vitest'
import { describe, expect, it, vi } from 'vitest'

import { pool } from '../database/index.ts'
import type { IIncomingEpisode } from '../entities/incomingEpisode.ts'
import { app } from '../server.ts'

vi.mock('../database/index.ts', () => ({ pool: { query: vi.fn() } }))
vi.mock('../provider/telegram.ts', () => ({
	bot: { sendPhoto: vi.fn(), copyMessage: vi.fn() },
	MOVIE_CONTAINER_GROUP_ID: 111,
	MOVIE_LISTENER_GROUP_ID: 222,
	SERIES_CONTAINER_GROUP_ID: 333,
	SERIES_LISTENER_GROUP_ID: 444,
	SERIES_SEND_MAX_ATTEMPTS: 3,
}))

const poolQuery = vi.mocked(pool).query as unknown as Mock<
	(text: string, values?: unknown[]) => Promise<{ rows: IIncomingEpisode[] }>
>

const CREATED_AT = new Date('2026-01-15T10:00:00.000Z')
const UPDATED_AT = new Date('2026-02-20T18:30:00.000Z')

function makeIncomingEpisode(overrides: Partial<IIncomingEpisode> = {}): IIncomingEpisode {
	return {
		id: 1,
		message_id: 4242,
		caption: 'Breaking Bad s04e07',
		episode_number: 7,
		season: 4,
		language: 'castellano',
		batch_id: 555,
		batch_name: 'Breaking Bad',
		is_processed: false,
		created_at: CREATED_AT,
		updated_at: UPDATED_AT,
		...overrides,
	}
}

function toIncomingEpisodeJson(episode: IIncomingEpisode) {
	return { ...episode, created_at: episode.created_at.toISOString(), updated_at: episode.updated_at.toISOString() }
}

describe('GET /incoming-episodes', () => {
	it('returns the incoming episodes', async () => {
		poolQuery.mockResolvedValue({ rows: [] })

		const res = await request(app).get('/incoming-episodes').expect(200)

		expect(res.body).toEqual([])
		expect(poolQuery).toHaveBeenCalledTimes(1)
		expect(poolQuery.mock.calls[0]![0]).toContain('from incoming_episodes')
	})

	it('does not filter by is_processed by default', async () => {
		poolQuery.mockResolvedValue({ rows: [] })

		await request(app).get('/incoming-episodes').expect(200)

		expect(poolQuery.mock.calls[0]![0]).not.toContain('where')
		expect(poolQuery.mock.calls[0]![1]).toEqual([])
	})

	it('returns the timestamps as ISO 8601 in UTC', async () => {
		poolQuery.mockResolvedValue({ rows: [makeIncomingEpisode()] })

		const res = await request(app).get('/incoming-episodes').expect(200)

		expect(res.body).toEqual([toIncomingEpisodeJson(makeIncomingEpisode())])
		expect(res.body[0].created_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
	})

	it.each(['true', 'false'])('forwards the is_processed %s filter down to the SQL query', async (is_processed) => {
		poolQuery.mockResolvedValue({ rows: [] })

		await request(app).get(`/incoming-episodes?is_processed=${is_processed}`).expect(200)

		expect(poolQuery.mock.calls[0]![0]).toContain('where is_processed = $1')
		expect(poolQuery.mock.calls[0]![1]).toEqual([is_processed === 'true'])
	})

	it('forwards the season and episode_number filters', async () => {
		poolQuery.mockResolvedValue({ rows: [] })

		await request(app).get('/incoming-episodes?season=4&episode_number=7').expect(200)

		expect(poolQuery.mock.calls[0]![0]).toContain('where season = $1 and episode_number = $2')
		expect(poolQuery.mock.calls[0]![1]).toEqual([4, 7])
	})

	it('sorts by updated_at ascending when requested', async () => {
		poolQuery.mockResolvedValue({ rows: [] })

		await request(app).get('/incoming-episodes?sort_by=updated_at&sort_direction=asc').expect(200)

		expect(poolQuery.mock.calls[0]![0]).toContain('order by updated_at asc')
	})

	it('rejects an unknown sort_by with 422 problem+json', async () => {
		const res = await request(app).get('/incoming-episodes?sort_by=invalid').expect(422)

		expect(res.headers['content-type']).toContain('application/problem+json')
		expect(res.body).toMatchObject({ status: 422, detail: 'Invalid query params' })
		expect(poolQuery).not.toHaveBeenCalled()
	})

	it('rejects sort_direction without sort_by with 422 problem+json', async () => {
		const res = await request(app).get('/incoming-episodes?sort_direction=asc').expect(422)

		expect(res.body).toMatchObject({
			status: 422,
			detail: 'If you use sort_direction filter you need also specify sort_by filter',
		})
		expect(poolQuery).not.toHaveBeenCalled()
	})
})
