import { z } from 'zod'
import type { IEpisodeToSave } from '../entities/episode.ts'

const EpisodeSchema: z.ZodType<IEpisodeToSave> = z
	.object({
		episode_number: z.number().int(),
		season: z.number().int(),
		language_cas: z.boolean().optional(),
		language_lat: z.boolean().optional(),
		telegram_file_id_cas: z.number().int().optional(),
		telegram_file_id_lat: z.number().int().optional(),
	})
	.strip()

export { EpisodeSchema }
