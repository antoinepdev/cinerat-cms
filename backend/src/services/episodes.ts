import type { IEpisodeToSave } from '../entities/episode.ts'
import type { ISeries, ISeriesInput } from '../entities/series.ts'
import { getEpisodeCaption } from '../helpers/getEpisodeCaption.ts'
import { partitionEpisodes } from '../helpers/partitionEpisodes.ts'
import { createSeriesSendDelay, type ISeriesSendDelay } from '../helpers/seriesSendDelay.ts'
import { episodeRepository } from '../repositories/episode.ts'
import { incomingEpisodesRepository } from '../repositories/incomingEpisode.ts'
import { seriesRepository } from '../repositories/series.ts'
import { NotFoundError } from '../utils/errors.ts'
import { telegramService } from './telegram.ts'

export interface ISaveSeriesWithEpisodesParams {
	episodesToSave: IEpisodeToSave[]
	series: ISeriesInput
}

function getIncomingMessageIds(episodes: IEpisodeToSave[]): number[] {
	const messageIds = episodes.flatMap((episode) => [episode.telegram_file_id_cas, episode.telegram_file_id_lat])
	return [...new Set(messageIds.filter((messageId): messageId is number => Boolean(messageId)))]
}

async function publishEpisodeFiles<T extends IEpisodeToSave>(episodes: T[], delay: ISeriesSendDelay): Promise<T[]> {
	const publishedEpisodes: T[] = []

	for (const episode of episodes) {
		const publishedEpisode = { ...episode }
		if (publishedEpisode.telegram_file_id_cas) {
			const episodeCaption = await getEpisodeCaption(publishedEpisode, 'cas')
			publishedEpisode.telegram_file_id_cas = await telegramService.sendEpisode(
				publishedEpisode.telegram_file_id_cas,
				episodeCaption,
				delay,
			)
		}
		if (publishedEpisode.telegram_file_id_lat) {
			const episodeCaption = await getEpisodeCaption(publishedEpisode, 'lat')
			publishedEpisode.telegram_file_id_lat = await telegramService.sendEpisode(
				publishedEpisode.telegram_file_id_lat,
				episodeCaption,
				delay,
			)
		}
		publishedEpisodes.push(publishedEpisode)
	}

	return publishedEpisodes
}

async function markIncomingEpisodesAsProcessed(messageIds: number[]) {
	for (const messageId of messageIds) {
		const updatedEpisode = await incomingEpisodesRepository.markEpisodeAsProcessed(messageId)
		if (!updatedEpisode) throw new NotFoundError('Incoming episode not found')
	}
}

async function createSeriesWithPoster(series: ISeriesInput): Promise<ISeries> {
	const telegram_poster_id = await telegramService.sendSeriesPoster(series)
	return seriesRepository.saveSeries({ ...series, telegram_poster_id })
}

async function saveSeriesWithEpisodes({ episodesToSave, series }: ISaveSeriesWithEpisodesParams): Promise<void> {
	const [existentSeries] = await seriesRepository.getSeries({ tmdb_id: series.tmdb_id })

	if (!existentSeries && episodesToSave.length === 0) return

	const currentSeries = existentSeries ?? (await createSeriesWithPoster(series))

	const existentEpisodes = await episodeRepository.getEpisodes({ series_id: currentSeries.id })
	const { toSave, toUpdate } = partitionEpisodes(episodesToSave, existentEpisodes)

	const delay = createSeriesSendDelay()
	const publishedToSave = toSave.length !== 0 ? await publishEpisodeFiles(toSave, delay) : toSave
	const publishedToUpdate = toUpdate.length !== 0 ? await publishEpisodeFiles(toUpdate, delay) : toUpdate

	if (publishedToSave.length !== 0) await episodeRepository.saveEpisodes(currentSeries.id, publishedToSave)
	if (publishedToUpdate.length !== 0) await episodeRepository.updateEpisodes(publishedToUpdate)

	await markIncomingEpisodesAsProcessed(getIncomingMessageIds(episodesToSave))
}

export const episodeService = {
	saveSeriesWithEpisodes,
}
