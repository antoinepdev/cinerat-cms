import { describe, expect, it, type Mock, vi } from 'vitest'
import { pool } from '../database/index.ts'
import type { IMovie, IMovieToSave } from '../entities/movie.ts'
import type { IMovieFilters, IMovieToUpdateParams } from '../schemas/movie.ts'
import { movieRepository } from './movie.ts'

vi.mock('../database/index.ts', () => ({ pool: { query: vi.fn() } }))

const poolQuery = vi.mocked(pool).query as unknown as Mock<(text: string, values?: unknown[]) => Promise<{ rows: IMovie[] }>>

function makeMovie(overrides: Partial<IMovie> = {}): IMovie {
	return {
		id: 1,
		title_en: 'Avatar',
		title_cas: 'Avatar',
		year: 2009,
		language_cas: true,
		language_lat: false,
		quality: 'cam',
		poster: 'https://example.com/poster.jpg',
		description: 'A paraplegic marine dispatched to the moon Pandora.',
		telegram_file_id_cas: undefined,
		telegram_file_id_lat: undefined,
		telegram_poster_id: 1,
		catalog_name: 'test-catalog',
		catalog_version: 1,
		tmdb_id: 19995,
		popularity: 100,
		backdrop_path: 'https://example.com/backdrop.jpg',
		genres: ['Action', 'Adventure'],
		...overrides,
	}
}

function makeMovieToSave(overrides: Partial<IMovieToSave> = {}): IMovieToSave {
	const { id, ...toSave } = makeMovie()
	return { ...toSave, ...overrides }
}

function mockRows(rows: IMovie[]) {
	poolQuery.mockResolvedValue({ rows })
}

