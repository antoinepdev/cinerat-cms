import type { IMovie, IMovieToSave } from "../../entities/movie.ts"
import { getMovieCaption } from "../../helpers/getMovieCaption.ts"
import { getPosterCaption } from "../../helpers/getPosterCaption.ts"
import { telegramProvider } from "../../provider/telegram.ts"
import { movieRepository } from "../../repositories/movie.ts"
import type { IMovieInput } from "../../schemas/movie.ts"

export async function saveMovie (data: IMovieInput): Promise<IMovie> {
  const posterCaption = await getPosterCaption(data)
  const telegram_poster_id = await telegramProvider.sendPoster(data.poster, posterCaption)

  const old_telegram_file_id_cas = data.telegram_file_id_cas
  const old_telegram_file_id_lat = data.telegram_file_id_lat

 if (data.telegram_file_id_cas) {
    const movieCaption = await getMovieCaption(data, 'cas')
    data.telegram_file_id_cas = await telegramProvider.sendMovie(data.telegram_file_id_cas, movieCaption)
  }
  if (data.telegram_file_id_lat) {
    const movieCaption = await getMovieCaption(data, 'lat')
    data.telegram_file_id_lat = await telegramProvider.sendMovie(data.telegram_file_id_lat, movieCaption)
  }

  const movie: IMovieToSave = { ...data, quality: undefined, telegram_poster_id }
  const savedMovie = await movieRepository.saveMovie(movie)

  const telegram_file_ids = [old_telegram_file_id_cas, old_telegram_file_id_lat].filter(Boolean)
  for (const fi of telegram_file_ids) {
    if (fi) {
      const updatedTelegramMovie = await movieRepository.updateTelegramMovie(fi)
      if (!updatedTelegramMovie) throw new Error ('Failed telegram movie is_saved property update. Not found')
    }
  }

  return savedMovie
}