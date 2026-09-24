import type TelegramBot from 'node-telegram-bot-api'
import { describe, expect, it, vi } from 'vitest'
import type { IMovie } from '../entities/movie.ts'
import { bot, MOVIE_CONTAINER_GROUP_ID, MOVIE_LISTENER_GROUP_ID } from '../provider/telegram.ts'
import { movieRepository } from '../repositories/movie.ts'
import { videosRepository } from '../repositories/videos.ts'
import type { IMovieToUpdateParams } from '../schemas/movie.ts'
import { NotFoundError } from '../utils/errors.ts'
import { telegramService } from './telegram.ts'

vi.mock('../provider/telegram.ts', () => ({
	bot: {
		sendPhoto: vi.fn(),
		copyMessage: vi.fn(),
	},
	MOVIE_CONTAINER_GROUP_ID: 101,
	MOVIE_LISTENER_GROUP_ID: 102,
}))

vi.mock('../repositories/movie.ts', () => ({
	movieRepository: {
		getMovies: vi.fn(),
	},
}))

vi.mock('../repositories/videos.ts', () => ({
	videosRepository: {
		markVideoAsProcessed: vi.fn(),
	},
}))

function makeMovie(overrides: Partial<IMovie> = {}): IMovie {
	return {
		id: 1,
		title_en: 'Avatar',
		title_cas: 'Avatar',
		title_lat: 'Avatar',
		year: 2009,
		poster: 'https://image.tmdb.org/poster.jpg',
		description: 'A description',
		tmdb_id: 19995,
		popularity: 10,
		backdrop_path: 'https://image.tmdb.org/backdrop.jpg',
		genres: ['Science Fiction'],
		catalog_name: 'cine',
		catalog_version: 5,
		language_cas: true,
		language_lat: true,
		telegram_file_id_cas: 123,
		telegram_file_id_lat: 456,
		telegram_poster_id: 100,
		...overrides,
	} as IMovie
}

describe('telegramService', () => {
	describe('saveMovie', () => {
		it('sends the poster and both movie files, then returns the movie to save', async () => {
			const input = makeMovie()
			vi.mocked(bot.sendPhoto).mockResolvedValue({ message_id: 500 } as TelegramBot.Message)
			vi.mocked(bot.copyMessage).mockResolvedValue({ message_id: 501 })

			const result = await telegramService.saveMovie(input)

			expect(bot.sendPhoto).toHaveBeenCalledWith(MOVIE_CONTAINER_GROUP_ID, input.poster, { caption: expect.any(String) })
			expect(bot.copyMessage).toHaveBeenCalledTimes(2)
			expect(bot.copyMessage).toHaveBeenCalledWith(MOVIE_CONTAINER_GROUP_ID, MOVIE_LISTENER_GROUP_ID, 123, {
				caption: expect.any(String),
			})
			expect(bot.copyMessage).toHaveBeenCalledWith(MOVIE_CONTAINER_GROUP_ID, MOVIE_LISTENER_GROUP_ID, 456, {
				caption: expect.any(String),
			})
			expect(result.telegram_poster_id).toBe(500)
			expect(result.telegram_file_id_cas).toBe(501)
			expect(result.telegram_file_id_lat).toBe(501)
		})

		it('sends only the poster when the movie has no file ids', async () => {
			const input = makeMovie({ telegram_file_id_cas: undefined, telegram_file_id_lat: undefined })
			vi.mocked(bot.sendPhoto).mockResolvedValue({ message_id: 500 } as TelegramBot.Message)

			const result = await telegramService.saveMovie(input)

			expect(bot.sendPhoto).toHaveBeenCalledTimes(1)
			expect(bot.copyMessage).not.toHaveBeenCalled()
			expect(result.telegram_poster_id).toBe(500)
			expect(result.telegram_file_id_cas).toBeUndefined()
			expect(result.telegram_file_id_lat).toBeUndefined()
		})
	})

	describe('updateMovieFiles', () => {
		it('sends the new movie file when the movie does not have that audio yet', async () => {
			const existingMovie = makeMovie({ language_cas: false, language_lat: false })
			const data: IMovieToUpdateParams = { tmdb_id: 19995, telegram_file_id_cas: 111 }
			vi.mocked(movieRepository.getMovies).mockResolvedValue([existingMovie])
			vi.mocked(bot.copyMessage).mockResolvedValue({ message_id: 777 })

			const result = await telegramService.updateMovieFiles(data)

			expect(movieRepository.getMovies).toHaveBeenCalledWith({ tmdb_id: data.tmdb_id })
			expect(bot.copyMessage).toHaveBeenCalledWith(MOVIE_CONTAINER_GROUP_ID, MOVIE_LISTENER_GROUP_ID, 111, {
				caption: expect.any(String),
			})
			expect(result.telegram_file_id_cas).toBe(777)
		})

		it('throws NotFoundError when the movie does not exist', async () => {
			vi.mocked(movieRepository.getMovies).mockResolvedValue([])

			await expect(telegramService.updateMovieFiles({ tmdb_id: 999 })).rejects.toThrow(NotFoundError)
			expect(bot.copyMessage).not.toHaveBeenCalled()
		})

		it.for<{
			language: string
			overrides: Partial<IMovie>
			params: IMovieToUpdateParams
			message: string
		}>([
			{
				language: 'castellano',
				overrides: { language_cas: true },
				params: { tmdb_id: 19995, telegram_file_id_cas: 111 },
				message: 'Movie already has castellano audio',
			},
			{
				language: 'latino',
				overrides: { language_cas: false, language_lat: true },
				params: { tmdb_id: 19995, telegram_file_id_lat: 222 },
				message: 'Movie already has latino audio',
			},
			{
				language: 'castellano and latino',
				overrides: { language_cas: true, language_lat: true },
				params: { tmdb_id: 19995, telegram_file_id_cas: 111, telegram_file_id_lat: 222 },
				message: 'Movie already has castellano and latino audio',
			},
		])('throws ConflictError when the movie already has $language audio', async ({ overrides, params, message }) => {
			vi.mocked(movieRepository.getMovies).mockResolvedValue([makeMovie(overrides)])

			await expect(telegramService.updateMovieFiles(params)).rejects.toThrow(message)
			expect(bot.copyMessage).not.toHaveBeenCalled()
		})
	})

	describe('markVideosAsProcessed', () => {
		it('marks every message id as processed', async () => {
			vi.mocked(videosRepository.markVideoAsProcessed).mockResolvedValue({ id: 1 })

			await telegramService.markVideosAsProcessed([1, 2])

			expect(videosRepository.markVideoAsProcessed).toHaveBeenNthCalledWith(1, 1)
			expect(videosRepository.markVideoAsProcessed).toHaveBeenNthCalledWith(2, 2)
		})

		it('throws NotFoundError when an incoming video is not found', async () => {
			vi.mocked(videosRepository.markVideoAsProcessed).mockResolvedValue(undefined)

			await expect(telegramService.markVideosAsProcessed([1])).rejects.toThrow('Incoming video not found')
		})
	})
})
