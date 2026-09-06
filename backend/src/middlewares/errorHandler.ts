import type { NextFunction, Request, Response } from 'express'
import { NotFoundError, ValidationError } from '../utils/errors.ts'

export function errorHandler(error: unknown, _: Request, res: Response, __: NextFunction) {
	if (error instanceof Error) {
		if (error instanceof NotFoundError) return res.status(error.statusCode).json({ error: error.message })
		if (error instanceof ValidationError) return res.status(error.statusCode).json({ error: error.message })

		// telegram errors
		if (error.message.includes('wrong type of the web page content')) {
			return res.status(400).json({ error: 'Invalid poster url' })
		}
		if (error.message.includes('message to copy not found')) {
			return res.status(400).json({ error: 'Invalid telegram_file_id' })
		}

		console.log(error.message)
		return res.status(500).json({ error: 'Server internal error' })
	}

	console.log(error)
	return res.status(500).json({ error: 'Server internal error' })
}
