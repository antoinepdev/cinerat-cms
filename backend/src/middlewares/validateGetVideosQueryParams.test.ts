import type { Request, Response } from 'express'
import { describe, expect, it, vi } from 'vitest'
import type { IIncomingVideoFilters } from '../schemas/incomingVideo.ts'
import { ValidationError } from '../utils/errors.ts'
import { validateGetVideosQueryParams } from './validateGetVideosQueryParams.ts'

async function expectValidationError(promise: Promise<unknown>, message: string) {
	await expect(promise).rejects.toThrow(ValidationError)
	await expect(promise).rejects.toThrow(message)
}

function makeRequest(query: Record<string, unknown>) {
	return { query } as unknown as Request
}

async function run(query: Record<string, unknown>) {
	const req = makeRequest(query)
	const next = vi.fn()
	await validateGetVideosQueryParams(req, {} as Response, next)
	return { req, next }
}

async function expectRejected(query: Record<string, unknown>, detail: string) {
	const next = vi.fn()
	await expectValidationError(validateGetVideosQueryParams(makeRequest(query), {} as Response, next), detail)
	expect(next).not.toHaveBeenCalled()
}

describe('validateGetVideosQueryParams', () => {
	it('accepts a request without any query param', async () => {
		const { req, next } = await run({})

		expect(req.filteredVideoQuery).toEqual({})
		expect(next).toHaveBeenCalled()
	})

	it.for<NonNullable<IIncomingVideoFilters['sort_by']>>(['id', 'created_at', 'updated_at'])(
		'passes sort_by %s',
		async (sort_by) => {
			const { req, next } = await run({ sort_by })

			expect(req.filteredVideoQuery).toEqual({ sort_by })
			expect(next).toHaveBeenCalled()
		},
	)

	it.for(['asc', 'desc'] as const)('passes sort_by created_at with sort_direction %s', async (sort_direction) => {
		const { req, next } = await run({ sort_by: 'created_at', sort_direction })

		expect(req.filteredVideoQuery).toEqual({ sort_by: 'created_at', sort_direction })
		expect(next).toHaveBeenCalled()
	})

	it.for([
		{ is_processed: 'true', expected: true },
		{ is_processed: 'false', expected: false },
		{ is_processed: '1', expected: true },
		{ is_processed: '0', expected: false },
	])('coerces the is_processed filter $is_processed into the boolean $expected', async ({ is_processed, expected }) => {
		const { req, next } = await run({ is_processed })

		expect(req.filteredVideoQuery).toEqual({ is_processed: expected })
		expect(req.filteredVideoQuery!.is_processed).toBe(expected)
		expect(next).toHaveBeenCalled()
	})

	it.each([
		{ query: { is_processed: 'false' }, description: 'the string "false"' },
		{ query: { is_processed: '0' }, description: 'the string "0"' },
	])('does not read $description as true', async ({ query }) => {
		const { req } = await run(query)

		expect(req.filteredVideoQuery!.is_processed).toBe(false)
	})

	it('keeps is_processed alongside the sorting params', async () => {
		const { req, next } = await run({ is_processed: 'true', sort_by: 'updated_at', sort_direction: 'asc' })

		expect(req.filteredVideoQuery).toEqual({ is_processed: true, sort_by: 'updated_at', sort_direction: 'asc' })
		expect(next).toHaveBeenCalled()
	})

	it('strips the unknown query params', async () => {
		const { req, next } = await run({ is_processed: 'true', year: '2020', nope: 'x' })

		expect(req.filteredVideoQuery).toEqual({ is_processed: true })
		expect(next).toHaveBeenCalled()
	})

	it.for([{ sort_by: 'duration' }, { sort_by: 'is_processed' }, { sort_by: 'created_at; DROP TABLE incoming_videos--' }])(
		'rejects the invalid sort_by %s with 422',
		async (query) => {
			await expectRejected(query, 'Invalid query params')
		},
	)

	it.for([{ sort_direction: 'sideways' }, { sort_direction: 'DESC' }, { sort_direction: '' }])(
		'rejects the invalid sort_direction %s with 422',
		async (query) => {
			await expectRejected(query, 'Invalid query params')
		},
	)

	it.for([{ is_processed: 'maybe' }, { is_processed: '2' }, { is_processed: '' }])(
		'rejects the non boolean is_processed %s with 422 instead of coercing it',
		async (query) => {
			await expectRejected(query, 'Invalid query params')
		},
	)

	it('rejects a repeated is_processed param with 422', async () => {
		await expectRejected({ is_processed: ['true', 'false'] }, 'Invalid query params')
	})

	it('rejects sort_direction without sort_by with 422', async () => {
		await expectRejected({ sort_direction: 'asc' }, 'If you use sort_direction filter you need also specify sort_by filter')
	})

	it('rejects sort_direction without sort_by even when is_processed is given', async () => {
		await expectRejected(
			{ is_processed: 'true', sort_direction: 'asc' },
			'If you use sort_direction filter you need also specify sort_by filter',
		)
	})
})
