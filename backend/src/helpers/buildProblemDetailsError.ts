import { STATUS_CODES } from 'node:http'
import type { IFieldError } from '../utils/errors.ts'

interface IProps {
	message: string
	status: number
	errors?: IFieldError[]
}

export function buildProblemDetailsError({ message, status, errors }: IProps) {
	const problemDetailsError = {
		type: 'about:blank',
		title: STATUS_CODES[status],
		detail: message,
		status,
		errors,
	}
	return problemDetailsError
}
