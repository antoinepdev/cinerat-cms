import type { IMovie, IMovieToSave } from '../entities/movie.ts'
import { movieRepository } from '../repositories/movie.ts'
import type { IMovieFilters, IMovieInput, IMovieToUpdateParams } from '../schemas/movie.ts'
import { NotFoundError } from '../utils/errors.ts'
import { telegramService } from './telegram.ts'

async function getMovies(filters: IMovieFilters) {
	const movies = await movieRepository.getMovies(filters)
	return movies
}

async function getTelegramMovies() {
	const telegramMovies = await movieRepository.getTelegramMovies()
	return telegramMovies
}

async function saveMovie(movie: IMovieInput): Promise<IMovie> {
	const old_telegram_file_ids = [movie.telegram_file_id_cas, movie.telegram_file_id_lat].filter((id): id is number => Boolean(id))

	const movieToSave: IMovieToSave = await telegramService.saveMovie(movie)
	const savedMovie = await movieRepository.saveMovie({ ...movieToSave, quality: undefined })
	await telegramService.setTelegramMovieAsSaved(old_telegram_file_ids)

	return savedMovie
}

async function updateMovie(data: IMovieToUpdateParams): Promise<IMovie> {
	const updatedMovie = await movieRepository.updateMovie(data)
	if (!updatedMovie) throw new NotFoundError()
	return updatedMovie
}

export const movieService = {
	getMovies,
	getTelegramMovies,
	saveMovie,
	updateMovie,
}
