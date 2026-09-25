import type { NextFunction, Request, Response } from 'express'
import { formatZodErrors } from '../helpers/formatZodErrors.ts'
import { MovieFiltersSchema } from '../schemas/movie.ts'
import { ValidationError } from '../utils/errors.ts'

export async function validateGetMoviesQueryParams(req: Request, _res: Response, next: NextFunction) {
	const result = MovieFiltersSchema.safeParse(req.query)

	if (!result.success) {
		const formattedErrors = formatZodErrors(result.error.issues)
		throw new ValidationError('Invalid query params', formattedErrors)
	}

	req.filteredQuery = result.data
	const query = req.filteredQuery

	if (query?.catalog_version) {
		if (!query?.catalog_name)
			throw new ValidationError('If you use catalog_version filter you need also specify catalog_name filter')
	}

	if (query?.sort_direction) {
		if (!query?.sort_by) throw new ValidationError('If you use sort_direction filter you need also specify sort_by filter')
	}

	next()
}
