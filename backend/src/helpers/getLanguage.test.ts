import { describe, expect, it } from 'vitest'
import { getLanguage } from './getLanguage.ts'

describe('getLanguage', () => {
	it('returns latino when text contains the word latino', async () => {
		const result = await getLanguage('Pelicula latino')
		expect(result).toBe('latino')
	})

	it('returns latino for the short form "lat"', async () => {
		expect(await getLanguage('Pelicula lat')).toBe('latino')
	})

	it('matches latino case-insensitively', async () => {
		expect(await getLanguage('Pelicula LATINO')).toBe('latino')
	})

	it('returns latino when the mexican flag is present', async () => {
		expect(await getLanguage('Pelicula 🇲🇽')).toBe('latino')
	})

	it('returns castellano when text contains the word castellano', async () => {
		expect(await getLanguage('Pelicula castellano')).toBe('castellano')
	})

	it('matches castellano case-insensitively', async () => {
		expect(await getLanguage('Pelicula CASTElLANO')).toBe('castellano')
	})

	it('returns castellano when the spanish flag is present', async () => {
		expect(await getLanguage('Pelicula 🇪🇸')).toBe('castellano')
	})

	it('returns undefined when no language is detected', async () => {
		expect(await getLanguage('Pelicula normal')).toBeUndefined()
	})

	it('returns undefined when "lat" appears inside another word', async () => {
		expect(await getLanguage('Plato')).toBeUndefined()
	})

	it('prefers latino when both languages are present', async () => {
		expect(await getLanguage('latino castellano')).toBe('latino')
	})
})
