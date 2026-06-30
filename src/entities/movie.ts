import type { ITelegramMovieInput } from "../schemas/movie.ts"

export interface ITelegramMovie extends ITelegramMovieInput {
  id: number
}
