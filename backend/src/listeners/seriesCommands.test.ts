import { describe, expect, it, type Mock, vi } from 'vitest'
import { createSeriesBatchStore } from '../state/seriesBatch.ts'
import { createSeriesCommandsListener } from './seriesCommands.ts'

type CommandHandler = (msg: Record<string, unknown>, match: RegExpExecArray | null) => Promise<void>

function makeDeps() {
	const bot = { onText: vi.fn(), sendMessage: vi.fn() }
	const batchStore = createSeriesBatchStore()
	createSeriesCommandsListener({ bot, groupId: 123, batchStore })
	const onText = bot.onText as unknown as Mock<(regexp: RegExp, callback: CommandHandler) => void>
	const sendMessage = bot.sendMessage as unknown as Mock<(chatId: number, text: string) => Promise<unknown>>

	async function send(text: string, overrides: Record<string, unknown> = {}) {
		const msg = { chat: { id: 123 }, message_id: 777, text, ...overrides }
		for (const [regexp, callback] of onText.mock.calls) {
			const match = regexp.exec(text)
			if (match) {
				await callback(msg, match)
				return
			}
		}
	}

	return { batchStore, onText, sendMessage, send }
}

describe('seriesCommands listener', () => {
	it('starts a batch named after the command argument using the command message id', async () => {
		const { batchStore, sendMessage, send } = makeDeps()

		await send('/series Breaking Bad')

		expect(batchStore.get(123)).toEqual({ batch_id: 777, batch_name: 'Breaking Bad' })
		expect(sendMessage).toHaveBeenCalledWith(123, 'Batch "Breaking Bad" started.')
	})

	it('keeps the full name when it contains spaces', async () => {
		const { batchStore, send } = makeDeps()

		await send('/series  The Office US ')

		expect(batchStore.get(123)?.batch_name).toBe('The Office US')
	})

	it('accepts the command addressed to the bot', async () => {
		const { batchStore, send } = makeDeps()

		await send('/series@cinerat_bot Breaking Bad')

		expect(batchStore.get(123)?.batch_name).toBe('Breaking Bad')
	})

	it('replies the usage when the series name is missing', async () => {
		const { batchStore, sendMessage, send } = makeDeps()

		await send('/series')

		expect(batchStore.get(123)).toBeUndefined()
		expect(sendMessage).toHaveBeenCalledWith(123, 'Usage: /series <series name>')
	})

	it('warns and keeps the active batch when a new /series is sent', async () => {
		const { batchStore, sendMessage, send } = makeDeps()
		await send('/series Breaking Bad')

		await send('/series The Wire')

		expect(batchStore.get(123)).toEqual({ batch_id: 777, batch_name: 'Breaking Bad' })
		expect(sendMessage).toHaveBeenLastCalledWith(123, 'There is already an active batch ("Breaking Bad"). Run /exit to close it.')
	})

	it('ends the active batch with /exit', async () => {
		const { batchStore, sendMessage, send } = makeDeps()
		await send('/series Breaking Bad')

		await send('/exit')

		expect(batchStore.get(123)).toBeUndefined()
		expect(sendMessage).toHaveBeenLastCalledWith(123, 'Batch "Breaking Bad" closed.')
	})

	it('replies that there is no batch when /exit is sent without one', async () => {
		const { batchStore, sendMessage, send } = makeDeps()

		await send('/exit')

		expect(batchStore.get(123)).toBeUndefined()
		expect(sendMessage).toHaveBeenCalledWith(123, 'There is no active batch.')
	})

	it.for(['/series Breaking Bad', '/exit'])('ignores %s from other chats', async (text) => {
		const { batchStore, sendMessage, send } = makeDeps()

		await send(text, { chat: { id: 456 } })

		expect(batchStore.get(456)).toBeUndefined()
		expect(sendMessage).not.toHaveBeenCalled()
	})
})
