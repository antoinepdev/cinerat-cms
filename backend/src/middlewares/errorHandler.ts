import type { NextFunction, Request, Response } from 'express'
import { buildProblemDetailsError } from '../helpers/buildProblemDetailsError.ts'
import { mapDatabaseError } from '../helpers/mapDatabaseError.ts'
import {
	type IFieldError,
	InvalidPosterUrlError,
	InvalidTelegramFileIdError,
	NotFoundError,
	ValidationError,
} from '../utils/errors.ts'

interface IProps {
	res: Response
	message: string
	status: number
	errors?: IFieldError[]
}

function sendErrorResponse({ res, message, status, errors }: IProps) {
	return res.status(status).type('application/problem+json').json(buildProblemDetailsError({ message, status, errors }))
}

export function errorHandler(error: unknown, _: Request, res: Response, __: NextFunction) {
	if (error instanceof NotFoundError) return sendErrorResponse({ res, message: error.message, status: error.status })
	if (error instanceof ValidationError)
		return sendErrorResponse({ res, message: error.message, status: error.status, errors: error.errors })

	if (error instanceof InvalidPosterUrlError) return sendErrorResponse({ res, message: error.message, status: error.status })
	if (error instanceof InvalidTelegramFileIdError) return sendErrorResponse({ res, message: error.message, status: error.status })

	const dbError = mapDatabaseError(error)
	if (dbError) return sendErrorResponse({ res, message: dbError.message, status: dbError.status, errors: dbError.errors })

	console.log(error)
	return sendErrorResponse({ res, message: 'Server internal error', status: 500 })
}
