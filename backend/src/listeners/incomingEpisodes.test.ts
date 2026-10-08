import { describe, expect, it, type Mock, vi } from 'vitest'
import { createIncomingEpisodeListener } from './incomingEpisodes.ts'

function makeDeps() {
	const bot = { on: vi.fn() }
	const saveIncomingEpisode = vi.fn()
	createIncomingEpisodeListener({ bot, groupId: 123, saveIncomingEpisode })
	const onVideo = bot.on as unknown as Mock<(event: 'video', callback: (msg: unknown) => void) => void>
	return { saveIncomingEpisode, handler: onVideo.mock.calls[0]![1] }
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
		{ name: 'without a caption', overrides: { caption: undefined } },
		{ name: 'without a season and episode pattern', overrides: { caption: 'Breaking Bad Castellano' } },
		{ name: 'with a zero season', overrides: { caption: 'Breaking Bad 0x07 Castellano' } },
	])('ignores messages $name', async ({ overrides }) => {
		const { handler, saveIncomingEpisode } = makeDeps()

		await handler(makeVideoMessage(overrides))

		expect(saveIncomingEpisode).not.toHaveBeenCalled()
	})

	it('saves the incoming episode with the parsed season, episode and language', async () => {
		const { handler, saveIncomingEpisode } = makeDeps()
		saveIncomingEpisode.mockResolvedValue({})
		const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

		await handler(makeVideoMessage())

		expect(saveIncomingEpisode).toHaveBeenCalledWith({
			message_id: 101,
			caption: 'Breaking Bad Temp 4 Cap 07 Castellano',
			episode_number: 7,
			season: 4,
			language: 'castellano',
			is_processed: false,
		})
		expect(logSpy).toHaveBeenCalledWith({
			message_id: 101,
			caption: 'Breaking Bad Temp 4 Cap 07 Castellano',
			episode_number: 7,
			season: 4,
			language: 'castellano',
			is_processed: false,
		})
	})

	it('saves a null language when the caption carries no detectable one', async () => {
		const { handler, saveIncomingEpisode } = makeDeps()
		saveIncomingEpisode.mockResolvedValue({})
		vi.spyOn(console, 'log').mockImplementation(() => {})

		await handler(makeVideoMessage({ caption: 'Breaking Bad 4x07' }))

		expect(saveIncomingEpisode).toHaveBeenCalledWith({
			message_id: 101,
			caption: 'Breaking Bad 4x07',
			episode_number: 7,
			season: 4,
			language: null,
			is_processed: false,
		})
	})
})
