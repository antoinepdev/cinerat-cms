import type { IMovieInput, ITelegramMovieInput } from "../schemas/movie.ts"

export interface ITelegramMovie extends ITelegramMovieInput {
  id: number
}

export interface IMovieToSave extends IMovieInput {
  telegram_poster_id: number
}

export interface IMovie extends IMovieToSave {
  id: number
}