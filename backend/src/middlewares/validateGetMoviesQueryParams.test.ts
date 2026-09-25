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
	])('passes sort_by %s', async (sort_by) => {
		const req = { query: { sort_by } } as unknown as Request
		const next = vi.fn()

		await validateGetMoviesQueryParams(req, {} as Response, next)

		expect(req.filteredQuery).toEqual({ sort_by })
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
