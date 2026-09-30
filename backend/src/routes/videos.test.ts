import request from 'supertest'
import type { Mock } from 'vitest'
import { describe, expect, it, vi } from 'vitest'

import { pool } from '../database/index.ts'
import type { IIncomingVideo } from '../entities/incomingVideo.ts'
import { app } from '../server.ts'

vi.mock('../database/index.ts', () => ({ pool: { query: vi.fn() } }))
vi.mock('../provider/telegram.ts', () => ({
	bot: { sendPhoto: vi.fn(), copyMessage: vi.fn() },
	MOVIE_CONTAINER_GROUP_ID: 111,
	MOVIE_LISTENER_GROUP_ID: 222,
}))

const poolQuery = vi.mocked(pool).query as unknown as Mock<
	(text: string, values?: unknown[]) => Promise<{ rows: IIncomingVideo[] }>
>

const CREATED_AT = new Date('2026-01-15T10:00:00.000Z')
const UPDATED_AT = new Date('2026-02-20T18:30:00.000Z')

function makeIncomingVideo(overrides: Partial<IIncomingVideo> = {}): IIncomingVideo {
	return {
		id: 1,
		telegram_message_id: 4242,
		caption: 'Alien',
		language: 'castellano',
		is_processed: false,
		created_at: CREATED_AT,
		updated_at: UPDATED_AT,
		...overrides,
	}
}

function toIncomingVideoJson(video: IIncomingVideo) {
	return { ...video, created_at: video.created_at.toISOString(), updated_at: video.updated_at.toISOString() }
}

describe('GET /videos', () => {
	it('returns the incoming videos', async () => {
		poolQuery.mockResolvedValue({ rows: [] })

		const res = await request(app).get('/videos').expect(200)

		expect(res.body).toEqual([])
		expect(poolQuery).toHaveBeenCalledTimes(1)
		expect(poolQuery.mock.calls[0]![0]).toContain('from incoming_videos')
	})

	it('does not filter by is_processed by default', async () => {
		poolQuery.mockResolvedValue({ rows: [] })

		await request(app).get('/videos').expect(200)

		expect(poolQuery.mock.calls[0]![0]).not.toContain('where')
		expect(poolQuery.mock.calls[0]![1]).toEqual([])
	})

	it('returns the creation and modification timestamps as ISO 8601 in UTC', async () => {
		poolQuery.mockResolvedValue({ rows: [makeIncomingVideo()] })

		const res = await request(app).get('/videos').expect(200)

		expect(res.body).toEqual([toIncomingVideoJson(makeIncomingVideo())])
		expect(res.body[0].created_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
		expect(res.body[0].updated_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
	})

	it.each(['true', 'false'])('forwards the is_processed %s filter down to the SQL query', async (is_processed) => {
		poolQuery.mockResolvedValue({ rows: [] })

		await request(app).get(`/videos?is_processed=${is_processed}`).expect(200)

		expect(poolQuery.mock.calls[0]![0]).toContain('where is_processed = $1')
		expect(poolQuery.mock.calls[0]![1]).toEqual([is_processed === 'true'])
	})

	it('rejects a non boolean is_processed with 422 problem+json', async () => {
		const res = await request(app).get('/videos?is_processed=maybe').expect(422)

		expect(res.headers['content-type']).toContain('application/problem+json')
		expect(res.body).toMatchObject({ status: 422, title: 'Unprocessable Entity', detail: 'Invalid query params' })
		expect(poolQuery).not.toHaveBeenCalled()
	})

	it('does not read is_processed=false as true', async () => {
		poolQuery.mockResolvedValue({ rows: [] })

		await request(app).get('/videos?is_processed=false').expect(200)

		expect(poolQuery.mock.calls[0]![1]).toEqual([false])
	})

	it('sorts by created_at descending by default', async () => {
		poolQuery.mockResolvedValue({ rows: [makeIncomingVideo()] })

		await request(app).get('/videos?sort_by=created_at').expect(200)

		expect(poolQuery.mock.calls[0]![0]).toContain('order by created_at desc')
	})

	it.each(['created_at', 'updated_at'])('sorts by %s ascending when requested', async (sort_by) => {
		poolQuery.mockResolvedValue({ rows: [] })

		await request(app).get(`/videos?sort_by=${sort_by}&sort_direction=asc`).expect(200)

		expect(poolQuery.mock.calls[0]![0]).toContain(`order by ${sort_by} asc`)
	})

	it('keeps the default order by id when no sort_by is given', async () => {
		poolQuery.mockResolvedValue({ rows: [] })

		await request(app).get('/videos?is_processed=true').expect(200)

		expect(poolQuery.mock.calls[0]![0]).toContain('order by id')
	})

	it('combines the is_processed filter with the sorting', async () => {
		poolQuery.mockResolvedValue({ rows: [] })

		await request(app).get('/videos?is_processed=true&sort_by=updated_at&sort_direction=asc').expect(200)

		expect(poolQuery.mock.calls[0]![0]).toContain('where is_processed = $1')
		expect(poolQuery.mock.calls[0]![0]).toContain('order by updated_at asc')
		expect(poolQuery.mock.calls[0]![1]).toEqual([true])
	})

	it('rejects an unknown sort_by with 422 problem+json', async () => {
		const res = await request(app).get('/videos?sort_by=invalid').expect(422)

		expect(res.body).toMatchObject({ status: 422, detail: 'Invalid query params' })
		expect(poolQuery).not.toHaveBeenCalled()
	})

	it('rejects sort_direction without sort_by with 422 problem+json', async () => {
		const res = await request(app).get('/videos?sort_direction=asc').expect(422)

		expect(res.body).toMatchObject({
			status: 422,
			detail: 'If you use sort_direction filter you need also specify sort_by filter',
		})
		expect(poolQuery).not.toHaveBeenCalled()
	})
})

describe('DELETE /videos/:id', () => {
	it('deletes an existing incoming video and returns 204', async () => {
		poolQuery.mockResolvedValue({ rows: [{ id: 1 }] } as unknown as { rows: IIncomingVideo[] })

		const res = await request(app).delete('/videos/1').expect(204)

		expect(res.body).toEqual({})
		expect(poolQuery).toHaveBeenCalledTimes(1)
		expect(poolQuery.mock.calls[0]![0]).toContain('DELETE FROM incoming_videos WHERE id = $1')
		expect(poolQuery.mock.calls[0]![1]).toEqual([1])
	})

	it('returns 404 problem+json when the incoming video does not exist', async () => {
		poolQuery.mockResolvedValue({ rows: [] })

		const res = await request(app).delete('/videos/999').expect(404)

		expect(res.headers['content-type']).toContain('application/problem+json')
		expect(res.body).toMatchObject({ status: 404, title: 'Not Found', detail: 'Incoming video not found' })
	})

	it('rejects a non-numeric id with 422 problem+json', async () => {
		const res = await request(app).delete('/videos/abc').expect(422)

		expect(res.headers['content-type']).toContain('application/problem+json')
		expect(res.body).toMatchObject({ status: 422, title: 'Unprocessable Entity', detail: 'Invalid video id' })
		expect(poolQuery).not.toHaveBeenCalled()
	})
})
