import { incomingEpisodesRepository } from '../repositories/incomingEpisode.ts'
import type { IIncomingEpisodeFilters } from '../schemas/incomingEpisode.ts'

async function getIncomingEpisodes(filters: IIncomingEpisodeFilters) {
	const episodes = await incomingEpisodesRepository.getIncomingEpisodes(filters)
	return episodes
}

export const incomingEpisodesService = {
	getIncomingEpisodes,
}