describe('movieRepository', () => {
	it('getMovies builds a base query without filters', async () => {
		mockRows([makeMovie()])

		const result = await movieRepository.getMovies({})

		expect(poolQuery).toHaveBeenCalledTimes(1)
		const sql = poolQuery.mock.calls[0]![0]
		expect(sql).toContain('from movies')
		expect(sql).not.toContain('where')
		expect(poolQuery.mock.calls[0]![1]).toEqual([])
		expect(result).toEqual([makeMovie()])
	})

	it('getMovies appends filters as numbered parameters in code order', async () => {
		mockRows([])

		await movieRepository.getMovies({ catalog_name: 'kids', year: 2020, sort_by: 'title_en', sort_direction: 'asc' })

		expect(poolQuery).toHaveBeenCalledTimes(1)
		const sql = poolQuery.mock.calls[0]![0]
		expect(sql).toContain('where catalog_name = $1 and year = $2')
		expect(sql).toContain('order by title_en asc')
		expect(sql.indexOf('where')).toBeLessThan(sql.indexOf('order by'))
		expect(poolQuery.mock.calls[0]![1]).toEqual(['kids', 2020])
	})

	it.for<NonNullable<IMovieFilters['sort_by']>>([
		'title_en',
		'title_cas',
		'title_lat',
		'year',
		'language_cas',
		'language_lat',
		'id',
		'popularity',
	])('getMovies orders by %s descending when no sort_direction is given', async (sort_by) => {
		mockRows([])

		await movieRepository.getMovies({ sort_by })

		expect(poolQuery).toHaveBeenCalledTimes(1)
		expect(poolQuery.mock.calls[0]![0]).toContain(`order by ${sort_by} desc`)
	})

	it.for<NonNullable<IMovieFilters['sort_direction']>>(['asc', 'desc'])(
		'getMovies orders popularity %s when asked for it',
		async (sort_direction) => {
			mockRows([])

			await movieRepository.getMovies({ sort_by: 'popularity', sort_direction })

			expect(poolQuery).toHaveBeenCalledTimes(1)
			expect(poolQuery.mock.calls[0]![0]).toContain(`order by popularity ${sort_direction}`)
		},
	)

	it.for<NonNullable<IMovieFilters['sort_by']>>(['title_en', 'id', 'popularity'])(
		'getMovies orders %s asc when sort_direction is asc',
		async (sort_by) => {
			mockRows([])

			await movieRepository.getMovies({ sort_by, sort_direction: 'asc' })

			expect(poolQuery).toHaveBeenCalledTimes(1)
			expect(poolQuery.mock.calls[0]![0]).toContain(`order by ${sort_by} asc`)
		},
	)

	it('getMovies returns the rows in the order given by the database', async () => {
		const movies = [makeMovie({ id: 1, popularity: 5 }), makeMovie({ id: 2, popularity: 500 })]
		mockRows(movies)

		const result = await movieRepository.getMovies({ sort_by: 'popularity' })

		expect(result).toEqual(movies)
	})

	it('getMovies leaves the order by clause empty when only sort_direction is given', async () => {
		mockRows([])

		await movieRepository.getMovies({ sort_direction: 'desc' } as IMovieFilters)

		expect(poolQuery).toHaveBeenCalledTimes(1)
		expect(poolQuery.mock.calls[0]![0]).not.toContain('order by')
	})

	it.for(['duration', 'title_en; DROP TABLE movies--'])(
		'getMovies leaves the order by clause empty for invalid sort_by %s',
		async (sort_by) => {
			mockRows([])

			await movieRepository.getMovies({ sort_by } as unknown as IMovieFilters)

			expect(poolQuery).toHaveBeenCalledTimes(1)
			const sql = poolQuery.mock.calls[0]![0]
			expect(sql).not.toContain('order by')
		},
	)

	it.for(['asc; DROP TABLE movies--', 'DESC', 'descending', 'up', 'desc asc'])(
		'getMovies never interpolates the invalid sort_direction %s and falls back to desc',
		async (sort_direction) => {
			mockRows([])

			await movieRepository.getMovies({ sort_by: 'popularity', sort_direction } as unknown as IMovieFilters)

			expect(poolQuery).toHaveBeenCalledTimes(1)
			const sql = poolQuery.mock.calls[0]![0]
			expect(sql).not.toContain(sort_direction)
			expect(sql).toContain('order by popularity desc')
		},
	)

	it('getMovies falls back to desc when sort_direction is empty', async () => {
		mockRows([])

		await movieRepository.getMovies({ sort_by: 'popularity', sort_direction: '' } as unknown as IMovieFilters)

		expect(poolQuery).toHaveBeenCalledTimes(1)
		expect(poolQuery.mock.calls[0]![0]).toContain('order by popularity desc')
	})

	it('getMovies keeps the order by clause free of a direction word when sort_by is invalid', async () => {
		mockRows([])

		await movieRepository.getMovies({ sort_by: 'duration', sort_direction: 'asc' } as unknown as IMovieFilters)

		expect(poolQuery).toHaveBeenCalledTimes(1)
		const sql = poolQuery.mock.calls[0]![0]
		expect(sql).not.toContain('order by')
		expect(sql).not.toContain('asc')
	})

	it('saveMovie inserts every field in column order and returns the saved row', async () => {
		const movie = makeMovie()
		const data = makeMovieToSave()
		mockRows([movie])

		const result = await movieRepository.saveMovie(data)

		expect(poolQuery).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO movies'), [
			'Avatar',
			'Avatar',
			undefined,
			2009,
			'https://example.com/poster.jpg',
			true,
			false,
			'cam',
			'A paraplegic marine dispatched to the moon Pandora.',
			undefined,
			undefined,
			1,
			'test-catalog',
			1,
			19995,
			100,
			'https://example.com/backdrop.jpg',
			['Action', 'Adventure'],
		])
		expect(result).toEqual(movie)
	})

	it('updateMovie sets only the castellano fields when only cas is provided', async () => {
		const params: IMovieToUpdateParams = { tmdb_id: 19995, telegram_file_id_cas: 111 }
		mockRows([makeMovie()])

		await movieRepository.updateMovie(params)

		expect(poolQuery).toHaveBeenCalledWith(
			expect.stringContaining('UPDATE movies SET telegram_file_id_cas = $1, language_cas = $2 WHERE tmdb_id = $3'),
			[111, true, 19995],
		)
	})

	it('updateMovie sets only the latino fields when only lat is provided', async () => {
		const params: IMovieToUpdateParams = { tmdb_id: 19995, telegram_file_id_lat: 222 }
		mockRows([makeMovie()])

		await movieRepository.updateMovie(params)

		expect(poolQuery).toHaveBeenCalledWith(
			expect.stringContaining('UPDATE movies SET telegram_file_id_lat = $1, language_lat = $2 WHERE tmdb_id = $3'),
			[222, true, 19995],
		)
	})

	it('updateMovie combines cas and lat and returns undefined when no row matches', async () => {
		const params: IMovieToUpdateParams = { tmdb_id: 19995, telegram_file_id_cas: 111, telegram_file_id_lat: 222 }
		poolQuery.mockResolvedValue({ rows: [] })

		const result = await movieRepository.updateMovie(params)

		expect(poolQuery).toHaveBeenCalledWith(
			expect.stringContaining(
				'UPDATE movies SET telegram_file_id_cas = $1, language_cas = $2, telegram_file_id_lat = $3, language_lat = $4 WHERE tmdb_id = $5',
			),
			[111, true, 222, true, 19995],
		)
		expect(result).toBeUndefined()
	})
})
