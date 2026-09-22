import type { Request, Response } from 'express'
import { describe, expect, it, vi } from 'vitest'
import type { IMovieInput } from '../schemas/movie.ts'
import { ValidationError } from '../utils/errors.ts'
import { validateSaveMovieBody } from './validateSaveMovieBody.ts'

function makeValidMovie(overrides: Partial<IMovieInput> = {}): IMovieInput {
	return {
		title_en: 'Avatar',
		year: 2009,
		poster: 'https://image.tmdb.org/poster.jpg',
		description: 'A description',
		tmdb_id: 19995,
		popularity: 10,
		backdrop_path: 'https://image.tmdb.org/backdrop.jpg',
		genres: ['Science Fiction'],
		catalog_name: 'cine',
		catalog_version: 3,
		language_cas: true,
		telegram_file_id_cas: 123,
		...overrides,
	} as IMovieInput
}

async function expectValidationError(promise: Promise<unknown>, message: string) {
	await expect(promise).rejects.toThrow(ValidationError)
	await expect(promise).rejects.toThrow(message)
}

describe('validateSaveMovieBody', () => {
	it('passes a valid body, stores the parsed data and calls next', async () => {
		const req = { body: makeValidMovie() } as Request
		const next = vi.fn()

		await validateSaveMovieBody(req, {} as Response, next)

		expect(next).toHaveBeenCalled()
	})

	it.for<{ name: string; body: unknown; message: string }>([
		{
			name: 'no language selected',
			body: makeValidMovie({ language_cas: false, language_lat: false }),
			message: 'You need specify one language at latest',
		},
		{
			name: 'no telegram file id',
			body: makeValidMovie({ telegram_file_id_cas: undefined, telegram_file_id_lat: undefined }),
			message: 'You need specify one telegram file id at latest',
		},
		{
			name: 'an invalid year',
			body: { ...makeValidMovie(), year: 'abc' },
			message: 'Invalid request body',
		},
		{
			name: 'a poster that does not start with https://',
			body: makeValidMovie({ poster: 'http://insecure.jpg' }),
			message: 'Invalid request body',
		},
		{
			name: 'an empty genres array',
			body: makeValidMovie({ genres: [] }),
			message: 'Invalid request body',
		},
	])('rejects $name', async ({ body, message }) => {
		const req = { body } as Request
		const next = vi.fn()

		await expectValidationError(validateSaveMovieBody(req, {} as Response, next), message)

		expect(next).not.toHaveBeenCalled()
	})

	it('formats the zod issues into field errors', async () => {
		const req = { body: { ...makeValidMovie(), year: 'abc' } } as Request
		const next = vi.fn()

		const error: ValidationError = await validateSaveMovieBody(req, {} as Response, next).catch((e) => e)

		expect(error.message).toBe('Invalid request body')
		expect(error.errors).toEqual([{ field: 'year', message: 'Invalid input: expected number, received string' }])
	})
})
