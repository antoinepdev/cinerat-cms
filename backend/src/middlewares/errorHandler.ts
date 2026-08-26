import type { NextFunction, Request, Response } from 'express'

export async function errorHandler(error: any, _: Request, res: Response, __: NextFunction) {
	if (error.code === 'ETELEGRAM') {
		if (error.message.includes('wrong type of the web page content')) {
			return res.status(400).json({ error: 'Invalid poster url' })
		} else if (error.message.includes('message to copy not found')) {
			return res.status(400).json({ error: 'Invalid telegram_file_id' })
		}
	}

	if (error.message === 'Movie not found') {
		return res.status(404).json({ error: 'Movie not found' })
	}

	console.log(error.code, error.message)
	return res.status(500).json({ error: 'Server internal error' })
}
