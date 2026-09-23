import { pool } from '../database/index.ts'
import type { IMovie, IMovieToSave } from '../entities/movie.ts'
import type { IMovieFilters, IMovieToUpdateParams } from '../schemas/movie.ts'

const SORT_COLUMNS = {
	title_en: 'title_en',
	title_cas: 'title_cas',
	title_lat: 'title_lat',
	year: 'year',
	language_cas: 'language_cas',
	language_lat: 'language_lat',
	id: 'id',
} as const

async function getMovies(filters: IMovieFilters): Promise<IMovie[]> {
	const baseQuery =
		'SELECT id, title_en, title_cas, title_lat, year, language_cas, language_lat, catalog_name, catalog_version, poster, description, tmdb_id, popularity, backdrop_path, genres from movies'

	const conditions: string[] = []
	const values: unknown[] = []

	if (filters) {
		if (filters.catalog_name) {
			values.push(filters.catalog_name)
			conditions.push(`catalog_name = $${values.length}`)
		}
		if (filters.catalog_version !== undefined) {
			values.push(filters.catalog_version)
			conditions.push(`catalog_version = $${values.length}`)
		}
		if (filters.year) {
			values.push(filters.year)
			conditions.push(`year = $${values.length}`)
		}
		if (filters.tmdb_id) {
			values.push(filters.tmdb_id)
			conditions.push(`tmdb_id = $${values.length}`)
		}
	}

	const whereClause = conditions.length > 0 ? ` where ${conditions.join(' and ')}` : ''
	const sortBy = filters?.sort_by ? SORT_COLUMNS[filters.sort_by] : undefined
	const orderByClause = sortBy ? ` order by ${sortBy}` : ''
	const queryWithFilters = baseQuery + whereClause + orderByClause

	const result = await pool.query(queryWithFilters, values)
	return result.rows
}

async function saveMovie(data: IMovieToSave): Promise<IMovie> {
	const query = ` INSERT INTO movies ( title_en, title_cas, title_lat, year, poster, language_cas, language_lat, quality, description, telegram_file_id_cas, telegram_file_id_lat, telegram_poster_id, catalog_name, catalog_version, tmdb_id, popularity, backdrop_path, genres ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) RETURNING title_en, title_cas, title_lat, year, poster, language_cas, language_lat, quality, description, telegram_file_id_cas, telegram_file_id_lat, telegram_poster_id, catalog_name, catalog_version, tmdb_id, popularity, backdrop_path, genres `
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
		data.tmdb_id,
		data.popularity,
		data.backdrop_path,
		data.genres,
	]
	const result = await pool.query(query, values)
	return result.rows[0]
}

async function updateMovie(data: IMovieToUpdateParams): Promise<IMovie | undefined> {
	const values: unknown[] = []
	const setClauses: string[] = []

	if (data.telegram_file_id_cas !== undefined) {
		values.push(data.telegram_file_id_cas)
		setClauses.push(`telegram_file_id_cas = $${values.length}`)
		values.push(true)
		setClauses.push(`language_cas = $${values.length}`)
	}
	if (data.telegram_file_id_lat !== undefined) {
		values.push(data.telegram_file_id_lat)
		setClauses.push(`telegram_file_id_lat = $${values.length}`)
		values.push(true)
		setClauses.push(`language_lat = $${values.length}`)
	}

	values.push(data.tmdb_id)

	const result = await pool.query(
		`UPDATE movies SET ${setClauses.join(', ')} WHERE tmdb_id = $${values.length} RETURNING id, title_en, title_cas, title_lat, year, poster, language_cas, language_lat, quality, description, telegram_file_id_cas, telegram_file_id_lat, telegram_poster_id, catalog_name, catalog_version, tmdb_id, popularity, backdrop_path, genres`,
		values,
	)
	return result.rows[0]
}

const movieRepository = {
	getMovies,
	saveMovie,
	updateMovie,
}

export { movieRepository }
