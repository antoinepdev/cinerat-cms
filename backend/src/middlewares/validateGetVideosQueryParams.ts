import type { NextFunction, Request, Response } from 'express'
import { formatZodErrors } from '../helpers/formatZodErrors.ts'
import { IncomingVideoFiltersSchema } from '../schemas/incomingVideo.ts'
import { ValidationError } from '../utils/errors.ts'

export async function validateGetVideosQueryParams(req: Request, _res: Response, next: NextFunction) {
	const result = IncomingVideoFiltersSchema.safeParse(req.query)

	if (!result.success) {
		const formattedErrors = formatZodErrors(result.error.issues)
		throw new ValidationError('Invalid query params', formattedErrors)
	}

	req.filteredVideoQuery = result.data
	const query = req.filteredVideoQuery

	if (query?.sort_direction) {
		if (!query?.sort_by) throw new ValidationError('If you use sort_direction filter you need also specify sort_by filter')
	}

	next()
}
