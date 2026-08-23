import { z } from 'zod'

const MovieSchema = z.object({
	title_en: z.string(),
	title_cas: z.string().optional(),
	title_lat: z.string().optional(),
	year: z.number().int().positive(),
	language_cas: z.boolean().optional(),
	language_lat: z.boolean().optional(),
	quality: z.enum(['HD (1040p)', 'Copia de cine', '720p', 'Indefinida']).optional(),
	poster: z.string().startsWith('https://'),
	description: z.string(),
	telegram_file_id_cas: z.number().int().optional(),
	telegram_file_id_lat: z.number().int().optional(),
	catalog_name: z.string(),
	catalog_version: z.number().int().positive(),
})

export interface MovieWithoutCriticalData {
	title_en: string
	title_cas?: string
	title_lat?: string
	year: number
	language_cas?: boolean
	language_lat?: boolean
	poster: string
	description: string
	catalog_name: string
	catalog_version: number
}

const saveMovieQuery = `
      INSERT INTO movies (
        title_en,
        title_cas,
        title_lat,
        year,
        poster,
        language_cas,
        language_lat,
        quality,
        description,
        telegram_file_id_cas,
        telegram_file_id_lat,
        telegram_poster_id,
        catalog_name,
        catalog_version,
        telegram_container_group_id
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
      )
      RETURNING id
    `

export type Movie = z.infer<typeof MovieSchema>

const TelegramMovieSchema = z.object({
	fileId: z.number().int().positive(),
	messageText: z.string(),
	language: z.enum(['latino', 'castellano']),
	is_saved: z.boolean(),
})

export type TelegramMovie = z.infer<typeof TelegramMovieSchema>

export { MovieSchema, saveMovieQuery }
