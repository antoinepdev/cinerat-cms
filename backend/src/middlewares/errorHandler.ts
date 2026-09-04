import type { NextFunction, Request, Response } from 'express'
import { NotFoundError } from '../utils/errors.ts'

export async function errorHandler(error: unknown, _: Request, res: Response, __: NextFunction) {
	if (error instanceof Error) {
		if (error instanceof NotFoundError) return res.status(error.statusCode).json({ error: error.message })

		// telegram errors
		if (error.message.includes('wrong type of the web page content')) {
			return res.status(400).json({ error: 'Invalid poster url' })
		} else if (error.message.includes('message to copy not found')) {
			return res.status(400).json({ error: 'Invalid telegram_file_id' })
		}

		// unexpected errors
		else {
			console.log(error.message)
			return res.status(500).json({ error: 'Server internal error' })
		}
	}
}
