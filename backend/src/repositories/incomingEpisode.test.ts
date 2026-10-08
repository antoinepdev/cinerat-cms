import { describe, expect, it, type Mock, vi } from 'vitest'
import { pool } from '../database/index.ts'
import type { IIncomingEpisode, IIncomingEpisodeToSave } from '../entities/incomingEpisode.ts'
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
