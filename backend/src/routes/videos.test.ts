import request from 'supertest'
import type { Mock } from 'vitest'
import { describe, expect, it, vi } from 'vitest'

import { pool } from '../database/index.ts'
import type { IIncomingVideo } from '../entities/movie.ts'
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

describe('GET /videos/pending', () => {
	it('returns the pending incoming videos', async () => {
		poolQuery.mockResolvedValue({ rows: [] })

		const res = await request(app).get('/videos/pending').expect(200)

		expect(res.body).toEqual([])
		expect(poolQuery).toHaveBeenCalledTimes(1)
		expect(poolQuery.mock.calls[0]![0]).toContain('is_processed = false')
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
