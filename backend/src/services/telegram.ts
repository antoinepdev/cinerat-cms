import type { IMovieToSave } from '../entities/movie.ts'
import { getMovieCaption } from '../helpers/getMovieCaption.ts'
import { getPosterCaption } from '../helpers/getPosterCaption.ts'
import { bot, MOVIE_CONTAINER_GROUP_ID, MOVIE_LISTENER_GROUP_ID } from '../provider/telegram.ts'
import { movieRepository } from '../repositories/movie.ts'
import type { IMovieInput } from '../schemas/movie.ts'

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
	const telegramPosterId = sendedPoster.message_id
	return telegramPosterId
}

async function sendMovie(fileId: number, movieCaption: string): Promise<number> {
	const sendedMovie = await bot.copyMessage(MOVIE_CONTAINER_GROUP_ID, MOVIE_LISTENER_GROUP_ID, fileId, { caption: movieCaption })
	return sendedMovie.message_id
}

async function setTelegramMovieAsSaved(telegram_file_ids: number[]) {
	for (const fi of telegram_file_ids) {
		if (fi) {
			const updatedTelegramMovie = await movieRepository.updateTelegramMovie(fi)
			if (!updatedTelegramMovie) throw new Error(`Failed telegram movie is_saved property update.File id ${fi} not found`)
		}
	}
}

const telegramService = {
	saveMovie,
	setTelegramMovieAsSaved,
}

export { telegramService }
