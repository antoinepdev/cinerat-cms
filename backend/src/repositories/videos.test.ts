import { describe, expect, it, type Mock, vi } from 'vitest'
import { pool } from '../database/index.ts'
import type { IIncomingVideo } from '../entities/incomingVideo.ts'
import type { IIncomingVideoFilters, IIncomingVideoInput } from '../schemas/incomingVideo.ts'
import { videosRepository } from './videos.ts'

vi.mock('../database/index.ts', () => ({ pool: { query: vi.fn() } }))

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

function makeIncomingVideoToSave(overrides: Partial<IIncomingVideoInput> = {}): IIncomingVideoInput {
	return {
		telegram_message_id: 4242,
		caption: 'Alien',
		language: 'castellano',
		is_processed: false,
		...overrides,
	}
}

function mockRows(rows: IIncomingVideo[]) {
	poolQuery.mockResolvedValue({ rows })
}

function calledSql(call = 0) {
	return poolQuery.mock.calls[call]![0]
}

function calledValues(call = 0) {
	return poolQuery.mock.calls[call]![1]
}

function orderByClause(call = 0) {
	const sql = calledSql(call)
	return sql.slice(sql.indexOf('order by'))
}

describe('videosRepository.getVideos', () => {
	it('does not filter by is_processed when no filter is given', async () => {
		mockRows([])

		await videosRepository.getVideos({})

		expect(calledSql()).not.toContain('where')
		expect(calledValues()).toEqual([])
	})

	it('keeps the historical order by id when no sort_by is given', async () => {
		mockRows([])

		await videosRepository.getVideos({})

		expect(orderByClause()).toBe('order by id')
	})

	it.each([true, false])('filters by the is_processed %s value with a placeholder', async (is_processed) => {
		mockRows([])

		await videosRepository.getVideos({ is_processed })

		expect(calledSql()).toContain('where is_processed = $1')
		expect(calledValues()).toEqual([is_processed])
	})

	it('never interpolates the is_processed filter into the query', async () => {
		mockRows([])

		await videosRepository.getVideos({ is_processed: true })

		expect(calledSql()).not.toContain('is_processed = true')
	})

	it.for<NonNullable<IIncomingVideoFilters['sort_by']>>(['id', 'created_at', 'updated_at'])(
		'orders by %s descending when no sort_direction is given',
		async (sort_by) => {
			mockRows([])

			await videosRepository.getVideos({ sort_by })

			expect(orderByClause()).toBe(`order by ${sort_by} desc`)
		},
	)

	it.for(['asc', 'desc'] as const)('orders by created_at %s when asked for it', async (sort_direction) => {
		mockRows([])

		await videosRepository.getVideos({ sort_by: 'created_at', sort_direction })

		expect(orderByClause()).toBe(`order by created_at ${sort_direction}`)
	})

	it.for(['id', 'created_at', 'updated_at'] as const)('orders %s ascending when sort_direction is asc', async (sort_by) => {
		mockRows([])

		await videosRepository.getVideos({ sort_by, sort_direction: 'asc' })

		expect(orderByClause()).toBe(`order by ${sort_by} asc`)
	})

	it.for(['duration', 'is_processed', 'title_en; DROP TABLE incoming_videos--'])(
		'keeps the default order by for the invalid sort_by %s',
		async (sort_by) => {
			mockRows([])

			await videosRepository.getVideos({ sort_by } as unknown as IIncomingVideoFilters)

			expect(orderByClause()).toBe('order by id')
		},
	)

	it.for(['asc; DROP TABLE incoming_videos--', 'DESC', 'descending', 'up', 'desc asc'])(
		'never interpolates the invalid sort_direction %s and falls back to desc',
		async (sort_direction) => {
			mockRows([])

			await videosRepository.getVideos({
				sort_by: 'created_at',
				sort_direction,
			} as unknown as IIncomingVideoFilters)

			expect(orderByClause()).toBe('order by created_at desc')
			expect(orderByClause()).not.toContain(sort_direction)
		},
	)

	it.for(['created_at', 'updated_at'])('projects the %s column', async (column) => {
		mockRows([])

		await videosRepository.getVideos({})

		expect(calledSql()).toMatch(new RegExp(`^SELECT [\\s\\S]*${column}[\\s\\S]* from incoming_videos `))
	})

	it('projects the whole incoming video shape instead of relying on select *', async () => {
		mockRows([])

		await videosRepository.getVideos({})

		expect(calledSql()).not.toContain('SELECT *')
	})

	it('keeps the filter and the order by in the same query', async () => {
		mockRows([])

		await videosRepository.getVideos({ is_processed: true, sort_by: 'updated_at', sort_direction: 'asc' })

		expect(calledSql().indexOf('where')).toBeLessThan(calledSql().indexOf('order by'))
		expect(calledValues()).toEqual([true])
	})

	it('returns the rows in the order given by the database', async () => {
		const videos = [makeIncomingVideo({ id: 1 }), makeIncomingVideo({ id: 2 })]
		mockRows(videos)

		const result = await videosRepository.getVideos({ sort_by: 'id', sort_direction: 'asc' })

		expect(result).toEqual(videos)
	})
})

