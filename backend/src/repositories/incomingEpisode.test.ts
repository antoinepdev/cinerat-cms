import { describe, expect, it, type Mock, vi } from 'vitest'
import { pool } from '../database/index.ts'
import type { IIncomingEpisode, IIncomingEpisodeToSave } from '../entities/incomingEpisode.ts'
import type { IIncomingEpisodeFilters } from '../schemas/incomingEpisode.ts'
import { incomingEpisodesRepository } from './incomingEpisode.ts'

vi.mock('../database/index.ts', () => ({ pool: { query: vi.fn() } }))

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

function mockRows(rows: IIncomingEpisode[]) {
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

describe('incomingEpisodesRepository.getIncomingEpisodes', () => {
	it('does not filter when no filter is given', async () => {
		mockRows([])

		await incomingEpisodesRepository.getIncomingEpisodes({})

		expect(calledSql()).not.toContain('where')
		expect(calledValues()).toEqual([])
	})

	it('keeps the historical order by id when no sort_by is given', async () => {
		mockRows([])

		await incomingEpisodesRepository.getIncomingEpisodes({})

		expect(orderByClause()).toBe('order by id')
	})

	it.each([true, false])('filters by the is_processed %s value with a placeholder', async (is_processed) => {
		mockRows([])

		await incomingEpisodesRepository.getIncomingEpisodes({ is_processed })

		expect(calledSql()).toContain('where is_processed = $1')
		expect(calledValues()).toEqual([is_processed])
	})

	it('filters by season and episode_number with placeholders', async () => {
		mockRows([])

		await incomingEpisodesRepository.getIncomingEpisodes({ season: 4, episode_number: 7 })

		expect(calledSql()).toContain('where season = $1 and episode_number = $2')
		expect(calledValues()).toEqual([4, 7])
	})

	it('keeps the is_processed, season and episode_number filters together', async () => {
		mockRows([])

		await incomingEpisodesRepository.getIncomingEpisodes({ is_processed: false, season: 4, episode_number: 7 })

		expect(calledSql()).toContain('where is_processed = $1 and season = $2 and episode_number = $3')
		expect(calledValues()).toEqual([false, 4, 7])
	})

	it('never interpolates the filters into the query', async () => {
		mockRows([])

		await incomingEpisodesRepository.getIncomingEpisodes({ is_processed: true, season: 4, episode_number: 7 })

		expect(calledSql()).not.toContain('is_processed = true')
		expect(calledSql()).not.toContain('season = 4')
		expect(calledSql()).not.toContain('episode_number = 7')
	})

	it.for<NonNullable<IIncomingEpisodeFilters['sort_by']>>(['id', 'created_at', 'updated_at'])(
		'orders by %s descending when no sort_direction is given',
		async (sort_by) => {
			mockRows([])

			await incomingEpisodesRepository.getIncomingEpisodes({ sort_by })

			expect(orderByClause()).toBe(`order by ${sort_by} desc`)
		},
	)

	it.for(['id', 'created_at', 'updated_at'] as const)('orders %s ascending when sort_direction is asc', async (sort_by) => {
		mockRows([])

		await incomingEpisodesRepository.getIncomingEpisodes({ sort_by, sort_direction: 'asc' })

		expect(orderByClause()).toBe(`order by ${sort_by} asc`)
	})

	it.for(['season', 'is_processed', 'id; DROP TABLE incoming_episodes--'])(
		'keeps the default order by for the invalid sort_by %s',
		async (sort_by) => {
			mockRows([])

			await incomingEpisodesRepository.getIncomingEpisodes({ sort_by } as unknown as IIncomingEpisodeFilters)

			expect(orderByClause()).toBe('order by id')
		},
	)

	it.for(['asc; DROP TABLE incoming_episodes--', 'DESC', 'descending', 'up', 'desc asc'])(
		'never interpolates the invalid sort_direction %s and falls back to desc',
		async (sort_direction) => {
			mockRows([])

			await incomingEpisodesRepository.getIncomingEpisodes({
				sort_by: 'created_at',
				sort_direction,
			} as unknown as IIncomingEpisodeFilters)

			expect(orderByClause()).toBe('order by created_at desc')
			expect(orderByClause()).not.toContain(sort_direction)
		},
	)

	it('projects the whole incoming episode shape instead of relying on select *', async () => {
		mockRows([])

		await incomingEpisodesRepository.getIncomingEpisodes({})

		expect(calledSql()).not.toContain('SELECT *')
		expect(calledSql()).toMatch(/^SELECT [\s\S]*language[\s\S]* from incoming_episodes /)
	})

	it('keeps the filter and the order by in the same query', async () => {
		mockRows([])

		await incomingEpisodesRepository.getIncomingEpisodes({ season: 4, sort_by: 'updated_at', sort_direction: 'asc' })

		expect(calledSql().indexOf('where')).toBeLessThan(calledSql().indexOf('order by'))
		expect(calledValues()).toEqual([4])
	})

	it('returns the rows in the order given by the database', async () => {
		const episodes = [makeIncomingEpisode({ id: 1 }), makeIncomingEpisode({ id: 2 })]
		mockRows(episodes)

		const result = await incomingEpisodesRepository.getIncomingEpisodes({ sort_by: 'id', sort_direction: 'asc' })

		expect(result).toEqual(episodes)
	})
})

describe('incomingEpisodesRepository.markEpisodeAsProcessed', () => {
	it('marks the episode as processed by its message id', async () => {
		mockRows([makeIncomingEpisode({ is_processed: true })])

		const result = await incomingEpisodesRepository.markEpisodeAsProcessed(4242)

		expect(calledSql()).toContain('UPDATE incoming_episodes SET is_processed = true WHERE message_id = $1')
		expect(calledValues()).toEqual([4242])
		expect(result?.is_processed).toBe(true)
	})

	it.for(['created_at', 'updated_at'])('returns the %s column so the caller sees the processing time', async (column) => {
		mockRows([makeIncomingEpisode()])

		await incomingEpisodesRepository.markEpisodeAsProcessed(4242)

		expect(calledSql()).toContain(column)
	})

	it('does not set updated_at by hand, the trigger owns it', async () => {
		mockRows([makeIncomingEpisode()])

		await incomingEpisodesRepository.markEpisodeAsProcessed(4242)

		const setClause = calledSql().slice(calledSql().indexOf('SET'), calledSql().indexOf(' WHERE'))
		expect(setClause).toBe('SET is_processed = true')
		expect(setClause).not.toContain('updated_at')
	})

	it('returns undefined when no row matches', async () => {
		mockRows([])

		const result = await incomingEpisodesRepository.markEpisodeAsProcessed(9999)

		expect(result).toBeUndefined()
	})
})

describe('incomingEpisodesRepository.saveIncomingEpisode', () => {
	const toSave: IIncomingEpisodeToSave = {
		message_id: 4242,
		caption: 'Breaking Bad s04e07',
		episode_number: 7,
		season: 4,
		language: 'castellano',
		batch_id: 555,
		batch_name: 'Breaking Bad',
		is_processed: false,
	}

	it('inserts the incoming episode and returns the created row', async () => {
		mockRows([makeIncomingEpisode()])

		const result = await incomingEpisodesRepository.saveIncomingEpisode(toSave)

		expect(calledSql()).toContain(
			'INSERT INTO incoming_episodes (message_id, caption, episode_number, season, language, batch_id, batch_name, is_processed)',
		)
		expect(calledValues()).toEqual([4242, 'Breaking Bad s04e07', 7, 4, 'castellano', 555, 'Breaking Bad', false])
		expect(result?.language).toBe('castellano')
	})

	it('persists a null language', async () => {
		mockRows([makeIncomingEpisode({ language: null })])

		const result = await incomingEpisodesRepository.saveIncomingEpisode({ ...toSave, language: null })

		expect(calledValues()).toEqual([4242, 'Breaking Bad s04e07', 7, 4, null, 555, 'Breaking Bad', false])
		expect(result?.language).toBeNull()
	})

	it('returns undefined when the insert yields no row', async () => {
		mockRows([])

		const result = await incomingEpisodesRepository.saveIncomingEpisode(toSave)

		expect(result).toBeUndefined()
	})
})
