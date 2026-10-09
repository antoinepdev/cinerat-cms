import type { NextFunction, Request, Response } from 'express'
import { formatZodErrors } from '../helpers/formatZodErrors.ts'
import { SaveSeriesWithEpisodesSchema } from '../schemas/series.ts'
import type { ISaveSeriesWithEpisodesParams } from '../services/episodes.ts'
import { ValidationError } from '../utils/errors.ts'

export async function validateSaveSeriesWithEpisodesBody(req: Request, _res: Response, next: NextFunction) {
	const result = SaveSeriesWithEpisodesSchema.safeParse(req.body)

	if (!result.success) {
		const formattedErrors = formatZodErrors(result.error.issues)
		throw new ValidationError('Invalid request body', formattedErrors)
	}

	req.body = result.data
	const body: ISaveSeriesWithEpisodesParams = req.body

	for (const episode of body.episodesToSave) {
		if (!episode.language_cas && !episode.language_lat) throw new ValidationError('You need specify one language at latest')
		if (!episode.telegram_file_id_cas && !episode.telegram_file_id_lat)
			throw new ValidationError('You need specify one telegram file id at latest')
	}

	next()
}
