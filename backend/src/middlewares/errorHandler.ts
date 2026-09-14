import type { NextFunction, Request, Response } from 'express'
import { DatabaseError } from 'pg'
import { buildProblemDetailsError } from '../helpers/buildProblemDetailsError.ts'
import { isTelegramApiError } from '../helpers/isTelegramApiError.ts'
import { mapDatabaseError } from '../helpers/mapDatabaseError.ts'
import { mapTelegramError } from '../helpers/mapTelegramError.ts'
import { AppError, type IFieldError } from '../utils/errors.ts'

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
	if (error instanceof DatabaseError) {
		const dbError = mapDatabaseError(error)
		if (dbError) return sendErrorResponse({ res, message: dbError.message, status: dbError.status, errors: dbError.errors })
	}
	if (isTelegramApiError(error)) {
		const tgError = mapTelegramError(error)
		if (tgError) return sendErrorResponse({ res, message: tgError.message, status: tgError.status })
	}
	if (error instanceof AppError)
		return sendErrorResponse({ res, message: error.message, status: error.status, errors: error.errors })

	console.log(error)
	return sendErrorResponse({ res, message: 'Server internal error', status: 500 })
}
