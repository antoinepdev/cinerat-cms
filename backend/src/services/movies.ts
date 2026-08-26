import type { IMovie, IMovieToSave } from '../entities/movie.ts'
import { movieRepository } from '../repositories/movie.ts'
import type { IMovieFilters, IMovieInput, IMovieToUpdateParams } from '../schemas/movie.ts'
import { telegramService } from './telegram.ts'

async function getMovies(filters: IMovieFilters) {
	try {
		const movies = await movieRepository.getMovies(filters)
		return movies
	} catch (error) {
		console.log(error)
		throw new Error('Internal server error')
	}
}

async function getTelegramMovies() {
	try {
		const telegramMovies = await movieRepository.getTelegramMovies()
		return telegramMovies
	} catch (error) {
		throw new Error('Internal server error')
	}
}

async function saveMovie(movie: IMovieInput): Promise<IMovie> {
	const old_telegram_file_ids = [movie.telegram_file_id_cas, movie.telegram_file_id_lat].filter(Boolean)

	const movieToSave: IMovieToSave = await telegramService.saveMovie(movie)
	const savedMovie = await movieRepository.saveMovie({ ...movieToSave, quality: undefined })
	await telegramService.setTelegramMovieAsSaved(old_telegram_file_ids)

	return savedMovie
}

async function updateMovie(data: IMovieToUpdateParams): Promise<IMovie> {
	try {
		const updatedMovie = await movieRepository.updateMovie(data)
		return updatedMovie
	} catch (error) {
		if (error instanceof Error && error.message === 'Movie not found') throw error
		console.log(error)
		throw new Error('Internal server error')
	}
}

export const movieService = {
	getMovies,
	getTelegramMovies,
	saveMovie,
	updateMovie,
}
