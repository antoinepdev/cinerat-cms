import type { NextFunction, Request, Response } from 'express'
import { MovieFiltersSchema } from '../schemas/movie.ts'
import { ValidationError } from '../utils/errors.ts'

export async function validateGetMoviesQueryParams(req: Request, _res: Response, next: NextFunction) {
	const result = MovieFiltersSchema.safeParse(req.query)

	if (!result.success) throw new ValidationError('Invalidated query params')

	req.filteredQuery = result.data
	const query = req.filteredQuery

	if (query?.catalog_version) {
		if (!query?.catalog_name)
			throw new ValidationError('If you use catalog_version filter you need also specify catalog_name filter')
	}
	next()
}
