import { z } from 'zod'
import type { ISeriesToSave } from '../entities/series.ts'
import type { ISaveSeriesWithEpisodesParams } from '../services/episodes.ts'
import { EpisodeSchema } from './episode.ts'

const SeriesSchema: z.ZodType<ISeriesToSave> = z
	.object({
		tmdb_id: z.number().int(),
		title_en: z.string(),
		title_cas: z.string().optional(),
		title_lat: z.string().optional(),
		year: z.number().int(),
		poster: z.templateLiteral(['https://image.tmdb.org/', z.string(), '.jpg']),
		description: z.string(),
		popularity: z.number(),
		backdrop_path: z.templateLiteral(['https://image.tmdb.org/', z.string(), '.jpg']),
		genres: z.array(z.string()),
	})
	.strip()

const SaveSeriesWithEpisodesSchema: z.ZodType<ISaveSeriesWithEpisodesParams> = z
	.object({
		series: SeriesSchema,
		episodesToSave: z.array(EpisodeSchema),
	})
	.strip()

export { SaveSeriesWithEpisodesSchema, SeriesSchema }
