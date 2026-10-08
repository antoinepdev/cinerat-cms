import type TelegramBot from 'node-telegram-bot-api'
import { describe, expect, it, vi } from 'vitest'
import type { IMovie } from '../entities/movie.ts'
import { sleep } from '../helpers/sleep.ts'
import {
	bot,
	MOVIE_CONTAINER_GROUP_ID,
	MOVIE_LISTENER_GROUP_ID,
	SERIES_CONTAINER_GROUP_ID,
	SERIES_LISTENER_GROUP_ID,
	SERIES_SEND_DELAY_MS,
	SERIES_SEND_MAX_ATTEMPTS,
} from '../provider/telegram.ts'
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
	SERIES_CONTAINER_GROUP_ID: 103,
	SERIES_LISTENER_GROUP_ID: 104,
	SERIES_SEND_DELAY_MS: 1000,
	SERIES_SEND_MAX_ATTEMPTS: 3,
}))

vi.mock('../helpers/sleep.ts', () => ({
	sleep: vi.fn(),
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

function makeFloodWaitError(retryAfter: number): Error {
	return Object.assign(new Error(`429 Too Many Requests: retry after ${retryAfter}`), {
		code: 'ETELEGRAM',
		response: {
			body: {
				error_code: 429,
				description: `Too Many Requests: retry after ${retryAfter}`,
				parameters: { retry_after: retryAfter },
			},
		},
	})
}

function makeBadRequestError(): Error {
	return Object.assign(new Error('400 Bad Request: chat not found'), {
		code: 'ETELEGRAM',
		response: { body: { error_code: 400, description: 'Bad Request: chat not found' } },
	})
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

	describe('sendEpisode', () => {
		it('copies the episode to the series container group without a caption, then waits the configured delay', async () => {
			vi.mocked(bot.copyMessage).mockResolvedValue({ message_id: 900 })

			const result = await telegramService.sendEpisode(777)

			expect(bot.copyMessage).toHaveBeenCalledTimes(1)
			expect(bot.copyMessage).toHaveBeenCalledWith(SERIES_CONTAINER_GROUP_ID, SERIES_LISTENER_GROUP_ID, 777)
			expect(sleep).toHaveBeenCalledTimes(1)
			expect(sleep).toHaveBeenCalledWith(SERIES_SEND_DELAY_MS)
			expect(result).toBe(900)
		})

		it('retries when Telegram answers 429 and honours retry_after', async () => {
			const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {})
			vi.mocked(bot.copyMessage).mockRejectedValueOnce(makeFloodWaitError(5)).mockResolvedValueOnce({ message_id: 901 })

			const result = await telegramService.sendEpisode(777)

			expect(result).toBe(901)
			expect(bot.copyMessage).toHaveBeenCalledTimes(2)
			expect(sleep).toHaveBeenNthCalledWith(1, 5000)
			expect(sleep).toHaveBeenNthCalledWith(2, SERIES_SEND_DELAY_MS)
			expect(consoleLog).toHaveBeenCalledTimes(1)
			expect(consoleLog).toHaveBeenCalledWith(expect.stringContaining('SERIES_SEND_DELAY_MS=1000'))
			consoleLog.mockRestore()
		})

		it(`gives up after ${SERIES_SEND_MAX_ATTEMPTS} attempts when Telegram keeps answering 429`, async () => {
			const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {})
			vi.mocked(bot.copyMessage).mockRejectedValue(makeFloodWaitError(5))

			await expect(telegramService.sendEpisode(777)).rejects.toThrow('429 Too Many Requests')

			expect(bot.copyMessage).toHaveBeenCalledTimes(SERIES_SEND_MAX_ATTEMPTS)
			expect(sleep).toHaveBeenCalledTimes(SERIES_SEND_MAX_ATTEMPTS - 1)
			expect(sleep).toHaveBeenCalledWith(5000)
			expect(consoleLog).toHaveBeenCalledTimes(SERIES_SEND_MAX_ATTEMPTS)
			consoleLog.mockRestore()
		})

		it('does not retry non-429 telegram errors', async () => {
			vi.mocked(bot.copyMessage).mockRejectedValue(makeBadRequestError())

			await expect(telegramService.sendEpisode(777)).rejects.toThrow('400 Bad Request')

			expect(bot.copyMessage).toHaveBeenCalledTimes(1)
			expect(sleep).not.toHaveBeenCalled()
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
