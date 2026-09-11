interface ITelegramError {
	code: string
	response: {
		body: {
			error_code?: number
			description?: string
		}
	}
}

export function isTelegramApiError(error: unknown): error is Error & ITelegramError {
	return (
		error instanceof Error &&
		'code' in error &&
		error.code === 'ETELEGRAM' &&
		'response' in error &&
		typeof error.response === 'object' &&
		error.response !== null
	)
}
