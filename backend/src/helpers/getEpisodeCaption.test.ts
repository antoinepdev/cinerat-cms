import { describe, expect, it } from 'vitest'
import { getEpisodeCaption, type IEpisodeCaptionInput } from './getEpisodeCaption.ts'

describe('getEpisodeCaption', () => {
	it.for<{ episode: IEpisodeCaptionInput; language: 'cas' | 'lat'; expected: string }>([
		{
			episode: { season: 1, episode_number: 2 },
			language: 'cas',
			expected: '1x02\nEspañol castellano 🇪🇸',
		},
		{
			episode: { season: 1, episode_number: 2 },
			language: 'lat',
			expected: '1x02\nEspañol latino 🇲🇽',
		},
		{
			episode: { season: 10, episode_number: 12 },
			language: 'cas',
			expected: '10x12\nEspañol castellano 🇪🇸',
		},
		{
			episode: { season: 2, episode_number: 100 },
			language: 'lat',
			expected: '2x100\nEspañol latino 🇲🇽',
		},
	])('returns "$expected" for language $language', async ({ episode, language, expected }) => {
		expect(await getEpisodeCaption(episode, language)).toBe(expected)
	})
})
