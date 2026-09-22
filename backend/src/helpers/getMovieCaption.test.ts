import { describe, expect, it } from 'vitest'
import { getMovieCaption, type IMovieCaptionInput } from './getMovieCaption.ts'

describe('getMovieCaption', () => {
	it.for<{ movie: IMovieCaptionInput; language: 'cas' | 'lat'; expected: string }>([
		{
			movie: { title_en: 'The Godfather', year: 1972 },
			language: 'cas',
			expected: 'The Godfather\n1972\nEspañol castellano 🇪🇸',
		},
		{
			movie: { title_en: 'The Godfather', year: 1972 },
			language: 'lat',
			expected: 'The Godfather\n1972\nEspañol latino 🇲🇽',
		},
		{
			movie: { title_en: 'The Godfather', title_cas: 'El Padrino', year: 1972 },
			language: 'cas',
			expected: 'The Godfather | El Padrino\n1972\nEspañol castellano 🇪🇸',
		},
		{
			movie: { title_en: 'The Godfather', title_cas: 'El Padrino', title_lat: 'The Godfather (Latino)', year: 1972 },
			language: 'lat',
			expected: 'The Godfather | El Padrino | The Godfather (Latino)\n1972\nEspañol latino 🇲🇽',
		},
		{
			movie: { title_en: 'The Godfather', title_lat: 'El Padrino', year: 1972 },
			language: 'cas',
			expected: 'The Godfather | El Padrino\n1972\nEspañol castellano 🇪🇸',
		},
	])('returns "$expected" for language $language', async ({ movie, language, expected }) => {
		expect(await getMovieCaption(movie, language)).toBe(expected)
	})
})