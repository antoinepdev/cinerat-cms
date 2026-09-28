const REGIONAL_INDICATOR_BASE = 0x1f1e6
const FIRST_LETTER_CODE = 'A'.charCodeAt(0)

const LATINO_FLAG_CODES = new Set(['MX', 'ME'])
const CASTELLANO_FLAG_CODES = new Set(['ES', 'EA'])

function getFlagCodes(text: string): string[] {
	return [...text.matchAll(/[\u{1F1E6}-\u{1F1FF}]{2}/gu)].map((match) =>
		[...match[0]]
			.map((indicator) => String.fromCharCode(indicator.codePointAt(0)! - REGIONAL_INDICATOR_BASE + FIRST_LETTER_CODE))
			.join(''),
	)
}

export async function getLanguage(text: string): Promise<'latino' | 'castellano' | undefined> {
	const normalized = text.normalize('NFKC')

	const flagCodes = getFlagCodes(normalized)
	const hasMxFlag = flagCodes.some((code) => LATINO_FLAG_CODES.has(code))
	const hasEsFlag = flagCodes.some((code) => CASTELLANO_FLAG_CODES.has(code))

	const words = normalized
		.toLowerCase()
		.replace(/-/g, ' ')
		.split(/\s+/)
		.map((word) => word.replace(/[^\p{L}]/gu, ''))

	const hasLatinoWord = words.some((word) => word === 'lat' || word.includes('latino'))
	if (hasLatinoWord || hasMxFlag) return 'latino'

	const hasCastellanoWord = words.some((word) => word === 'cas' || word.includes('castellano'))
	if (hasCastellanoWord || hasEsFlag) return 'castellano'

	return undefined
}
