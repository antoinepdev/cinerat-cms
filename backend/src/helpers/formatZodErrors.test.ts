import { describe, expect, it } from 'vitest'
import type { $ZodIssue } from 'zod/v4/core'
import { formatZodErrors } from './formatZodErrors.ts'

function makeIssue(path: PropertyKey[], message: string): $ZodIssue {
	return { path, message } as unknown as $ZodIssue
}

describe('formatZodErrors', () => {
	it.for<{ name: string; issues: $ZodIssue[]; expected: { field: string; message: string }[] }>([
		{
			name: 'no issues',
			issues: [],
			expected: [],
		},
		{
			name: 'one issue at the root',
			issues: [makeIssue(['title_en'], 'Invalid input: expected string, received number')],
			expected: [{ field: 'title_en', message: 'Invalid input: expected string, received number' }],
		},
		{
			name: 'a nested path joins with dots',
			issues: [makeIssue(['a', 'b', 0], 'Invalid input: expected string, received number')],
			expected: [{ field: 'a.b.0', message: 'Invalid input: expected string, received number' }],
		},
		{
			name: 'multiple issues keep order',
			issues: [makeIssue(['title_en'], 'first message'), makeIssue(['year'], 'second message')],
			expected: [
				{ field: 'title_en', message: 'first message' },
				{ field: 'year', message: 'second message' },
			],
		},
	])('formats $name', ({ issues, expected }) => {
		expect(formatZodErrors(issues)).toEqual(expected)
	})
})
