import type { Request, Response } from 'express'
import { describe, expect, it, vi } from 'vitest'
import type { IMovieFilters } from '../schemas/movie.ts'
import { ValidationError } from '../utils/errors.ts'
import { validateGetMoviesQueryParams } from './validateGetMoviesQueryParams.ts'

async function expectValidationError(promise: Promise<unknown>, message: string) {
	await expect(promise).rejects.toThrow(ValidationError)
	await expect(promise).rejects.toThrow(message)
}

describe('validateGetMoviesQueryParams', () => {
	it('passes empty queries and calls next', async () => {
		const req = { query: {} } as Request
		const next = vi.fn()

		await validateGetMoviesQueryParams(req, {} as Response, next)

		expect(next).toHaveBeenCalled()
	})

	it('passes catalog_name together with catalog_version', async () => {
		const req = { query: { catalog_name: 'standard', catalog_version: '5' } } as unknown as Request
		const next = vi.fn()

		await validateGetMoviesQueryParams(req, {} as Response, next)

		expect(next).toHaveBeenCalled()
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
		'created_at',
		'updated_at',
	])('passes sort_by %s', async (sort_by) => {
		const req = { query: { sort_by } } as unknown as Request
		const next = vi.fn()

		await validateGetMoviesQueryParams(req, {} as Response, next)

		expect(req.filteredQuery).toEqual({ sort_by })
		expect(next).toHaveBeenCalled()
	})

	it.for<NonNullable<IMovieFilters['sort_direction']>>(['asc', 'desc'])(
		'passes sort_by popularity with sort_direction %s',
		async (sort_direction) => {
			const req = { query: { sort_by: 'popularity', sort_direction } } as unknown as Request
			const next = vi.fn()

			await validateGetMoviesQueryParams(req, {} as Response, next)

			expect(req.filteredQuery).toEqual({ sort_by: 'popularity', sort_direction })
			expect(next).toHaveBeenCalled()
		},
	)

	it('keeps the rest of the filters alongside the sorting ones', async () => {
		const query = { catalog_name: 'standard', catalog_version: '5', year: '2020', sort_by: 'popularity', sort_direction: 'asc' }
		const req = { query } as unknown as Request
		const next = vi.fn()

		await validateGetMoviesQueryParams(req, {} as Response, next)

		expect(req.filteredQuery).toEqual({
			catalog_name: 'standard',
			catalog_version: 5,
			year: 2020,
			sort_by: 'popularity',
			sort_direction: 'asc',
		})
		expect(next).toHaveBeenCalled()
	})

	it('drops unknown params so they can never act as a sort_direction', async () => {
		const req = { query: { sort_by: 'popularity', order: 'asc', sortDirection: 'asc' } } as unknown as Request
		const next = vi.fn()

		await validateGetMoviesQueryParams(req, {} as Response, next)

		expect(req.filteredQuery).toEqual({ sort_by: 'popularity' })
		expect(next).toHaveBeenCalled()
	})

	it.for<{ name: string; query: unknown; message: string }>([
		{
			name: 'catalog_version without catalog_name',
			query: { catalog_version: '3' },
			message: 'If you use catalog_version filter you need also specify catalog_name filter',
		},
		{
			name: 'an unknown sort_by',
			query: { sort_by: 'unknown' },
			message: 'Invalid query params',
		},
		{
			name: 'a non-numeric year',
			query: { year: 'abc' },
			message: 'Invalid query params',
		},
		{
			name: 'sort_direction without sort_by',
			query: { sort_direction: 'desc' },
			message: 'If you use sort_direction filter you need also specify sort_by filter',
		},
		{
			name: 'an unknown sort_direction',
			query: { sort_by: 'popularity', sort_direction: 'sideways' },
			message: 'Invalid query params',
		},
		{
			name: 'an uppercase sort_direction',
			query: { sort_by: 'popularity', sort_direction: 'DESC' },
			message: 'Invalid query params',
		},
		{
			name: 'an empty sort_direction',
			query: { sort_by: 'popularity', sort_direction: '' },
			message: 'Invalid query params',
		},
		{
			name: 'a numeric sort_direction',
			query: { sort_by: 'popularity', sort_direction: 1 },
			message: 'Invalid query params',
		},
		{
			name: 'a repeated sort_direction',
			query: { sort_by: 'popularity', sort_direction: ['asc', 'desc'] },
			message: 'Invalid query params',
		},
		{
			name: 'a repeated sort_by',
			query: { sort_by: ['popularity', 'title_en'] },
			message: 'Invalid query params',
		},
	])('rejects $name', async ({ query, message }) => {
		const req = { query } as Request
		const next = vi.fn()

		await expectValidationError(validateGetMoviesQueryParams(req, {} as Response, next), message)

		expect(next).not.toHaveBeenCalled()
	})
})
