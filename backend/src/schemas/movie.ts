import { z } from 'zod'
import { MOVIE_LISTENER_GROUP_ID } from '../provider/telegram.ts'

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

const TelegramMovieSchema = z.object({
	file_id: z.number().int().positive(),
	message_text: z.string(),
	language: z.enum(['latino', 'castellano']),
	is_saved: z.boolean(),
})

const TelegramFileSchema = z.object({
	chat_id: MOVIE_LISTENER_GROUP_ID,
	video: z.object(),
	caption: z.string().refine((value) => {
		const keywords = ['lat', 'castellano', '🇲🇽', '🇪🇸']
		return keywords.some((keyword) => value.includes(keyword))
	}),
})

const MovieFiltersSchema = z
	.object({
		catalog_name: z.string().optional(),
		catalog_version: z.number().int().optional(),
		year: z.coerce.number().int().positive().optional(),
		sort_by: z.enum(['title_en', 'title_cas', 'title_lat', 'year', 'language_cas', 'language_lat', 'id']).optional(),
	})
	.strip()

const MovieToUpdateParamsSchema = z
	.object({
		poster: z.string().startsWith('https://'),
		telegram_file_id_cas: z.number().int().optional(),
		telegram_file_id_lat: z.number().int().optional(),
	})
	.strip()

export type IMovieInput = z.infer<typeof MovieSchema>
export type ITelegramMovieInput = z.infer<typeof TelegramMovieSchema>
export type IMovieFilters = z.infer<typeof MovieFiltersSchema>
export type IMovieToUpdateParams = z.infer<typeof MovieToUpdateParamsSchema>

export { MovieFiltersSchema, MovieSchema, MovieToUpdateParamsSchema, TelegramFileSchema }
