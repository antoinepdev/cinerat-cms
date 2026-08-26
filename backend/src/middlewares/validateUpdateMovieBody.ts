import type { NextFunction, Request, Response } from 'express'
import { type IMovieToUpdateParams, MovieToUpdateParamsSchema } from '../schemas/movie.ts'

export async function validateUpdateMovieBody(req: Request, res: Response, next: NextFunction) {
	const result = MovieToUpdateParamsSchema.safeParse(req.body)

	if (!result.success) {
		return res.status(400).json({ error: 'Invalidated Body' })
	}

	req.body = result.data
	const body: IMovieToUpdateParams = req.body

	const hasFieldsToUpdate =
		body.language_cas !== undefined ||
		body.language_lat !== undefined ||
		body.telegram_file_id_cas !== undefined ||
		body.telegram_file_id_lat !== undefined

	if (!hasFieldsToUpdate)
		return res.status(400).json({ error: 'You need specify at least one field to update' })

	next()
}
