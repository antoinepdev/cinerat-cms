import type { IIncomingVideoInput } from '../schemas/incomingVideo.ts'

export interface IIncomingVideo extends IIncomingVideoInput {
	id: number
	created_at: Date
	updated_at: Date
}
