export interface ISeasonEpisode {
	season: number
	episode_number: number
}

const SEASON_EPISODE_PATTERNS: RegExp[] = [
	/\btemp (?<season>\d{1,2}) cap (?<episode>\d{1,2})\b/,
	/\btemp\. (?<season>\d{1,2})\/ cap\. (?<episode>\d{1,2})\b/,
	/\btemporada (?<season>\d{1,2}) episodio (?<episode>\d{1,2})\b/,
	/\b(?<season>\d{1,2})x(?<episode>\d{1,2})\b/,
]

export function getSeasonAndEpisode(caption: string): ISeasonEpisode | undefined {
	const normalized = caption.toLowerCase().replace(/\s+/g, ' ').trim()

	for (const pattern of SEASON_EPISODE_PATTERNS) {
		const match = pattern.exec(normalized)
		if (!match?.groups) continue

		const season = Number(match.groups.season)
		const episodeNumber = Number(match.groups.episode)
		if (season === 0 || episodeNumber === 0) return undefined

		return { season, episode_number: episodeNumber }
	}

	return undefined
}
