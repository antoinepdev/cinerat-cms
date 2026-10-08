import { z } from 'zod'
import type { IEpisodeToSave } from '../entities/episode.ts'

const EpisodeSchema: z.ZodType<IEpisodeToSave> = z
	.object({
		episode_number: z.number().int(),
		season: z.number().int(),
		language_cas: z.boolean(),
		language_lat: z.boolean(),
		telegram_file_id_cas: z.number().int(),
		telegram_file_id_lat: z.number().int(),
	})
	.strip()

export { EpisodeSchema }
