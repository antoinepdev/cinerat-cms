import type { IEpisodeToSave } from '../entities/episode.ts'

export type IEpisodeCaptionInput = Pick<IEpisodeToSave, 'season' | 'episode_number'>

export async function getEpisodeCaption(episode: IEpisodeCaptionInput, language: 'cas' | 'lat'): Promise<string> {
	const { season, episode_number } = episode

	let caption = `${season}x${episode_number.toString().padStart(2, '0')}`

	if (language === 'cas') caption += '\nEspañol castellano 🇪🇸'
	else if (language === 'lat') caption += '\nEspañol latino 🇲🇽'

	return caption
}
