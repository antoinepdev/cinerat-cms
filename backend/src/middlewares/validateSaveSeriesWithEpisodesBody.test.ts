import type { Request, Response } from 'express'
import { describe, expect, it, vi } from 'vitest'
import type { IEpisodeToSave } from '../entities/episode.ts'
import type { ISeriesToSave } from '../entities/series.ts'
import { ValidationError } from '../utils/errors.ts'
import { validateSaveSeriesWithEpisodesBody } from './validateSaveSeriesWithEpisodesBody.ts'

function makeValidSeries(overrides: Partial<ISeriesToSave> = {}): ISeriesToSave {
	return {
		tmdb_id: 1396,
		title_en: 'Breaking Bad',
		title_cas: 'Breaking Bad',
		title_lat: 'Breaking Bad',
		year: 2008,
		poster: 'https://image.tmdb.org/poster.jpg',
		description: 'A description',
		popularity: 100,
		backdrop_path: 'https://image.tmdb.org/backdrop.jpg',
		genres: ['Drama'],
		...overrides,
	}
}

function makeValidEpisode(overrides: Partial<IEpisodeToSave> = {}): IEpisodeToSave {
	return {
		episode_number: 1,
		season: 1,
		language_cas: true,
		language_lat: false,
		telegram_file_id_cas: 123,
		telegram_file_id_lat: 456,
		...overrides,
	}
}

function makeValidBody() {
	return { series: makeValidSeries(), episodesToSave: [makeValidEpisode()] }
}

async function expectValidationError(promise: Promise<unknown>, message: string) {
	await expect(promise).rejects.toThrow(ValidationError)
	await expect(promise).rejects.toThrow(message)
}

describe('validateSaveSeriesWithEpisodesBody', () => {
	it('passes a valid body, stores the parsed data and calls next', async () => {
		const req = { body: makeValidBody() } as Request
		const next = vi.fn()

		await validateSaveSeriesWithEpisodesBody(req, {} as Response, next)

		expect(next).toHaveBeenCalled()
		expect(req.body).toEqual(makeValidBody())
	})

	it.for<{ name: string; body: unknown }>([
		{
			name: 'a missing series',
			body: { episodesToSave: [makeValidEpisode()] },
		},
		{
			name: 'a poster that is not an image.tmdb.org url',
			body: {
				...makeValidBody(),
				series: makeValidSeries({ poster: 'https://example.com/poster.jpg' as ISeriesToSave['poster'] }),
			},
		},
		{
			name: 'an invalid series year',
			body: { ...makeValidBody(), series: { ...makeValidSeries(), year: 'abc' } },
		},
		{
			name: 'an episode with a missing field',
			body: { ...makeValidBody(), episodesToSave: [{ ...makeValidEpisode(), season: undefined }] },
		},
		{
			name: 'an episode with a non integer file id',
			body: { ...makeValidBody(), episodesToSave: [makeValidEpisode({ telegram_file_id_cas: 1.5 })] },
		},
	])('rejects $name', async ({ body }) => {
		const req = { body } as Request
		const next = vi.fn()

		await expectValidationError(validateSaveSeriesWithEpisodesBody(req, {} as Response, next), 'Invalid request body')

		expect(next).not.toHaveBeenCalled()
	})

	it('formats the zod issues into field errors', async () => {
		const req = { body: { ...makeValidBody(), series: { ...makeValidSeries(), year: 'abc' } } } as Request
		const next = vi.fn()

		const error: ValidationError = await validateSaveSeriesWithEpisodesBody(req, {} as Response, next).catch((e) => e)

		expect(error.message).toBe('Invalid request body')
		expect(error.errors).toEqual([{ field: 'series.year', message: 'Invalid input: expected number, received string' }])
	})

	it('strips unknown keys', async () => {
		const req = { body: { ...makeValidBody(), unexpected: true } } as Request
		const next = vi.fn()

		await validateSaveSeriesWithEpisodesBody(req, {} as Response, next)

		expect(req.body).toEqual(makeValidBody())
	})
})
