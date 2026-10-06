import type { IEpisode, IEpisodeToSave, IEpisodeToUpdate } from '../entities/episode.ts'

interface IEpisodesPartition {
	toSave: IEpisodeToSave[]
	toUpdate: IEpisodeToUpdate[]
	toDelete: IEpisodeToSave[]
}

function getEpisodeKey({ season, episode_number }: Pick<IEpisodeToSave, 'season' | 'episode_number'>): string {
	return `${season}:${episode_number}`
}

function bringsCas(episode: Pick<IEpisodeToSave, 'language_cas'>): boolean {
	return Boolean(episode.language_cas)
}

function bringsLat(episode: Pick<IEpisodeToSave, 'language_lat'>): boolean {
	return Boolean(episode.language_lat)
}

function bringsNewLanguage(episode: IEpisodeToSave, existentEpisode: IEpisode): boolean {
	return (bringsCas(episode) && !bringsCas(existentEpisode)) || (bringsLat(episode) && !bringsLat(existentEpisode))
}

export function partitionEpisodes(episodesToSave: IEpisodeToSave[], existentEpisodes: IEpisode[]): IEpisodesPartition {
	const existentEpisodesByKey = new Map(existentEpisodes.map((episode) => [getEpisodeKey(episode), episode]))
	const partition: IEpisodesPartition = { toSave: [], toUpdate: [], toDelete: [] }
	const seenKeys = new Set<string>()

	for (const episode of episodesToSave) {
		const key = getEpisodeKey(episode)
		if (seenKeys.has(key)) continue
		seenKeys.add(key)

		const existentEpisode = existentEpisodesByKey.get(key)
		if (!existentEpisode) partition.toSave.push(episode)
		else if (bringsNewLanguage(episode, existentEpisode)) partition.toUpdate.push({ ...episode, id: existentEpisode.id })
		else partition.toDelete.push(episode)
	}

	return partition
}
