import request from 'supertest'
import type { Mock } from 'vitest'
import { beforeEach, describe, expect, it, vi } from 'vitest'

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
	beforeEach(() => poolQuery.mockReset())

	it('returns the pending incoming videos', async () => {
		poolQuery.mockResolvedValue({ rows: [] })

		const res = await request(app).get('/videos/pending').expect(200)

		expect(res.body).toEqual([])
		expect(poolQuery).toHaveBeenCalledTimes(1)
		expect(poolQuery.mock.calls[0]![0]).toContain('is_processed = false')
	})
})
