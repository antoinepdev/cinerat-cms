import { describe, expect, it } from 'vitest'
import { cleanText } from './cleanText.ts'

describe('cleanText', () => {
	it.for<{ input: string; expected: string }>([
		{ input: 'Avengers español', expected: 'Avengers' },
		{ input: 'Avatar LATINO', expected: 'Avatar' },
		{ input: 'Si, el Padrino castellano es bueno', expected: 'Si el Padrino es bueno' },
		{ input: 'Transformers 🇲🇽', expected: 'Transformers' },
		{ input: 'Inception 🇪🇸', expected: 'Inception' },
	])('removes the language words and flags from "$input"', ({ input, expected }) => {
		expect(cleanText(input)).toBe(expected)
	})

	it.for<{ input: string; expected: string }>([
		{ input: 'Mi pobre angelito áéíóú ñ', expected: 'Mi pobre angelito áéíóú ñ' },
		{ input: 'Avatar. - ¡2! (2022)', expected: 'Avatar 2 2022' },
		{ input: '  Star   Wars  ', expected: 'Star Wars' },
		{ input: '🇲🇽 español', expected: '' },
		{ input: '!!! ---', expected: '' },
		{ input: '1984 - best movie!!!', expected: '1984 best movie' },
	])('returns "$expected" when "$input" is cleaned', ({ input, expected }) => {
		expect(cleanText(input)).toBe(expected)
	})
})
