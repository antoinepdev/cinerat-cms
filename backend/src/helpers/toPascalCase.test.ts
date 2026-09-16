import { describe, expect, it } from 'vitest'
import { toPascalCase } from './toPascalCase.ts'

describe('toPascalCase', () => {
	it('capitalizes each word', () => {
		expect(toPascalCase('avengers endgame')).toBe('Avengers Endgame')
	})

	it('handles accented characters', () => {
		expect(toPascalCase('pÉREZ')).toBe('Pérez')
		expect(toPascalCase('ñandú')).toBe('Ñandú')
		expect(toPascalCase('álVarez')).toBe('Álvarez')
	})

	it('lowercases the rest of the word', () => {
		expect(toPascalCase('AVENGERS')).toBe('Avengers')
	})

	it('capitalizes a single word', () => {
		expect(toPascalCase('avatar')).toBe('Avatar')
	})

	it('returns empty string for empty input', () => {
		expect(toPascalCase('')).toBe('')
	})

	it('preserves multiple spaces between words', () => {
		expect(toPascalCase('Star   Wars')).toBe('Star   Wars')
	})
})
