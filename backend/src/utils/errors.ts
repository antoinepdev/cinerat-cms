export interface IFieldError {
	field: string
	message: string
}

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
	readonly errors?: IFieldError[]
	constructor(message: string, errors?: IFieldError[]) {
		super(message, 422)
		this.errors = errors
	}
}

export class InvalidPosterUrlError extends AppError {
	constructor(posterUrl: string) {
		super(`Invalid poster url: ${posterUrl}`, 422)
	}
}

export class InvalidTelegramFileIdError extends AppError {
	constructor(telegramFileId: number) {
		super(`Invalid telegram_file_id: ${telegramFileId}`, 422)
	}
}
