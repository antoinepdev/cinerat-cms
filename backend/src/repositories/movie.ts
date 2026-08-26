import { Result } from 'pg'
import { pool } from '../database/index.ts'
import type { IMovie, IMovieToSave, ITelegramMovie } from '../entities/movie.ts'
import type { IMovieFilters, IMovieToUpdateParams, ITelegramMovieInput } from '../schemas/movie.ts'

async function getTelegramMovies(): Promise<ITelegramMovie[]> {
	const query = 'SELECT * FROM telegram_movies WHERE is_saved = false'
	const result = await pool.query(query)
	return result.rows
}

async function getMovies(filters: IMovieFilters): Promise<IMovie[]> {
	const baseQuery =
		'SELECT id, title_en, title_cas, title_lat, year, language_cas, language_lat, catalog_name, catalog_version, poster, description from movies'
	let queryFilters: string = ''
	const values = []
	if (filters) {
		if (filters.catalog_name) {
			queryFilters += ` where catalog_name = $${values.length + 1}`
			values.push(filters.catalog_name)
			if (filters.catalog_version) {
				queryFilters += `and catalog_version = $${values.length + 1}`
				values.push(filters.catalog_version)
			}
		}
		if (filters.year) {
			if (values.length === 0) {
				queryFilters = ` where year = $${values.length + 1}`
				values.push(filters.year)
			} else {
				queryFilters += `and year = $${values.length + 1}`
				values.push(filters.year)
			}
		}
		if (filters.sort_by) queryFilters += `order by ${filters.sort_by}`
	}

	const queryWithFilters = baseQuery + queryFilters

	const result = await pool.query(queryWithFilters, values)
	return result.rows
}

async function saveMovie(data: IMovieToSave): Promise<IMovie> {
	const query = ` INSERT INTO movies ( title_en, title_cas, title_lat, year, poster, language_cas, language_lat, quality, description, telegram_file_id_cas, telegram_file_id_lat, telegram_poster_id, catalog_name, catalog_version ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING title_en, title_cas, title_lat, year, poster, language_cas, language_lat, quality, description, telegram_file_id_cas, telegram_file_id_lat, telegram_poster_id, catalog_name, catalog_version `
	const values = [
		data.title_en,
		data.title_cas,
		data.title_lat,
		data.year,
		data.poster,
		data.language_cas,
		data.language_lat,
		data.quality,
		data.description,
		data.telegram_file_id_cas,
		data.telegram_file_id_lat,
		data.telegram_poster_id,
		data.catalog_name,
		data.catalog_version,
	]
	const result = await pool.query(query, values)
	return result.rows[0]
}

async function updateMovie(data: IMovieToUpdateParams): Promise<IMovie> {
	const candidates: [string, unknown][] = [
		['language_cas', data.language_cas],
		['language_lat', data.language_lat],
		['telegram_file_id_cas', data.telegram_file_id_cas],
		['telegram_file_id_lat', data.telegram_file_id_lat],
	]
	const values: unknown[] = []
	const setClauses: string[] = []

	for (const [key, value] of candidates) {
		if (value === undefined) continue

		values.push(value)
		setClauses.push(`${key} = $${values.length}`)
	}
	values.push(data.poster)

	const result = await pool.query(
		`UPDATE movies SET ${setClauses.join(', ')} WHERE poster = $${values.length} RETURNING *`,
		values,
	)
	return result.rows[0]
}

async function updateTelegramMovie(file_id: number) {
	const result = await pool.query('UPDATE telegram_movies SET is_saved = true WHERE file_id = $1 RETURNING *', [file_id])
	return result.rows[0]
}

async function saveTelegramMovie(data: ITelegramMovieInput): Promise<ITelegramMovieInput> {
	const query = 'INSERT INTO telegram_movies (file_id, message_text, language, is_saved) Values ($1, $2, $3, $4)'
	const values = [data.file_id, data.message_text, data.language, data.is_saved]
	const result = await pool.query(query, values)
	return result.rows[0]
}

const movieRepository = {
	getTelegramMovies,
	getMovies,
	saveMovie,
	updateTelegramMovie,
	saveTelegramMovie,
	updateMovie,
}

export { movieRepository }
