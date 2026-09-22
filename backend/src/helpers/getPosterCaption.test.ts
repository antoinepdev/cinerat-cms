import { describe, expect, it } from 'vitest'
import { getPosterCaption, type IMoviePosterCaption } from './getPosterCaption.ts'

const CAPTION_LIMIT = 1024
const BASE_CAPTION = 'Avatar\n2009\n\n'

describe('getPosterCaption', () => {
	it.for<{ movie: IMoviePosterCaption; expected: string }>([
		{
			movie: { title_en: 'Avatar', year: 2009, description: 'A description' },
			expected: 'Avatar\n2009\n\nA description',
		},
		{
			movie: { title_en: 'Avatar', title_cas: 'Avatar (Castellano)', year: 2009, description: 'A description' },
			expected: 'Avatar | Avatar (Castellano)\n2009\n\nA description',
		},
	])('returns the full caption without truncation', async ({ movie, expected }) => {
		expect(await getPosterCaption(movie)).toBe(expected)
	})

	it('truncates with "..." when the caption exceeds 1024 characters', async () => {
		const movie: IMoviePosterCaption = {
			title_en: 'Avatar',
			year: 2009,
			description: 'a'.repeat(CAPTION_LIMIT - BASE_CAPTION.length + 1), // BASE(13) + 1012 = 1025 > 1024
		}
		const caption = await getPosterCaption(movie)

		expect(caption).toHaveLength(CAPTION_LIMIT)
		expect(caption.endsWith('...')).toBe(true)
		expect(caption).toBe(`${BASE_CAPTION}${movie.description.slice(0, CAPTION_LIMIT - 3 - BASE_CAPTION.length)}...`)
	})

	it('does not truncate when the caption is exactly 1024 characters', async () => {
		const movie: IMoviePosterCaption = {
			title_en: 'Avatar',
			year: 2009,
			description: 'a'.repeat(CAPTION_LIMIT - BASE_CAPTION.length), // BASE(13) + 1011 = 1024, la condición es >, no >=
		}
		const caption = await getPosterCaption(movie)

		expect(caption).toHaveLength(CAPTION_LIMIT)
		expect(caption.endsWith('...')).toBe(false)
		expect(caption).toBe(`${BASE_CAPTION}${movie.description}`)
	})
})