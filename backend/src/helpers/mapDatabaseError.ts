import { DatabaseError as PgDatabaseError } from 'pg'
import { DatabaseError, type IFieldError } from '../utils/errors.ts'

function getField(error: PgDatabaseError): string | undefined {
	if (error.column) return error.column
	if (error.constraint) {
		let field = error.constraint
		field = field.replace(/^movies_/, '')
		field = field.replace(/_(key|check|fk|unique)$/, '')
		return field
	}
	return undefined
}

function buildFieldError(error: PgDatabaseError, message: string): IFieldError[] {
	const field = getField(error)
	if (!field) return []
	return [{ field, message }]
}

function getDuplicateMessage(field: string | undefined) {
	if (!field) return 'Duplicate value violates an unique constraint'
	return `Duplicate value for field ${field}`
}

function getCheckMessage(error: PgDatabaseError, field: string | undefined) {
	if (field && error.constraint) return `Value for field ${field} violates the constraint ${error.constraint}`
	if (field) return `Invalid value for field ${field} violates a database constraint`
	return 'Invalid value violates a database constraint'
}

function getNotNullMessage(field: string | undefined) {
	if (field) return `Field ${field} cannot be null`
	return 'A required field cannot be null'
}

function getForeignKeyMessage(field: string | undefined) {
	if (field) return `Related record for field ${field} does not exist`
	return 'Related record does not exist'
}

function getErrorStatus(code: string) {
	if (code === '23505' || code === '23503') return 409
	return 422
}

export function mapDatabaseError(error: unknown): DatabaseError | undefined {
	if (!(error instanceof PgDatabaseError)) return undefined

	const field = getField(error)

	let message: string
	switch (error.code) {
		case '23505':
			message = getDuplicateMessage(field)
			break
		case '23514':
			message = getCheckMessage(error, field)
			break
		case '23502':
			message = getNotNullMessage(field)
			break
		case '23503':
			message = getForeignKeyMessage(field)
			break
		case '22003':
		case '22P02':
			message = getCheckMessage(error, field)
			break
		default:
			return undefined
	}

	return new DatabaseError(message, getErrorStatus(error.code), buildFieldError(error, message))
}
