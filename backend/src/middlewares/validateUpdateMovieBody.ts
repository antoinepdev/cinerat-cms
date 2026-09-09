import type { NextFunction, Request, Response } from 'express'
import { formatZodErrors } from '../helpers/formatZodErrors.ts'
import { type IMovieToUpdateParams, MovieToUpdateParamsSchema } from '../schemas/movie.ts'
import { ValidationError } from '../utils/errors.ts'

export async function validateUpdateMovieBody(req: Request, _res: Response, next: NextFunction) {
	const result = MovieToUpdateParamsSchema.safeParse(req.body)

	if (!result.success) {
		const formattedErrors = formatZodErrors(result.error.issues)
		throw new ValidationError('Invalid request body', formattedErrors)
	}

	req.body = result.data
	const body: IMovieToUpdateParams = req.body

	const hasFieldsToUpdate = body.telegram_file_id_cas !== undefined || body.telegram_file_id_lat !== undefined

	if (!hasFieldsToUpdate) throw new ValidationError('You need specify at least one field to update')

	next()
}
