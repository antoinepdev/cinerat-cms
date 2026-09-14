import { AppError } from '../utils/errors.ts'
import type { ITelegramError } from './isTelegramApiError.ts'

export function mapTelegramError(error: Error & ITelegramError): AppError | undefined {
	const { error_code: code = 0, description = '' } = error.response.body
	if (code !== 400) return undefined

	if (description.includes('wrong type of the web page content') || description.includes('failed to get HTTP URL content'))
		return new AppError('Invalid poster url', 422)
	if (description.includes('message to copy not found')) return new AppError('Invalid telegram_file_id', 422)

	return undefined
}
