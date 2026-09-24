import type { NextFunction, Request, Response } from 'express'
import { DatabaseError } from 'pg'
import { describe, expect, it, vi } from 'vitest'
import { NotFoundError, ValidationError } from '../utils/errors.ts'
import { errorHandler } from './errorHandler.ts'

function makeRes() {
	const res = {
		status: vi.fn(),
		type: vi.fn(),
		json: vi.fn(),
	}
	res.status.mockReturnValue(res)
	res.type.mockReturnValue(res)
	return res
}

function makeDbError(overrides: Record<string, unknown> = {}) {
	return Object.assign(new DatabaseError('insert into movies ...', 0, 'error'), {
		code: '23505',
		constraint: 'movies_tmdb_id_unique',
		...overrides,
	})
}

function makeTelegramApiError(overrides: Record<string, unknown> = {}) {
	return Object.assign(new Error('Telegram API error'), {
		code: 'ETELEGRAM',
		response: { body: { error_code: 400, description: 'wrong type of the web page content' }, ...overrides },
	})
}

describe('errorHandler', () => {
	it('responds with the AppError status and message as problem+json', () => {
		const res = makeRes()
		const next = vi.fn()

		errorHandler(new NotFoundError(), {} as unknown as Request, res as unknown as Response, next as NextFunction)

		expect(res.status).toHaveBeenCalledWith(404)
		expect(res.type).toHaveBeenCalledWith('application/problem+json')
		expect(res.json).toHaveBeenCalledWith({
			type: 'about:blank',
			title: 'Not Found',
			detail: 'Movie not found',
			status: 404,
			errors: undefined,
		})

		expect(next).not.toHaveBeenCalled()
	})

	it('includes the field errors for a ValidationError', () => {
		const res = makeRes()
		const fieldErrors = [{ field: 'year', message: 'Invalid year' }]

		errorHandler(
			new ValidationError('Invalid movie', fieldErrors),
			{} as unknown as Request,
			res as unknown as Response,
			vi.fn() as NextFunction,
		)

		expect(res.status).toHaveBeenCalledWith(422)
		expect(res.json).toHaveBeenCalledWith({
			type: 'about:blank',
			title: 'Unprocessable Entity',
			detail: 'Invalid movie',
			status: 422,
			errors: fieldErrors,
		})
	})

	it('maps a database unique violation to a 409 problem+json response', () => {
		const res = makeRes()

		errorHandler(makeDbError(), {} as unknown as Request, res as unknown as Response, vi.fn() as NextFunction)

		expect(res.status).toHaveBeenCalledWith(409)
		expect(res.json).toHaveBeenCalledWith({
			type: 'about:blank',
			title: 'Conflict',
			detail: 'Duplicate value for field tmdb_id',
			status: 409,
			errors: [{ field: 'tmdb_id', message: 'Duplicate value for field tmdb_id' }],
		})
	})

	it('maps a telegram API error when the poster url is invalid', () => {
		const res = makeRes()

		errorHandler(makeTelegramApiError(), {} as unknown as Request, res as unknown as Response, vi.fn() as NextFunction)

		expect(res.status).toHaveBeenCalledWith(422)
		expect(res.json).toHaveBeenCalledWith({
			type: 'about:blank',
			title: 'Unprocessable Entity',
			detail: 'Invalid poster url',
			status: 422,
			errors: undefined,
		})
	})

	it('responds 400 with problem+json when the JSON body is malformed', () => {
		const res = makeRes()
		const error = new SyntaxError('Unexpected token } in JSON at position 5')
		;(error as { status?: number }).status = 400

		errorHandler(error, {} as unknown as Request, res as unknown as Response, vi.fn() as NextFunction)

		expect(res.status).toHaveBeenCalledWith(400)
		expect(res.json).toHaveBeenCalledWith({
			type: 'about:blank',
			title: 'Bad Request',
			detail: 'Malformed JSON body',
			status: 400,
			errors: undefined,
		})
	})

	it('logs the error and responds 500 for unknown errors', () => {
		const res = makeRes()
		const error = new Error('boom')
		const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

		errorHandler(error, {} as unknown as Request, res as unknown as Response, vi.fn() as NextFunction)

		expect(logSpy).toHaveBeenCalledWith(error)
		expect(res.status).toHaveBeenCalledWith(500)
		expect(res.json).toHaveBeenCalledWith({
			type: 'about:blank',
			title: 'Internal Server Error',
			detail: 'Server internal error',
			status: 500,
			errors: undefined,
		})
	})
})
