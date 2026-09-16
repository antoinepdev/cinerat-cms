import { describe, expect, it } from 'vitest'
import { toPascalCase } from './toPascalCase.ts'

describe('toPascalCase', () => {
	it.for<{ input: string; expected: string }>([
		{ input: 'avengers endgame', expected: 'Avengers Endgame' },
		{ input: 'AVENGERS', expected: 'Avengers' },
		{ input: 'avatar', expected: 'Avatar' },
		{ input: '', expected: '' },
		{ input: 'Star   Wars', expected: 'Star   Wars' },
	])('returns "$expected" for "$input"', ({ input, expected }) => {
		expect(toPascalCase(input)).toBe(expected)
	})

	it.for<{ input: string; expected: string }>([
		{ input: 'pÉREZ', expected: 'Pérez' },
		{ input: 'ñandú', expected: 'Ñandú' },
		{ input: 'álVarez', expected: 'Álvarez' },
	])('handles accented characters: "$input" to "$expected"', ({ input, expected }) => {
		expect(toPascalCase(input)).toBe(expected)
	})
})
