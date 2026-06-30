import type { IMovieInput, ITelegramMovieInput } from "../schemas/movie.ts"

export interface ITelegramMovie extends ITelegramMovieInput {
  id: number
}

export interface IMovie extends IMovieInput {
  id: number
  telegram_poster_id: number
}
