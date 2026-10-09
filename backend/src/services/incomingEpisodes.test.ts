import { describe, expect, it, vi } from 'vitest'
import type { IIncomingEpisode } from '../entities/incomingEpisode.ts'
import { incomingEpisodesRepository } from '../repositories/incomingEpisode.ts'
import { incomingEpisodesService } from './incomingEpisodes.ts'

vi.mock('../repositories/incomingEpisode.ts', () => ({
	incomingEpisodesRepository: {
		getIncomingEpisodes: vi.fn(),
	},
}))

const CREATED_AT = new Date('2026-01-15T10:00:00.000Z')
const UPDATED_AT = new Date('2026-02-20T18:30:00.000Z')

function makeIncomingEpisode(overrides: Partial<IIncomingEpisode> = {}): IIncomingEpisode {
	return {
		id: 1,
		message_id: 4242,
		caption: 'Breaking Bad s04e07',
		episode_number: 7,
		season: 4,
		language: 'castellano',
		batch_id: 555,
		batch_name: 'Breaking Bad',
		is_processed: false,
		created_at: CREATED_AT,
		updated_at: UPDATED_AT,
		...overrides,
	}
}

describe('incomingEpisodesService.getIncomingEpisodes', () => {
	it('forwards the filters to the repository', async () => {
		vi.mocked(incomingEpisodesRepository.getIncomingEpisodes).mockResolvedValue([])

		await incomingEpisodesService.getIncomingEpisodes({ is_processed: false, season: 4 })

		expect(incomingEpisodesRepository.getIncomingEpisodes).toHaveBeenCalledWith({ is_processed: false, season: 4 })
	})

	it('returns the episodes returned by the repository', async () => {
		const episodes = [makeIncomingEpisode()]
		vi.mocked(incomingEpisodesRepository.getIncomingEpisodes).mockResolvedValue(episodes)

		const result = await incomingEpisodesService.getIncomingEpisodes({})

		expect(result).toEqual(episodes)
	})
})
