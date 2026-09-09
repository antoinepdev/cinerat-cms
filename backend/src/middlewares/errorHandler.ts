import type { NextFunction, Request, Response } from 'express'
import { buildProblemDetailsError } from '../helpers/buildProblemDetailsError.ts'
import { NotFoundError, ValidationError } from '../utils/errors.ts'

function sendErrorResponse({ res, message, status }: { res: Response; message: string; status: number }) {
	return res.status(status).json(buildProblemDetailsError({ message, status }))
}

export function errorHandler(error: unknown, _: Request, res: Response, __: NextFunction) {
	if (error instanceof Error) {
		if (error instanceof NotFoundError) return sendErrorResponse({ res, message: error.message, status: error.status })
		if (error instanceof ValidationError) return sendErrorResponse({ res, message: error.message, status: error.status })

		// telegram errors
		if (error.message.includes('wrong type of the web page content'))
			return sendErrorResponse({ res, message: 'Invalid poster url', status: 422 })

		if (error.message.includes('message to copy not found'))
			return sendErrorResponse({ res, message: 'Invalid telegram_file_id', status: 422 })

		console.log(error.message)
		return sendErrorResponse({ res, message: 'Server internal error', status: 500 })
	}

	console.log(error)
	return sendErrorResponse({ res, message: 'Server internal error', status: 500 })
}
