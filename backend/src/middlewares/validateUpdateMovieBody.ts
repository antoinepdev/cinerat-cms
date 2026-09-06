import type { NextFunction, Request, Response } from 'express'
import { type IMovieToUpdateParams, MovieToUpdateParamsSchema } from '../schemas/movie.ts'
import { ValidationError } from '../utils/errors.ts'

export async function validateUpdateMovieBody(req: Request, _res: Response, next: NextFunction) {
	const result = MovieToUpdateParamsSchema.safeParse(req.body)

	if (!result.success) throw new ValidationError('Invalid request body')

	req.body = result.data
	const body: IMovieToUpdateParams = req.body

	const hasFieldsToUpdate = body.telegram_file_id_cas !== undefined || body.telegram_file_id_lat !== undefined

	if (!hasFieldsToUpdate) throw new ValidationError('You need specify at least one field to update')

	next()
}
