import { describe, expect, it } from 'vitest'
import { isTelegramApiError } from './isTelegramApiError.ts'

interface IProps {
	code?: string
	response?: unknown
}

function makeTelegramError(overrides: IProps = {}): Error {
	const error = Object.assign(new Error('API error'), overrides) as Error & { code?: string; response?: unknown }
	return error
}

describe('isTelegramApiError', () => {
	it.for<{ error: unknown; expected: boolean }>([
		{ error: makeTelegramError({ code: 'ETELEGRAM', response: {} }), expected: true },
		{ error: makeTelegramError({ code: 'ETELEGRAM', response: { body: { error_code: 400 } } }), expected: true },

		{ error: { code: 'ETELEGRAM', response: {} }, expected: false },
		{ error: 'API error', expected: false },

		{ error: makeTelegramError({ code: 'ENOTFOUND', response: {} }), expected: false },

		{ error: makeTelegramError({ response: {} }), expected: false },

		{ error: makeTelegramError({ code: 'ETELEGRAM' }), expected: false },

		{ error: makeTelegramError({ code: 'ETELEGRAM', response: null }), expected: false },

		{ error: makeTelegramError({ code: 'ETELEGRAM', response: 'oops' }), expected: false },
	])('returns $expected (case %#)', ({ error, expected }) => {
		expect(isTelegramApiError(error)).toBe(expected)
	})
})
