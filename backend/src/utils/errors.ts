export class AppError extends Error {
	readonly status: number

	constructor(message: string, status: number) {
		super(message)
		this.status = status
	}
}

export class NotFoundError extends AppError {
	constructor(message: string = 'Movie not found') {
		super(message, 404)
	}
}

export class ValidationError extends AppError {
	constructor(message: string) {
		super(message, 422)
	}
}
