export async function getLanguage(text: string): Promise<'latino' | 'castellano' | undefined> {
	const hasMxFlag = text.includes('🇲🇽')
	const hasLatinoWord = text.toLowerCase().includes('lat')
	if (hasLatinoWord || hasMxFlag) return 'latino'
	const hasEsFlag = text.includes('🇪🇸')
	const hasCastellanoWord = text.toLowerCase().includes('castellano')
	if (hasCastellanoWord || hasEsFlag) return 'castellano'
	return undefined
}
