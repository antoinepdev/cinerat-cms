import type { DatabaseError } from 'pg'
import { describe, expect, it } from 'vitest'
import { mapDatabaseError } from './mapDatabaseError.ts'

type ExpectedError = { message: string; status: number; field: string | undefined } | undefined

function makeDbError(overrides: Partial<Pick<DatabaseError, 'code' | 'column' | 'constraint'>> = {}): DatabaseError {
	return { code: '23505', ...overrides } as DatabaseError
}

describe('mapDatabaseError', () => {
	it.for<{ name: string; error: DatabaseError; expected: ExpectedError }>([
		{
			name: 'unknown code',
			error: makeDbError({ code: '98765' }),
			expected: undefined,
		},
		{
			name: 'unique violation without field info',
			error: makeDbError({ code: '23505' }),
			expected: { message: 'Duplicate value violates an unique constraint', status: 409, field: undefined },
		},
		{
			name: 'unique violation with column',
			error: makeDbError({ code: '23505', column: 'title_en' }),
			expected: { message: 'Duplicate value for field title_en', status: 409, field: 'title_en' },
		},
		{
			name: 'unique violation with constraint movies_title_en_key',
			error: makeDbError({ code: '23505', constraint: 'movies_title_en_key' }),
			expected: { message: 'Duplicate value for field title_en', status: 409, field: 'title_en' },
		},
		{
			name: 'check violation without field info',
			error: makeDbError({ code: '23514' }),
			expected: { message: 'Invalid value violates a database constraint', status: 422, field: undefined },
		},
		{
			name: 'check violation with constraint movies_language_cas_check',
			error: makeDbError({ code: '23514', constraint: 'movies_language_cas_check' }),
			expected: {
				message: 'Value for field language_cas violates the constraint movies_language_cas_check',
				status: 422,
				field: 'language_cas',
			},
		},
		{
			name: 'not null violation with column',
			error: makeDbError({ code: '23502', column: 'description' }),
			expected: { message: 'Field description cannot be null', status: 422, field: 'description' },
		},
		{
			name: 'not null violation without field info',
			error: makeDbError({ code: '23502' }),
			expected: { message: 'A required field cannot be null', status: 422, field: undefined },
		},
		{
			name: 'foreign key violation with column',
			error: makeDbError({ code: '23503', column: 'telegram_poster_id' }),
			expected: {
				message: 'Related record for field telegram_poster_id does not exist',
				status: 409,
				field: 'telegram_poster_id',
			},
		},
		{
			name: 'foreign key violation without field info',
			error: makeDbError({ code: '23503' }),
			expected: { message: 'Related record does not exist', status: 409, field: undefined },
		},
		{
			name: 'numeric out of range with column',
			error: makeDbError({ code: '22003', column: 'year' }),
			expected: { message: 'Invalid value for field year violates a database constraint', status: 422, field: 'year' },
		},
		{
			name: 'invalid text representation with constraint movies_year_check',
			error: makeDbError({ code: '22P02', constraint: 'movies_year_check' }),
			expected: {
				message: 'Value for field year violates the constraint movies_year_check',
				status: 422,
				field: 'year',
			},
		},
	])('$name', ({ error, expected }) => {
		const result = mapDatabaseError(error)

		if (expected === undefined) {
			expect(result).toBeUndefined()
			return
		}
		expect(result?.message).toBe(expected.message)
		expect(result?.status).toBe(expected.status)
		if (expected.field === undefined) {
			expect(result?.errors).toEqual([])
		} else {
			expect(result?.errors).toEqual([{ field: expected.field, message: expected.message }])
		}
	})
})
