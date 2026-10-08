import type TelegramBot from 'node-telegram-bot-api'
import type { IIncomingEpisodeToSave } from '../entities/incomingEpisode.ts'
import { getLanguage } from '../helpers/getLanguage.ts'
import { getSeasonAndEpisode } from '../helpers/getSeasonAndEpisode.ts'

interface IncomingEpisodeListenerDeps {
	bot: { on: (event: 'video', callback: (msg: TelegramBot.Message) => void) => void }
	groupId: number
	saveIncomingEpisode: (data: IIncomingEpisodeToSave) => Promise<unknown>
}

export function createIncomingEpisodeListener({ bot, groupId, saveIncomingEpisode }: IncomingEpisodeListenerDeps) {
	bot.on('video', async (msg) => {
		if (msg.chat.id !== groupId) return
		if (!msg.video) return
		if (!msg.caption) return

		const seasonAndEpisode = getSeasonAndEpisode(msg.caption!)
		if (!seasonAndEpisode) return

		const language = (await getLanguage(msg.caption)) ?? null

		const episode: IIncomingEpisodeToSave = {
			message_id: msg.message_id,
			caption: msg.caption,
			episode_number: seasonAndEpisode.episode_number,
			season: seasonAndEpisode.season,
			language,
			is_processed: false,
		}

		await saveIncomingEpisode(episode)
		console.log(episode)
	})
}
