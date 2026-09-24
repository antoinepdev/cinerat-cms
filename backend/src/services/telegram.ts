import type { IMovieToSave } from '../entities/movie.ts'
import { getMovieCaption } from '../helpers/getMovieCaption.ts'
import { getPosterCaption } from '../helpers/getPosterCaption.ts'
import { bot, MOVIE_CONTAINER_GROUP_ID, MOVIE_LISTENER_GROUP_ID } from '../provider/telegram.ts'
import { movieRepository } from '../repositories/movie.ts'
import { videosRepository } from '../repositories/videos.ts'
import type { IMovieInput, IMovieToUpdateParams } from '../schemas/movie.ts'
import { ConflictError, NotFoundError } from '../utils/errors.ts'

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
	const sendedPoster = await bot.sendPhoto(MOVIE_CONTAINER_GROUP_ID, posterUrl, { caption: posterCaption })
	return sendedPoster.message_id
}

async function sendMovie(fileId: number, movieCaption: string): Promise<number> {
	const sendedMovie = await bot.copyMessage(MOVIE_CONTAINER_GROUP_ID, MOVIE_LISTENER_GROUP_ID, fileId, {
		caption: movieCaption,
	})
	return sendedMovie.message_id
}

async function updateMovieFiles(data: IMovieToUpdateParams): Promise<IMovieToUpdateParams> {
	const [existingMovie] = await movieRepository.getMovies({ tmdb_id: data.tmdb_id })
	if (!existingMovie) throw new NotFoundError()

	const alreadyHasCas = Boolean(data.telegram_file_id_cas && existingMovie.language_cas)
	const alreadyHasLat = Boolean(data.telegram_file_id_lat && existingMovie.language_lat)

	if (alreadyHasCas && alreadyHasLat) throw new ConflictError('Movie already has castellano and latino audio')
	if (alreadyHasCas) throw new ConflictError('Movie already has castellano audio')
	if (alreadyHasLat) throw new ConflictError('Movie already has latino audio')

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

async function markVideosAsProcessed(messageIds: number[]) {
	for (const messageId of messageIds) {
		if (messageId) {
			const updatedVideo = await videosRepository.markVideoAsProcessed(messageId)
			if (!updatedVideo) throw new NotFoundError('Incoming video not found')
		}
	}
}

const telegramService = {
	saveMovie,
	updateMovieFiles,
	markVideosAsProcessed,
}

export { telegramService }
