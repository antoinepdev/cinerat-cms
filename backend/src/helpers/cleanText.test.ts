import { describe, expect, it } from 'vitest'
import { cleanText } from './cleanText.ts'

describe('cleanText', () => {
	it('removes the word "español"', () => {
		expect(cleanText('Avengers español')).toBe('Avengers')
	})

	it('removes the word "latino" case-insensitively', () => {
		expect(cleanText('Avatar LATINO')).toBe('Avatar')
	})

	it('removes the word "castellano" in the middle of the text', () => {
		expect(cleanText('Si, el Padrino castellano es bueno')).toBe('Si el Padrino es bueno')
	})

	it('removes the language flags', () => {
		expect(cleanText('Transformers 🇲🇽')).toBe('Transformers')
		expect(cleanText('Inception 🇪🇸')).toBe('Inception')
	})

	it('keeps accented characters and "ñ"', () => {
		expect(cleanText('Mi pobre angelito áéíóú ñ')).toBe('Mi pobre angelito áéíóú ñ')
	})

	it('strips punctuation and symbols', () => {
		expect(cleanText('Avatar. - ¡2! (2022)')).toBe('Avatar 2 2022')
	})

	it('collapses multiple spaces into one', () => {
		expect(cleanText('  Star   Wars  ')).toBe('Star Wars')
	})

	it('returns an empty string when only keywords or symbols remain', () => {
		expect(cleanText('🇲🇽 español')).toBe('')
		expect(cleanText('!!! ---')).toBe('')
	})

	it('keeps only numbers when the rest is junk', () => {
		expect(cleanText('1984 - best movie!!!')).toBe('1984 best movie')
	})
})
