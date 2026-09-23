import { z } from 'zod'

const MovieSchema = z
	.object({
		title_en: z.string(),
		title_cas: z.string().optional(),
		title_lat: z.string().optional(),
		year: z.number().int().positive(),
		language_cas: z.boolean().optional(),
		language_lat: z.boolean().optional(),
		quality: z.enum(['cam', '720']).optional(),
		poster: z.string().startsWith('https://'),
		description: z.string(),
		tmdb_id: z.number().int(),
		popularity: z.number(),
		backdrop_path: z.string().startsWith('https://'),
		genres: z.array(z.string()).min(1),
		telegram_file_id_cas: z.number().int().optional(),
		telegram_file_id_lat: z.number().int().optional(),
		catalog_name: z.string(),
		catalog_version: z.number().int().positive(),
	})
	.strip()

const IncomingVideoSchema = z.object({
	telegram_message_id: z.number().int().positive(),
	caption: z.string(),
	language: z.enum(['latino', 'castellano']),
	is_processed: z.boolean(),
})

const MovieFiltersSchema = z
	.object({
		catalog_name: z.string().optional(),
		catalog_version: z.coerce.number().int().optional(),
		year: z.coerce.number().int().positive().optional(),
		tmdb_id: z.coerce.number().int().positive().optional(),
		sort_by: z.enum(['title_en', 'title_cas', 'title_lat', 'year', 'language_cas', 'language_lat', 'id']).optional(),
	})
	.strip()

const MovieToUpdateParamsSchema = z
	.object({
		tmdb_id: z.number().int().positive(),
		telegram_file_id_cas: z.number().int().optional(),
		telegram_file_id_lat: z.number().int().optional(),
	})
	.strip()

export type IMovieInput = z.infer<typeof MovieSchema>
export type IIncomingVideoInput = z.infer<typeof IncomingVideoSchema>
export type IMovieFilters = z.infer<typeof MovieFiltersSchema>
export type IMovieToUpdateParams = z.infer<typeof MovieToUpdateParamsSchema>

export { MovieFiltersSchema, MovieSchema, MovieToUpdateParamsSchema }
