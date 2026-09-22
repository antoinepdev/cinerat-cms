import { describe, expect, it } from 'vitest'
import type { ITelegramError } from './isTelegramApiError.ts'
import { mapTelegramError } from './mapTelegramError.ts'

type ExpectedError = { message: string; status: number } | undefined

function makeTelegramError(body: { error_code?: number; description?: string } = {}): Error & ITelegramError {
	const error = Object.assign(new Error('API error'), {
		code: 'ETELEGRAM',
		response: { body },
	}) as Error & ITelegramError
	return error
}

describe('mapTelegramError', () => {
	it.for<{ name: string; body: { error_code?: number; description?: string }; expected: ExpectedError }>([
		{
			name: '400 with "wrong type of the web page content"',
			body: { error_code: 400, description: 'wrong type of the web page content' },
			expected: { message: 'Invalid poster url', status: 422 },
		},
		{
			name: '400 with "failed to get HTTP URL content"',
			body: { error_code: 400, description: 'failed to get HTTP URL content' },
			expected: { message: 'Invalid poster url', status: 422 },
		},
		{
			name: '400 with "message to copy not found"',
			body: { error_code: 400, description: 'message to copy not found' },
			expected: { message: 'Invalid telegram_file_id', status: 422 },
		},
		{
			name: '400 with unknown description',
			body: { error_code: 400, description: 'some server error' },
			expected: undefined,
		},
		{
			name: 'other error code even with known description',
			body: { error_code: 429, description: 'wrong type of the web page content' },
			expected: undefined,
		},
		{
			name: 'missing error_code (defaults to 0)',
			body: { description: 'failed to get HTTP URL content' },
			expected: undefined,
		},
	])('$name', ({ body, expected }) => {
		const result = mapTelegramError(makeTelegramError(body))

		if (expected === undefined) {
			expect(result).toBeUndefined()
			return
		}
		expect(result?.message).toBe(expected.message)
		expect(result?.status).toBe(expected.status)
	})
})