import type { IMovie, IMovieToSave } from '../entities/movie.ts'
import { movieRepository } from '../repositories/movie.ts'
import type { IMovieFilters, IMovieInput, IMovieToUpdateParams } from '../schemas/movie.ts'
import { NotFoundError } from '../utils/errors.ts'
import { telegramService } from './telegram.ts'

async function getMovies(filters: IMovieFilters) {
	const movies = await movieRepository.getMovies(filters)
	return movies
}

async function getPendingVideos() {
	const pendingVideos = await movieRepository.getPendingVideos()
	return pendingVideos
}

async function saveMovie(movie: IMovieInput): Promise<IMovie> {
	const sourceMessageIds = [movie.telegram_file_id_cas, movie.telegram_file_id_lat].filter((id): id is number => Boolean(id))

	const movieToSave: IMovieToSave = await telegramService.saveMovie(movie)
	const savedMovie = await movieRepository.saveMovie({ ...movieToSave, quality: undefined })
	await telegramService.markVideosAsProcessed(sourceMessageIds)

	return savedMovie
}

async function updateMovie(data: IMovieToUpdateParams): Promise<IMovie> {
	const sourceMessageIds = [data.telegram_file_id_cas, data.telegram_file_id_lat].filter((id): id is number => Boolean(id))

	const movieToUpdate = await telegramService.updateMovieFiles(data)
	const updatedMovie = await movieRepository.updateMovie(movieToUpdate)
	if (!updatedMovie) throw new NotFoundError()
	await telegramService.markVideosAsProcessed(sourceMessageIds)

	return updatedMovie
}

export const movieService = {
	getMovies,
	getPendingVideos,
	saveMovie,
	updateMovie,
}