describe('videosRepository.saveIncomingVideo', () => {
	it('inserts the caption, the language and the processed flag', async () => {
		poolQuery.mockResolvedValue({ rows: [] })

		await videosRepository.saveIncomingVideo(makeIncomingVideoToSave())

		expect(poolQuery).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO incoming_videos'), [
			4242,
			'Alien',
			'castellano',
			false,
		])
	})

	it('leaves the timestamps out of the insert so the database fills them', async () => {
		poolQuery.mockResolvedValue({ rows: [] })

		await videosRepository.saveIncomingVideo(makeIncomingVideoToSave())

		const insertedColumns = calledSql().slice(0, calledSql().indexOf(') Values'))
		expect(insertedColumns).not.toContain('created_at')
		expect(insertedColumns).not.toContain('updated_at')
	})
})

describe('videosRepository.markVideoAsProcessed', () => {
	it('marks the video as processed by its telegram message id', async () => {
		mockRows([makeIncomingVideo({ is_processed: true })])

		const result = await videosRepository.markVideoAsProcessed(4242)

		expect(calledSql()).toContain('UPDATE incoming_videos SET is_processed = true WHERE telegram_message_id = $1')
		expect(calledValues()).toEqual([4242])
		expect(result?.is_processed).toBe(true)
	})

	it.for(['created_at', 'updated_at'])('returns the %s column so the caller sees the processing time', async (column) => {
		mockRows([makeIncomingVideo()])

		await videosRepository.markVideoAsProcessed(4242)

		expect(calledSql()).toContain(`${column}`)
	})

	it('does not set updated_at by hand, the trigger owns it', async () => {
		mockRows([makeIncomingVideo()])

		await videosRepository.markVideoAsProcessed(4242)

		const setClause = calledSql().slice(calledSql().indexOf('SET'), calledSql().indexOf(' WHERE'))
		expect(setClause).toBe('SET is_processed = true')
		expect(setClause).not.toContain('updated_at')
	})

	it('returns undefined when no row matches', async () => {
		poolQuery.mockResolvedValue({ rows: [] })

		const result = await videosRepository.markVideoAsProcessed(9999)

		expect(result).toBeUndefined()
	})
})

describe('videosRepository.deleteIncomingVideo', () => {
	it('deletes the video by id', async () => {
		poolQuery.mockResolvedValue({ rows: [{ id: 1 }] } as unknown as { rows: IIncomingVideo[] })

		const result = await videosRepository.deleteIncomingVideo(1)

		expect(calledSql()).toContain('DELETE FROM incoming_videos WHERE id = $1')
		expect(calledValues()).toEqual([1])
		expect(result).toEqual({ id: 1 })
	})
})
