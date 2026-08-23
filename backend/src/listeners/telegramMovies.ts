import { cleanText } from '../helpers/cleanText.ts'
import { getLanguage } from '../helpers/getLanguage.ts'
import { toPascalCase } from '../helpers/toPascalCase.ts'
import { bot, MOVIE_LISTENER_GROUP_ID } from '../provider/telegram.ts'
import { movieRepository } from '../repositories/movie.ts'
import type { ITelegramMovieInput } from '../schemas/movie.ts'

bot.on('video', async (msg) => {
	if (msg.chat.id !== MOVIE_LISTENER_GROUP_ID) return
	if (!msg.video) return
	if (!msg.caption) return

	const language = await getLanguage(msg.caption!)
	if (!language) return

	const cleanedText = cleanText(msg.caption!)
	if (cleanedText === '') return

	const movie: ITelegramMovieInput = {
		file_id: msg.message_id,
		message_text: toPascalCase(cleanedText),
		language,
		is_saved: false,
	}

	await movieRepository.saveTelegramMovie(movie)
	console.log(movie)
})
