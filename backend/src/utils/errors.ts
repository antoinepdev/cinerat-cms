export interface IFieldError {
	field: string
	message: string
}

export class AppError extends Error {
	readonly status
	readonly errors

	constructor(message: string, status: number, errors?: IFieldError[]) {
		super(message)
		this.status = status
		this.errors = errors
	}
}

export class NotFoundError extends AppError {
	constructor(message: string = 'Movie not found') {
		super(message, 404)
	}
}

export class ValidationError extends AppError {
	constructor(message: string, errors?: IFieldError[]) {
		super(message, 422, errors)
	}
}
