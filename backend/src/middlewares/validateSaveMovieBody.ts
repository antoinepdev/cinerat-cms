import type { NextFunction, Request, Response } from 'express'
import { formatZodErrors } from '../helpers/formatZodErrors.ts'
import { type IMovieInput, MovieSchema } from '../schemas/movie.ts'
import { ValidationError } from '../utils/errors.ts'

export async function validateSaveMovieBody(req: Request, _res: Response, next: NextFunction) {
	const result = MovieSchema.safeParse(req.body)

	if (!result.success) {
		const formattedErrors = formatZodErrors(result.error.issues)
		throw new ValidationError('Invalid request body', formattedErrors)
	}

	req.body = result.data
	const body: IMovieInput = req.body

	if (!body.language_cas && !body.language_lat) throw new ValidationError('You need specify one language at latest')
	if (!body.telegram_file_id_cas && !body.telegram_file_id_lat)
		throw new ValidationError('You need specify one telegram file id at latest')

	next()
}
