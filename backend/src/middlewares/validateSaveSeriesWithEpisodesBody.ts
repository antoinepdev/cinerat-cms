import type { NextFunction, Request, Response } from 'express'
import { formatZodErrors } from '../helpers/formatZodErrors.ts'
import { SaveSeriesWithEpisodesSchema } from '../schemas/series.ts'
import { ValidationError } from '../utils/errors.ts'

export async function validateSaveSeriesWithEpisodesBody(req: Request, _res: Response, next: NextFunction) {
	const result = SaveSeriesWithEpisodesSchema.safeParse(req.body)

	if (!result.success) {
		const formattedErrors = formatZodErrors(result.error.issues)
		throw new ValidationError('Invalid request body', formattedErrors)
	}

	req.body = result.data
	next()
}
