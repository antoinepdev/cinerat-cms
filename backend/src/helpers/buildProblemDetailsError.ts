import { STATUS_CODES } from 'node:http'

interface IProps {
	message: string
	status: number
}

export function buildProblemDetailsError({ message, status }: IProps) {
	const problemDetailsError = {
		type: 'about:blank',
		title: STATUS_CODES[status],
		detail: message,
		status,
	}

	return problemDetailsError
}
