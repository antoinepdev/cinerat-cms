import { describe, expect, it, type Mock, vi } from 'vitest'
import { createIncomingVideoListener } from './incomingVideos.ts'

type VideoHandler = (msg: Record<string, unknown>) => Promise<void>

function makeDeps() {
	const bot = { on: vi.fn() }
	const saveIncomingVideo = vi.fn()
	createIncomingVideoListener({ bot, groupId: 123, saveIncomingVideo })
	const onVideo = bot.on as unknown as Mock<(event: string, callback: VideoHandler) => void>
	return { saveIncomingVideo, handler: onVideo.mock.calls[0]![1] }
}

function makeVideoMessage(overrides: Record<string, unknown> = {}): Record<string, unknown> {
	return {
		chat: { id: 123 },
		video: {},
		caption: 'Avatar latino 2026',
		message_id: 101,
		...overrides,
	}
}

describe('incomingVideos listener', () => {
	it.for<{ name: string; overrides: Record<string, unknown> }>([
		{ name: 'from other chats', overrides: { chat: { id: 456 } } },
		{ name: 'without a video', overrides: { video: undefined } },
		{ name: 'without a caption', overrides: { caption: undefined } },
		{ name: 'without a detected language', overrides: { caption: 'The Godfather 2022' } },
		{ name: 'with an empty cleaned text', overrides: { caption: '🇲🇽' } },
	])('ignores messages $name', async ({ overrides }) => {
		const { handler, saveIncomingVideo } = makeDeps()

		await handler(makeVideoMessage(overrides))

		expect(saveIncomingVideo).not.toHaveBeenCalled()
	})

	it('saves the incoming video and logs it', async () => {
		const { handler, saveIncomingVideo } = makeDeps()
		saveIncomingVideo.mockResolvedValue({})
		const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

		await handler(makeVideoMessage())

		expect(saveIncomingVideo).toHaveBeenCalledWith({
			telegram_message_id: 101,
			caption: 'Avatar 2026',
			language: 'latino',
			is_processed: false,
		})
		expect(logSpy).toHaveBeenCalledWith({
			telegram_message_id: 101,
			caption: 'Avatar 2026',
			language: 'latino',
			is_processed: false,
		})
	})
})
