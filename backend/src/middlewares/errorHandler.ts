import type { NextFunction, Request, Response } from 'express'
import { buildProblemDetailsError } from '../helpers/buildProblemDetailsError.ts'
import { type IFieldError, NotFoundError, ValidationError } from '../utils/errors.ts'

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
	if (error instanceof Error) {
		if (error instanceof NotFoundError) return sendErrorResponse({ res, message: error.message, status: error.status })
		if (error instanceof ValidationError)
			return sendErrorResponse({ res, message: error.message, status: error.status, errors: error.errors })

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
