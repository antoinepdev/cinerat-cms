export async function getLanguage(text: string): Promise<'latino' | 'castellano' | undefined> {
	const hasMxFlag = text.includes('🇲🇽')

	const words = text
		.toLowerCase()
		.replace(/-/g, ' ')
		.split(/\s+/)
		.map((word) => word.replace(/[^\p{L}]/gu, ''))

	const hasLatinoWord = words.some((word) => word === 'lat' || word.includes('latino'))
	if (hasLatinoWord || hasMxFlag) return 'latino'

	const hasEsFlag = text.includes('🇪🇸')
	const hasCastellanoWord = words.some((word) => word === 'cas' || word.includes('castellano'))
	if (hasCastellanoWord || hasEsFlag) return 'castellano'

	return undefined
}
