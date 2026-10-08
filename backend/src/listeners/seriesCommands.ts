import type TelegramBot from 'node-telegram-bot-api'
import type { SeriesBatchStore } from '../state/seriesBatch.ts'

interface SeriesCommandsListenerDeps {
	bot: {
		onText: (regexp: RegExp, callback: (msg: TelegramBot.Message, match: RegExpExecArray | null) => void) => void
		sendMessage: (chatId: number, text: string) => Promise<unknown>
	}
	groupId: number
	batchStore: SeriesBatchStore
}

const START_COMMAND = /^\/series(?:@\w+)?(?:\s+(.+))?$/i
const EXIT_COMMAND = /^\/exit(?:@\w+)?$/i

const MISSING_NAME_MESSAGE = 'Usage: /series <series name>'
const NO_ACTIVE_BATCH_MESSAGE = 'There is no active batch.'
const ALREADY_ACTIVE_MESSAGE = (batchName: string) => `There is already an active batch ("${batchName}"). Run /exit to close it.`
const STARTED_MESSAGE = (batchName: string) => `Batch "${batchName}" started.`
const ENDED_MESSAGE = (batchName: string) => `Batch "${batchName}" closed.`

export function createSeriesCommandsListener({ bot, groupId, batchStore }: SeriesCommandsListenerDeps) {
	bot.onText(START_COMMAND, async (msg, match) => {
		if (msg.chat.id !== groupId) return

		const batchName = match?.[1]?.trim()
		if (!batchName) {
			await bot.sendMessage(msg.chat.id, MISSING_NAME_MESSAGE)
			return
		}

		const activeBatch = batchStore.get(msg.chat.id)
		if (activeBatch) {
			await bot.sendMessage(msg.chat.id, ALREADY_ACTIVE_MESSAGE(activeBatch.batch_name))
			return
		}

		const batch = batchStore.start(msg.chat.id, { batch_id: msg.message_id, batch_name: batchName })
		if (!batch) return

		await bot.sendMessage(msg.chat.id, STARTED_MESSAGE(batch.batch_name))
	})

	bot.onText(EXIT_COMMAND, async (msg) => {
		if (msg.chat.id !== groupId) return

		const endedBatch = batchStore.end(msg.chat.id)
		if (!endedBatch) {
			await bot.sendMessage(msg.chat.id, NO_ACTIVE_BATCH_MESSAGE)
			return
		}

		await bot.sendMessage(msg.chat.id, ENDED_MESSAGE(endedBatch.batch_name))
	})
}
