import type { $ZodIssue } from 'zod/v4/core'
import type { IFieldError } from '../utils/errors.ts'

export function formatZodErrors(errors: $ZodIssue[]): IFieldError[] {
	const formattedErrors = errors.map((issue) => {
		return { field: issue.path.join('.'), message: issue.message }
	})
	return formattedErrors
}
