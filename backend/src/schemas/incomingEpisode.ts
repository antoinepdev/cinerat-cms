import { z } from 'zod'

const BooleanQueryParam = z.enum(['true', 'false', '1', '0']).transform((value) => value === 'true' || value === '1')

const IncomingEpisodeFiltersSchema = z
	.object({
		is_processed: BooleanQueryParam.optional(),
		season: z.coerce.number().int().positive().optional(),
		episode_number: z.coerce.number().int().positive().optional(),
		sort_by: z.enum(['id', 'created_at', 'updated_at']).optional(),
		sort_direction: z.enum(['asc', 'desc']).optional(),
	})
	.strip()

export type IIncomingEpisodeFilters = z.infer<typeof IncomingEpisodeFiltersSchema>

export { IncomingEpisodeFiltersSchema }
