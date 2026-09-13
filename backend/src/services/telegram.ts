import type { IMovieToSave } from '../entities/movie.ts'
import { getMovieCaption } from '../helpers/getMovieCaption.ts'
import { getPosterCaption } from '../helpers/getPosterCaption.ts'
import { isTelegramApiError } from '../helpers/isTelegramApiError.ts'
import { bot, MOVIE_CONTAINER_GROUP_ID, MOVIE_LISTENER_GROUP_ID } from '../provider/telegram.ts'
import { movieRepository } from '../repositories/movie.ts'
import type { IMovieInput, IMovieToUpdateParams } from '../schemas/movie.ts'
import { InvalidPosterUrlError, InvalidTelegramFileIdError, NotFoundError } from '../utils/errors.ts'

async function saveMovie(data: IMovieInput): Promise<IMovieToSave> {
	const posterCaption = await getPosterCaption(data)
	const telegram_poster_id = await sendPoster(data.poster, posterCaption)

	if (data.telegram_file_id_cas) {
		const movieCaption = await getMovieCaption(data, 'cas')
		data.telegram_file_id_cas = await sendMovie(data.telegram_file_id_cas, movieCaption)
	}
	if (data.telegram_file_id_lat) {
		const movieCaption = await getMovieCaption(data, 'lat')
		data.telegram_file_id_lat = await sendMovie(data.telegram_file_id_lat, movieCaption)
	}

	const movieToSaveInDb: IMovieToSave = { ...data, telegram_poster_id }
	return movieToSaveInDb
}

async function sendPoster(posterUrl: string, posterCaption: string): Promise<number> {
	try {
		const sendedPoster = await bot.sendPhoto(MOVIE_CONTAINER_GROUP_ID, posterUrl, { caption: posterCaption })
		const telegramPosterId = sendedPoster.message_id
		return telegramPosterId
	} catch (error) {
		if (
			isTelegramApiError(error) &&
			error.response.body.error_code === 400 &&
			(error.response.body.description?.includes('wrong type of the web page content') ||
				error.response.body.description?.includes('failed to get HTTP URL content'))
		)
			throw new InvalidPosterUrlError(posterUrl)
		throw error
	}
}

async function sendMovie(fileId: number, movieCaption: string): Promise<number> {
	try {
		const sendedMovie = await bot.copyMessage(MOVIE_CONTAINER_GROUP_ID, MOVIE_LISTENER_GROUP_ID, fileId, {
			caption: movieCaption,
		})
		return sendedMovie.message_id
	} catch (error) {
		if (
			isTelegramApiError(error) &&
			error.response.body.error_code === 400 &&
			error.response.body.description?.includes('message to copy not found')
		)
			throw new InvalidTelegramFileIdError(fileId)
		throw error
	}
}

async function updateMovieFiles(data: IMovieToUpdateParams): Promise<IMovieToUpdateParams> {
	const [existingMovie] = await movieRepository.getMovies({ tmdb_id: data.tmdb_id })
	if (!existingMovie) throw new NotFoundError()

	if (data.telegram_file_id_cas) {
		const movieCaption = await getMovieCaption(existingMovie, 'cas')
		data.telegram_file_id_cas = await sendMovie(data.telegram_file_id_cas, movieCaption)
	}
	if (data.telegram_file_id_lat) {
		const movieCaption = await getMovieCaption(existingMovie, 'lat')
		data.telegram_file_id_lat = await sendMovie(data.telegram_file_id_lat, movieCaption)
	}

	return data
}

async function setTelegramMovieAsSaved(telegram_file_ids: number[]) {
	for (const fi of telegram_file_ids) {
		if (fi) {
			const updatedTelegramMovie = await movieRepository.updateTelegramMovie(fi)
			if (!updatedTelegramMovie) throw new NotFoundError('Telegram movie not found')
		}
	}
}

const telegramService = {
	saveMovie,
	updateMovieFiles,
	setTelegramMovieAsSaved,
}

export { telegramService }
