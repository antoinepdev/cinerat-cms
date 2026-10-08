import type TelegramBot from 'node-telegram-bot-api'
import type { IIncomingEpisodeToSave } from '../entities/incomingEpisode.ts'
import { getLanguage } from '../helpers/getLanguage.ts'
import { getSeasonAndEpisode } from '../helpers/getSeasonAndEpisode.ts'
import type { ISeriesBatch } from '../state/seriesBatch.ts'

interface IncomingEpisodeListenerDeps {
	bot: { on: (event: 'video', callback: (msg: TelegramBot.Message) => void) => void }
	groupId: number
	getBatch: (chatId: number) => ISeriesBatch | undefined
	saveIncomingEpisode: (data: IIncomingEpisodeToSave) => Promise<unknown>
	sendMessage: (chatId: number, text: string) => Promise<unknown>
}

const MISSING_BATCH_MESSAGE = 'Run /series <series name> first to start a batch.'

export function createIncomingEpisodeListener({
	bot,
	groupId,
	getBatch,
	saveIncomingEpisode,
	sendMessage,
}: IncomingEpisodeListenerDeps) {
	bot.on('video', async (msg) => {
		if (msg.chat.id !== groupId) return
		if (!msg.video) return

		const batch = getBatch(msg.chat.id)
		if (!batch) {
			await sendMessage(msg.chat.id, MISSING_BATCH_MESSAGE)
			return
		}

		if (!msg.caption) return

		const seasonAndEpisode = getSeasonAndEpisode(msg.caption!)
		if (!seasonAndEpisode) return

		const language = (await getLanguage(msg.caption!)) ?? null

		const episode: IIncomingEpisodeToSave = {
			message_id: msg.message_id,
			caption: msg.caption!,
			episode_number: seasonAndEpisode.episode_number,
			season: seasonAndEpisode.season,
			language,
			batch_id: batch.batch_id,
			batch_name: batch.batch_name,
			is_processed: false,
		}

		await saveIncomingEpisode(episode)
		console.log(episode)
	})
}
