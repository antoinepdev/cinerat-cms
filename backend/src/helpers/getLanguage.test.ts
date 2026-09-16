import { describe, expect, it } from 'vitest'
import { getLanguage } from './getLanguage.ts'

describe('getLanguage', () => {
	it.for<{ word: string; expected: string }>([
		{ word: 'latino', expected: 'latino' },
		{ word: 'lat', expected: 'latino' },
		{ word: '🇲🇽', expected: 'latino' },
		{ word: 'castellano', expected: 'castellano' },
		{ word: 'cas', expected: 'castellano' },
		{ word: '🇪🇸', expected: 'castellano' },
	])('returns $expected when text contains the word $word', async ({ word, expected }) => {
		const result = await getLanguage(`Juan de los muertos ${word}`)
		expect(result).toBe(expected)
	})

	it.for<{ word: string; expected: string }>([
		{ word: 'LATino', expected: 'latino' },
		{ word: 'LAT', expected: 'latino' },
		{ word: 'CaSTELLANO', expected: 'castellano' },
		{ word: 'Cas', expected: 'castellano' },
	])('matches $expected case-insensitively', async ({ word, expected }) => {
		expect(await getLanguage(`Juan de los muertos ${word}`)).toBe(expected)
	})

	it.for<{ word: string; expected: string }>([
		{ word: 'lat!', expected: 'latino' },
		{ word: '(lat)', expected: 'latino' },
		{ word: 'castellano:', expected: 'castellano' },
	])('returns $expected when "$word" has surrounding punctuation', async ({ word, expected }) => {
		expect(await getLanguage(`Juan de los muertos ${word}`)).toBe(expected)
	})

	it.for<{ word: string; expected: string }>([
		{ word: 'lat-1080p', expected: 'latino' },
		{ word: '720p-cas', expected: 'castellano' },
		{ word: 'Cas-720p', expected: 'castellano' },
	])('returns $expected when "$word" contains hyphens', async ({ word, expected }) => {
		expect(await getLanguage(`Juan de los muertos ${word}`)).toBe(expected)
	})

	it('returns undefined when no language is detected', async () => {
		expect(await getLanguage('Pelicula normal')).toBeUndefined()
	})

	it.for<{ word: string; expected: string }>([
		{ word: 'plato', expected: 'lat' },
		{ word: 'casa', expected: 'cas' },
	])('returns undefined when "$expected" appears inside another word', async ({ word }) => {
		expect(await getLanguage(word)).toBeUndefined()
	})

	it.for<{ word: string; expected: string }>([
		{ word: 'lát', expected: 'lat' },
		{ word: 'Cás', expected: 'cas' },
	])('returns undefined when "$expected" has accented characters like $word', async ({ word }) => {
		expect(await getLanguage(word)).toBeUndefined()
	})

	it('prefers latino when both languages are present', async () => {
		expect(await getLanguage('latino castellano')).toBe('latino')
	})
})
