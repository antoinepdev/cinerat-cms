import type { NextFunction, Request, Response } from 'express'
import { z } from 'zod'
import { formatZodErrors } from '../helpers/formatZodErrors.ts'
import { ValidationError } from '../utils/errors.ts'

const VideoIdParamSchema = z
	.object({
		id: z.coerce.number().int().positive(),
	})
	.strict()

export async function validateVideoIdParam(req: Request, _res: Response, next: NextFunction) {
	const result = VideoIdParamSchema.safeParse(req.params)

	if (!result.success) {
		const formattedErrors = formatZodErrors(result.error.issues)
		throw new ValidationError('Invalid video id', formattedErrors)
	}

	req.filteredParams = result.data
	next()
}
