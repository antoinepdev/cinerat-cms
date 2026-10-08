import { describe, expect, it } from 'vitest'
import { getSeasonAndEpisode, type ISeasonEpisode } from './getSeasonAndEpisode.ts'

describe('getSeasonAndEpisode', () => {
	it.for<{ caption: string; expected: ISeasonEpisode }>([
		{ caption: 'temp 1 cap 01', expected: { season: 1, episode_number: 1 } },
		{ caption: 'temp 01 cap 1', expected: { season: 1, episode_number: 1 } },
		{ caption: 'temporada 4 episodio 1', expected: { season: 4, episode_number: 1 } },
		{ caption: '2x05', expected: { season: 2, episode_number: 5 } },
		{ caption: 'temp 10 cap 12', expected: { season: 10, episode_number: 12 } },
		{ caption: '12x5', expected: { season: 12, episode_number: 5 } },
		{ caption: 'TEMP 1 CAP 01', expected: { season: 1, episode_number: 1 } },
		{ caption: 'Temporada 4 Episodio 1', expected: { season: 4, episode_number: 1 } },
		{ caption: '2X05', expected: { season: 2, episode_number: 5 } },
		{ caption: 'Breaking Bad temp 3 cap 05 1080p español', expected: { season: 3, episode_number: 5 } },
		{ caption: 'temp  1  cap  01', expected: { season: 1, episode_number: 1 } },
		{ caption: '  temp 1 cap 02  ', expected: { season: 1, episode_number: 2 } },
		{ caption: 'temp 1\ncap 02', expected: { season: 1, episode_number: 2 } },
	])('parses "$caption"', ({ caption, expected }) => {
		expect(getSeasonAndEpisode(caption)).toEqual(expected)
	})

	it.for<string>([
		'Pelicula normal',
		'1920x1080',
		'1080p x264',
		'temp 0 cap 01',
		'0x05',
		'temp1cap01',
		'temp 1, cap 01',
		'temp 1 cap 123',
	])('returns undefined for %s', (caption) => {
		expect(getSeasonAndEpisode(caption)).toBeUndefined()
	})
})
