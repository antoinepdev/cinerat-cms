import type { IMovieInput } from '../schemas/movie.ts'

export interface IMovieToSave extends IMovieInput {
	telegram_poster_id: number
}

export interface IMovie extends IMovieToSave {
	id: number
	created_at: Date
	updated_at: Date
}
