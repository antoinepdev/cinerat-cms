import type { Request, Response } from 'express'
import { describe, expect, it, vi } from 'vitest'
import { ValidationError } from '../utils/errors.ts'
import { validateVideoIdParam } from './validateVideoIdParam.ts'

async function expectValidationError(promise: Promise<unknown>, message: string) {
	await expect(promise).rejects.toThrow(ValidationError)
	await expect(promise).rejects.toThrow(message)
}

describe('validateVideoIdParam', () => {
	it('passes a valid id, stores it in filteredParams and calls next', async () => {
		const req = { params: { id: '42' } } as unknown as Request
		const next = vi.fn()

		await validateVideoIdParam(req, {} as Response, next)

		expect(req.filteredParams).toEqual({ id: 42 })
		expect(next).toHaveBeenCalled()
	})

	it.for<{ name: string; params: unknown; message: string }>([
		{
			name: 'a non-numeric id',
			params: { id: 'abc' },
			message: 'Invalid video id',
		},
		{
			name: 'a negative id',
			params: { id: '-1' },
			message: 'Invalid video id',
		},
		{
			name: 'a decimal id',
			params: { id: '1.5' },
			message: 'Invalid video id',
		},
	])('rejects $name', async ({ params, message }) => {
		const req = { params } as Request
		const next = vi.fn()

		await expectValidationError(validateVideoIdParam(req, {} as Response, next), message)

		expect(next).not.toHaveBeenCalled()
	})
})
