import type { Request, Response } from 'express'
import { describe, expect, it, vi } from 'vitest'
import { ValidationError } from '../utils/errors.ts'
import { validateGetIncomingEpisodesQueryParams } from './validateGetIncomingEpisodesQueryParams.ts'

function makeRequest(query: Record<string, unknown>) {
	return { query } as unknown as Request
}

async function run(query: Record<string, unknown>) {
	const req = makeRequest(query)
	const next = vi.fn()
	await validateGetIncomingEpisodesQueryParams(req, {} as Response, next)
	return { req, next }
}

async function expectRejected(query: Record<string, unknown>, detail: string) {
	const req = makeRequest(query)
	const next = vi.fn()
	await expect(validateGetIncomingEpisodesQueryParams(req, {} as Response, next)).rejects.toThrow(ValidationError)
	await expect(validateGetIncomingEpisodesQueryParams(req, {} as Response, next)).rejects.toThrow(detail)
	expect(next).not.toHaveBeenCalled()
}

describe('validateGetIncomingEpisodesQueryParams', () => {
	it('passes an empty query, stores the parsed data and calls next', async () => {
		const { req, next } = await run({})

		expect(req.filteredEpisodeQuery).toEqual({})
		expect(next).toHaveBeenCalled()
	})

	it.each(['true', 'false'])('forwards the is_processed %s filter', async (is_processed) => {
		const { req, next } = await run({ is_processed })

		expect(req.filteredEpisodeQuery).toEqual({ is_processed: is_processed === 'true' })
		expect(next).toHaveBeenCalled()
	})

	it('coerces season and episode_number into numbers', async () => {
		const { req, next } = await run({ season: '4', episode_number: '7' })

		expect(req.filteredEpisodeQuery).toEqual({ season: 4, episode_number: 7 })
		expect(next).toHaveBeenCalled()
	})

	it('combines the is_processed, season and episode_number filters', async () => {
		const { req, next } = await run({ is_processed: 'false', season: '4', episode_number: '7' })

		expect(req.filteredEpisodeQuery).toEqual({ is_processed: false, season: 4, episode_number: 7 })
		expect(next).toHaveBeenCalled()
	})

	it.each(['id', 'created_at', 'updated_at'])('accepts the sort_by %s', async (sort_by) => {
		const { req, next } = await run({ sort_by, sort_direction: 'asc' })

		expect(req.filteredEpisodeQuery).toEqual({ sort_by, sort_direction: 'asc' })
		expect(next).toHaveBeenCalled()
	})

	it('strips the unknown query params', async () => {
		const { req, next } = await run({ is_processed: 'true', batch_id: '5', nope: 'x' })

		expect(req.filteredEpisodeQuery).toEqual({ is_processed: true })
		expect(next).toHaveBeenCalled()
	})

	it.for([{ season: 'abc' }, { season: '0' }, { season: '-1' }, { episode_number: 'abc' }, { episode_number: '0' }])(
		'rejects the invalid filter %o with 422',
		async (query) => {
			await expectRejected(query, 'Invalid query params')
		},
	)

	it.for([{ is_processed: 'maybe' }, { sort_by: 'season' }, { sort_direction: 'sideways' }])(
		'rejects the invalid param %o with 422',
		async (query) => {
			await expectRejected(query, 'Invalid query params')
		},
	)

	it('rejects sort_direction without sort_by with 422', async () => {
		await expectRejected({ sort_direction: 'asc' }, 'If you use sort_direction filter you need also specify sort_by filter')
	})
})
