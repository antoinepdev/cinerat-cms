import { describe, expect, it, type Mock, vi } from 'vitest'
import type { ISeriesBatch } from '../state/seriesBatch.ts'
import { createIncomingEpisodeListener } from './incomingEpisodes.ts'

type VideoHandler = (msg: Record<string, unknown>) => Promise<void>

const BATCH: ISeriesBatch = { batch_id: 555, batch_name: 'Breaking Bad' }

function makeDeps(batch: ISeriesBatch | undefined) {
	const bot = { on: vi.fn() }
	const saveIncomingEpisode = vi.fn()
	const sendMessage = vi.fn()
	const getBatch = vi.fn().mockReturnValue(batch)
	createIncomingEpisodeListener({ bot, groupId: 123, getBatch, saveIncomingEpisode, sendMessage })
	const onVideo = bot.on as unknown as Mock<(event: 'video', callback: VideoHandler) => void>
	return { saveIncomingEpisode, sendMessage, handler: onVideo.mock.calls[0]![1] }
}

function makeVideoMessage(overrides: Record<string, unknown> = {}): Record<string, unknown> {
	return {
		chat: { id: 123 },
		video: {},
		caption: 'Breaking Bad Temp 4 Cap 07 Castellano',
		message_id: 101,
		...overrides,
	}
}

describe('incomingEpisodes listener', () => {
	it.for<{ name: string; overrides: Record<string, unknown> }>([
		{ name: 'from other chats', overrides: { chat: { id: 456 } } },
		{ name: 'without a video', overrides: { video: undefined } },
	])('ignores messages $name', async ({ overrides }) => {
		const { handler, saveIncomingEpisode, sendMessage } = makeDeps(BATCH)

		await handler(makeVideoMessage(overrides))

		expect(saveIncomingEpisode).not.toHaveBeenCalled()
		expect(sendMessage).not.toHaveBeenCalled()
	})

	it('warns the operator to start a batch when no /series is active', async () => {
		const { handler, saveIncomingEpisode, sendMessage } = makeDeps(undefined)
		sendMessage.mockResolvedValue({})

		await handler(makeVideoMessage())

		expect(sendMessage).toHaveBeenCalledWith(123, 'Run /series <series name> first to start a batch.')
		expect(saveIncomingEpisode).not.toHaveBeenCalled()
	})

	it.for<{ name: string; overrides: Record<string, unknown> }>([
		{ name: 'without a caption', overrides: { caption: undefined } },
		{ name: 'without a season and episode pattern', overrides: { caption: 'Breaking Bad Castellano' } },
		{ name: 'with a zero season', overrides: { caption: 'Breaking Bad 0x07 Castellano' } },
	])('discards messages $name when a batch is active', async ({ overrides }) => {
		const { handler, saveIncomingEpisode, sendMessage } = makeDeps(BATCH)

		await handler(makeVideoMessage(overrides))

		expect(saveIncomingEpisode).not.toHaveBeenCalled()
		expect(sendMessage).not.toHaveBeenCalled()
	})

	it('saves the episode with the parsed season, episode, language and the active batch', async () => {
		const { handler, saveIncomingEpisode } = makeDeps(BATCH)
		saveIncomingEpisode.mockResolvedValue({})
		const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

		await handler(makeVideoMessage())

		expect(saveIncomingEpisode).toHaveBeenCalledWith({
			message_id: 101,
			caption: 'Breaking Bad Temp 4 Cap 07 Castellano',
			episode_number: 7,
			season: 4,
			language: 'castellano',
			batch_id: 555,
			batch_name: 'Breaking Bad',
			is_processed: false,
		})
		expect(logSpy).toHaveBeenCalledWith({
			message_id: 101,
			caption: 'Breaking Bad Temp 4 Cap 07 Castellano',
			episode_number: 7,
			season: 4,
			language: 'castellano',
			batch_id: 555,
			batch_name: 'Breaking Bad',
			is_processed: false,
		})
	})

	it('saves a null language when the caption carries no detectable one', async () => {
		const { handler, saveIncomingEpisode } = makeDeps(BATCH)
		saveIncomingEpisode.mockResolvedValue({})
		vi.spyOn(console, 'log').mockImplementation(() => {})

		await handler(makeVideoMessage({ caption: 'Breaking Bad 4x07' }))

		expect(saveIncomingEpisode).toHaveBeenCalledWith({
			message_id: 101,
			caption: 'Breaking Bad 4x07',
			episode_number: 7,
			season: 4,
			language: null,
			batch_id: 555,
			batch_name: 'Breaking Bad',
			is_processed: false,
		})
	})
})
