import { pool } from '../database.ts'
import type { TelegramMovie } from '../models/movie.ts'
import { bot, groupTestingId } from './config.ts'
import { cleanText } from './helpers/cleanText.ts'
import { toPascalCase } from './helpers/toPascalCase.ts'

bot.on('video', async (msg) => {
	if (msg.chat.id !== groupTestingId) return
	if (!msg.video) return
	if (!msg.caption) return

	function guessLanguage(text: string): 'latino' | 'castellano' | undefined {
		const hasMxFlag = text.includes('🇲🇽')
		const hasLatinoWord = text.toLowerCase().includes('latino')
		if (hasLatinoWord || hasMxFlag) return 'latino'
		const hasEsFlag = text.includes('🇪🇸')
		const hasCastellanoWord = text.toLowerCase().includes('castellano')
		if (hasCastellanoWord || hasEsFlag) return 'castellano'
		return undefined
	}

	const language = guessLanguage(msg.caption)
	if (!language) return await bot.deleteMessage(groupTestingId, msg.message_id)
	const cleanedText = cleanText(msg.caption)
	if (cleanedText === '') return await bot.deleteMessage(groupTestingId, msg.message_id)

	const movie: TelegramMovie = {
		fileId: msg.message_id,
		messageText: toPascalCase(cleanedText),
		language,
		is_saved: false,
	}

	console.log(movie)
	try {
		await pool.query('INSERT INTO telegram_movies (file_id, message_text, language, is_saved) VALUES ($1, $2, $3, $4)', [
			movie.fileId,
			movie.messageText,
			movie.language,
			movie.is_saved,
		])
	} catch (error) {
		console.error(`Ha ocurrido un error al insertar la telegram movie: ${error}`)
	}
})
