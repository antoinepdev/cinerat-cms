import type TelegramBot from 'node-telegram-bot-api'
import { cleanText } from '../helpers/cleanText.ts'
import { getLanguage } from '../helpers/getLanguage.ts'
import { toPascalCase } from '../helpers/toPascalCase.ts'
import type { IIncomingVideoInput } from '../schemas/movie.ts'

interface IncomingVideoListenerDeps {
	bot: { on: (event: 'video', callback: (msg: TelegramBot.Message) => void) => void }
	groupId: number
	saveIncomingVideo: (data: IIncomingVideoInput) => Promise<unknown>
}

export function createIncomingVideoListener({ bot, groupId, saveIncomingVideo }: IncomingVideoListenerDeps) {
	bot.on('video', async (msg) => {
		if (msg.chat.id !== groupId) return
		if (!msg.video) return
		if (!msg.caption) return

		const language = await getLanguage(msg.caption!)
		if (!language) return

		const cleanedText = cleanText(msg.caption!)
		if (cleanedText === '') return

		const video: IIncomingVideoInput = {
			telegram_message_id: msg.message_id,
			caption: toPascalCase(cleanedText),
			language,
			is_processed: false,
		}

		await saveIncomingVideo(video)
		console.log(video)
	})
}
