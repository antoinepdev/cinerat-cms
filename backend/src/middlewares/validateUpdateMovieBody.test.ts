import type { Request, Response } from 'express'
import { describe, expect, it, vi } from 'vitest'
import { ValidationError } from '../utils/errors.ts'
import { validateUpdateMovieBody } from './validateUpdateMovieBody.ts'

async function expectValidationError(promise: Promise<unknown>, message: string) {
	await expect(promise).rejects.toThrow(ValidationError)
	await expect(promise).rejects.toThrow(message)
}

describe('validateUpdateMovieBody', () => {
	it('passes a valid body with one field to update and calls next', async () => {
		const req = { body: { tmdb_id: 19995, telegram_file_id_cas: 123 } } as Request
		const next = vi.fn()

		await validateUpdateMovieBody(req, {} as Response, next)

		expect(next).toHaveBeenCalled()
	})

	it.for<{ name: string; body: unknown; message: string }>([
		{
			name: 'a body without fields to update',
			body: { tmdb_id: 19995 },
			message: 'You need specify at least one field to update',
		},
		{
			name: 'an invalid tmdb_id',
			body: { tmdb_id: 'abc', telegram_file_id_cas: 123 },
			message: 'Invalid request body',
		},
		{
			name: 'a negative tmdb_id',
			body: { tmdb_id: -5, telegram_file_id_cas: 123 },
			message: 'Invalid request body',
		},
	])('rejects $name', async ({ body, message }) => {
		const req = { body } as Request
		const next = vi.fn()

		await expectValidationError(validateUpdateMovieBody(req, {} as Response, next), message)

		expect(next).not.toHaveBeenCalled()
	})
})