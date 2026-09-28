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
		{ word: '𝐂𝐚𝐬𝐭𝐞𝐥𝐥𝐚𝐧𝐨', expected: 'castellano' },
		{ word: '𝐥𝐚𝐭𝐢𝐧𝐨', expected: 'latino' },
		{ word: '𝕔𝕒𝕤', expected: 'castellano' },
		{ word: '🇪🇦', expected: 'castellano' },
		{ word: '🇲🇪', expected: 'latino' },
	])('returns $expected when text contains the stylized or regional variant $word', async ({ word, expected }) => {
		const result = await getLanguage(`Juan de los muertos ${word}`)
		expect(result).toBe(expected)
	})

	it('returns castellano for a real caption with math-bold text and the 🇪🇦 flag', async () => {
		const caption = '⭐️Bohemian Rhapsody: La Historia de Freddie Mercury / Bohemian Rhapsody (2018)\n📀 𝐈𝐝𝐢𝐨𝐦𝐚: 𝐂𝐚𝐬𝐭𝐞𝐥𝐥𝐚𝐧𝐨 🇪🇦 彡'
		expect(await getLanguage(caption)).toBe('castellano')
	})

	it('returns latino for a real caption with math-bold text and the 🇲🇪 flag', async () => {
		const caption = '📀 𝐈𝐝𝐢𝐨𝐦𝐚: 𝐥𝐚𝐭𝐢𝐧𝐨 🇲🇪'
		expect(await getLanguage(caption)).toBe('latino')
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
