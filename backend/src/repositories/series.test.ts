import { describe, expect, it, type Mock, vi } from 'vitest'
import { pool } from '../database/index.ts'
import type { ISeries, ISeriesToSave } from '../entities/series.ts'
import { seriesRepository } from './series.ts'

vi.mock('../database/index.ts', () => ({ pool: { query: vi.fn() } }))

const poolQuery = vi.mocked(pool).query as unknown as Mock<(text: string, values?: unknown[]) => Promise<{ rows: unknown[] }>>

const CREATED_AT = new Date('2026-01-15T10:00:00.000Z')
const UPDATED_AT = new Date('2026-02-20T18:30:00.000Z')

function makeSeries(overrides: Partial<ISeries> = {}): ISeries {
	return {
		id: 1,
		tmdb_id: 1396,
		title_en: 'Breaking Bad',
		title_cas: 'Breaking Bad',
		title_lat: 'Breaking Bad',
		year: 2008,
		poster: 'https://image.tmdb.org/t/p/poster.jpg',
		backdrop_path: 'https://image.tmdb.org/t/p/backdrop.jpg',
		description: 'A chemistry teacher turns to crime.',
		popularity: 100.5,
		genres: ['Drama', 'Crime'],
		created_at: CREATED_AT,
		updated_at: UPDATED_AT,
		...overrides,
	}
}

function makeSeriesToSave(overrides: Partial<ISeriesToSave> = {}): ISeriesToSave {
	const { id, created_at, updated_at, ...toSave } = makeSeries()
	return { ...toSave, ...overrides }
}

function mockRows(rows: ISeries[]) {
	poolQuery.mockResolvedValue({ rows })
}

describe('seriesRepository', () => {
	describe('getSeries', () => {
		it('selects the series columns without wrapping them in parentheses', async () => {
			mockRows([makeSeries()])

			await seriesRepository.getSeries()

			const sql = poolQuery.mock.calls[0]![0]
			expect(sql).toContain(
				'SELECT id, title_en, title_cas, title_lat, year, tmdb_id, poster, backdrop_path, description, popularity, genres, created_at, updated_at from series',
			)
			expect(sql).not.toContain('SELECT (')
		})

		it('does not filter and sends an empty values array', async () => {
			mockRows([])

			await seriesRepository.getSeries()

			expect(poolQuery).toHaveBeenCalledTimes(1)
			expect(poolQuery.mock.calls[0]![0]).not.toContain('where')
			expect(poolQuery.mock.calls[0]![1]).toEqual([])
		})

		it('filters by tmdb_id as a numbered parameter', async () => {
			const rows = [makeSeries()]
			mockRows(rows)

			const result = await seriesRepository.getSeries({ tmdb_id: 1396 })

			const sql = poolQuery.mock.calls[0]![0]
			expect(sql).toContain('where tmdb_id = $1')
			expect(poolQuery.mock.calls[0]![1]).toEqual([1396])
			expect(result).toEqual(rows)
		})

		it('returns the rows untouched', async () => {
			const rows = [makeSeries(), makeSeries({ id: 2, tmdb_id: 66732 })]
			mockRows(rows)

			const result = await seriesRepository.getSeries()

			expect(result).toEqual(rows)
		})
	})

	describe('saveSeries', () => {
		it('inserts the series with its values in column order', async () => {
			mockRows([makeSeries()])

			await seriesRepository.saveSeries(makeSeriesToSave())

			expect(poolQuery).toHaveBeenCalledTimes(1)
			expect(poolQuery.mock.calls[0]![0]).toContain(
				'INSERT INTO series (title_en, title_cas, title_lat, year, tmdb_id, poster, backdrop_path, description, popularity, genres) VALUES',
			)
			expect(poolQuery.mock.calls[0]![1]).toEqual([
				'Breaking Bad',
				'Breaking Bad',
				'Breaking Bad',
				2008,
				1396,
				'https://image.tmdb.org/t/p/poster.jpg',
				'https://image.tmdb.org/t/p/backdrop.jpg',
				'A chemistry teacher turns to crime.',
				100.5,
				['Drama', 'Crime'],
			])
		})

		it('returns the saved series', async () => {
			const saved = makeSeries()
			mockRows([saved])

			const result = await seriesRepository.saveSeries(makeSeriesToSave())

			expect(result).toEqual(saved)
		})
	})

	describe('deleteSeries', () => {
		it('deletes the serie by id and returns the deleted id', async () => {
			poolQuery.mockResolvedValue({ rows: [{ id: 7 }] })

			const result = await seriesRepository.deleteSeries(7)

			expect(poolQuery).toHaveBeenCalledTimes(1)
			expect(poolQuery.mock.calls[0]![0]).toContain('DELETE FROM series WHERE id = $1 RETURNING id')
			expect(poolQuery.mock.calls[0]![1]).toEqual([7])
			expect(result).toEqual({ id: 7 })
		})

		it('returns undefined when no serie matched the id', async () => {
			poolQuery.mockResolvedValue({ rows: [] })

			const result = await seriesRepository.deleteSeries(99)

			expect(result).toBeUndefined()
		})
	})
})
