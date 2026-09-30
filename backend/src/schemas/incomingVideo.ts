import { z } from 'zod'

const IncomingVideoSchema = z.object({
	telegram_message_id: z.number().int().positive(),
	caption: z.string(),
	language: z.enum(['latino', 'castellano']),
	is_processed: z.boolean(),
})

const BooleanQueryParam = z.enum(['true', 'false', '1', '0']).transform((value) => value === 'true' || value === '1')

const IncomingVideoFiltersSchema = z
	.object({
		is_processed: BooleanQueryParam.optional(),
		sort_by: z.enum(['id', 'created_at', 'updated_at']).optional(),
		sort_direction: z.enum(['asc', 'desc']).optional(),
	})
	.strip()

export type IIncomingVideoInput = z.infer<typeof IncomingVideoSchema>
export type IIncomingVideoFilters = z.infer<typeof IncomingVideoFiltersSchema>

export { IncomingVideoFiltersSchema }
