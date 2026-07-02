import type { IMovie, IMovieToSave } from "../../entities/movie.ts"
import { movieRepository } from "../../repositories/movie.ts"
import type { IMovieInput } from "../../schemas/movie.ts"
import { telegramService } from "../telegram.ts"

export async function saveMovie (movie: IMovieInput): Promise<IMovie> {
  const old_telegram_file_ids = [movie.telegram_file_id_cas, movie.telegram_file_id_lat].filter(Boolean)

  const movieToSave: IMovieToSave = await telegramService.saveMovie(movie)
  const savedMovie = await movieRepository.saveMovie({ ...movieToSave, quality: undefined })
  await telegramService.setTelegramMovieAsSaved(old_telegram_file_ids)

  return savedMovie
}