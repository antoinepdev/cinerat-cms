import { describe, expect, it, vi } from 'vitest'
import type { IMovie, IMovieToSave } from '../entities/movie.ts'
import { movieRepository } from '../repositories/movie.ts'
import type { IMovieToUpdateParams } from '../schemas/movie.ts'
import { NotFoundError } from '../utils/errors.ts'
import { movieService } from './movies.ts'
import { telegramService } from './telegram.ts'

vi.mock('../repositories/movie.ts', () => ({
	movieRepository: {
		getMovies: vi.fn(),
		saveMovie: vi.fn(),
		updateMovie: vi.fn(),
	},
}))

vi.mock('./telegram.ts', () => ({
	telegramService: {
		saveMovie: vi.fn(),
		updateMovieFiles: vi.fn(),
		markVideosAsProcessed: vi.fn(),
	},
}))

function makeMovie(overrides: Partial<IMovie> = {}): IMovie {
	return {
		id: 1,
		title_en: 'Avatar',
		year: 2009,
		poster: 'https://image.tmdb.org/poster.jpg',
		description: 'A description',
		tmdb_id: 19995,
		popularity: 10,
		backdrop_path: 'https://image.tmdb.org/backdrop.jpg',
		genres: ['Science Fiction'],
		catalog_name: 'cine',
		catalog_version: 5,
		telegram_poster_id: 100,
		language_cas: true,
		telegram_file_id_cas: 123,
		...overrides,
	} as IMovie
}

describe('movieService', () => {
	describe('saveMovie', () => {
		it('saves the movie and marks its videos as processed', async () => {
			const movie = makeMovie()
			const movieToSave: IMovieToSave = { ...movie, telegram_poster_id: 100 }
			vi.mocked(telegramService.saveMovie).mockResolvedValue(movieToSave)
			vi.mocked(movieRepository.saveMovie).mockResolvedValue(movie)
			vi.mocked(telegramService.markVideosAsProcessed).mockResolvedValue()

			const result = await movieService.saveMovie(movie)

			expect(telegramService.saveMovie).toHaveBeenCalledWith(movie)
			expect(movieRepository.saveMovie).toHaveBeenCalledWith({ ...movieToSave, quality: undefined })
			expect(telegramService.markVideosAsProcessed).toHaveBeenCalledWith([123])
			expect(result).toBe(movie)
		})

		it('does not mark videos when the movie has no telegram file ids', async () => {
			const movie = makeMovie({ telegram_file_id_cas: undefined, telegram_file_id_lat: undefined })
			vi.mocked(telegramService.saveMovie).mockResolvedValue({ ...makeMovie(), telegram_poster_id: 100 })
			vi.mocked(movieRepository.saveMovie).mockResolvedValue(movie)

			await movieService.saveMovie(movie)

			expect(telegramService.markVideosAsProcessed).toHaveBeenCalledWith([])
		})
	})

	describe('updateMovie', () => {
		it('updates the movie files and marks its videos as processed', async () => {
			const params: IMovieToUpdateParams = { tmdb_id: 19995, telegram_file_id_cas: 456 }
			const updatedMovie = makeMovie({ telegram_file_id_cas: 456 })
			vi.mocked(telegramService.updateMovieFiles).mockResolvedValue(params)
			vi.mocked(movieRepository.updateMovie).mockResolvedValue(updatedMovie)
			vi.mocked(telegramService.markVideosAsProcessed).mockResolvedValue()

			const result = await movieService.updateMovie(params)

			expect(telegramService.updateMovieFiles).toHaveBeenCalledWith(params)
			expect(movieRepository.updateMovie).toHaveBeenCalledWith(params)
			expect(telegramService.markVideosAsProcessed).toHaveBeenCalledWith([456])
			expect(result).toBe(updatedMovie)
		})

		it('throws NotFoundError when the movie does not exist', async () => {
			const params: IMovieToUpdateParams = { tmdb_id: 999 }
			vi.mocked(telegramService.updateMovieFiles).mockResolvedValue(params)
			vi.mocked(movieRepository.updateMovie).mockResolvedValue(undefined)

			await expect(movieService.updateMovie(params)).rejects.toThrow(NotFoundError)
			expect(telegramService.markVideosAsProcessed).not.toHaveBeenCalled()
		})
	})
})
