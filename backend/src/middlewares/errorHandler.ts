import type { NextFunction, Request, Response } from 'express'
import { NotFoundError } from '../utils/errors.ts'

export async function errorHandler(error: unknown, _: Request, res: Response, __: NextFunction) {
	if (error instanceof NotFoundError) return res.status(error.statusCode).json({ error: error.message })

	if (error.code === 'ETELEGRAM') {
		if (error.message.includes('wrong type of the web page content')) {
			return res.status(400).json({ error: 'Invalid poster url' })
		} else if (error.message.includes('message to copy not found')) {
			return res.status(400).json({ error: 'Invalid telegram_file_id' })
		}
	}

	console.log(error.code, error.message)
	return res.status(500).json({ error: 'Server internal error' })
}
