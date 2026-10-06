import type { IEpisodeToSave } from '../entities/episode.ts'
import type { ISeriesToSave } from '../entities/series.ts'
import { partitionEpisodes } from '../helpers/partitionEpisodes.ts'
import { episodeRepository } from '../repositories/episode.ts'
import { incomingEpisodesRepository } from '../repositories/incomingEpisode.ts'
import { seriesRepository } from '../repositories/series.ts'
import { NotFoundError } from '../utils/errors.ts'

interface ISaveSeriesWithEpisodesParams {
	episodesToSave: IEpisodeToSave[]
	series: ISeriesToSave
}

function getIncomingMessageIds(episodes: IEpisodeToSave[]): number[] {
	const messageIds = episodes.flatMap((episode) => [episode.telegram_file_id_cas, episode.telegram_file_id_lat])
	return [...new Set(messageIds.filter((messageId): messageId is number => Boolean(messageId)))]
}

async function markIncomingEpisodesAsProcessed(messageIds: number[]) {
	for (const messageId of messageIds) {
		const updatedEpisode = await incomingEpisodesRepository.markEpisodeAsProcessed(messageId)
		if (!updatedEpisode) throw new NotFoundError('Incoming episode not found')
	}
}

async function saveSeriesWithEpisodes({ episodesToSave, series }: ISaveSeriesWithEpisodesParams): Promise<void> {
	const [existentSeries] = await seriesRepository.getSeries({ tmdb_id: series.tmdb_id })
	const serieWasCreated = !existentSeries
	const currentSeries = existentSeries ?? (await seriesRepository.saveSeries(series))

	const existentEpisodes = await episodeRepository.getEpisodes({ series_id: currentSeries.id })
	const { toSave, toUpdate } = partitionEpisodes(episodesToSave, existentEpisodes)

	if (toSave.length !== 0) await episodeRepository.saveEpisodes(currentSeries.id, toSave)
	if (toUpdate.length !== 0) await episodeRepository.updateEpisodes(toUpdate)

	const hasChanges = toSave.length !== 0 || toUpdate.length !== 0
	if (serieWasCreated && !hasChanges) await seriesRepository.deleteSeries(currentSeries.id)

	await markIncomingEpisodesAsProcessed(getIncomingMessageIds(episodesToSave))
}

export const episodeService = {
	saveSeriesWithEpisodes,
}
