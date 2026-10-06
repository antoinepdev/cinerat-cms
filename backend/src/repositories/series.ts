import { pool } from '../database/index.ts'
import type { ISeries, ISeriesFilters, ISeriesToSave } from '../entities/series.ts'

const COLUMNS =
	'id, title_en, title_cas, title_lat, year, tmdb_id, poster, backdrop_path, description, popularity, genres, created_at, updated_at'

async function getSeries(filters?: ISeriesFilters): Promise<ISeries[]> {
	const conditions: string[] = []
	const values: unknown[] = []

	if (filters?.tmdb_id !== undefined) {
		values.push(filters.tmdb_id)
		conditions.push(`tmdb_id = $${values.length}`)
	}

	const whereClause = conditions.length > 0 ? ` where ${conditions.join(' and ')}` : ''

	const result = await pool.query(`SELECT ${COLUMNS} from series${whereClause}`, values)
	return result.rows
}

async function saveSeries(series: ISeriesToSave): Promise<ISeries> {
	const query = `INSERT INTO series (title_en, title_cas, title_lat, year, tmdb_id, poster, backdrop_path, description, popularity, genres) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING ${COLUMNS}`
	const values = [
		series.title_en,
		series.title_cas,
		series.title_lat,
		series.year,
		series.tmdb_id,
		series.poster,
		series.backdrop_path,
		series.description,
		series.popularity,
		series.genres,
	]

	const result = await pool.query(query, values)
	return result.rows[0]
}

async function deleteSeries(id: number): Promise<{ id: number } | undefined> {
	const result = await pool.query('DELETE FROM series WHERE id = $1 RETURNING id', [id])
	return result.rows[0]
}

const seriesRepository = {
	getSeries,
	saveSeries,
	deleteSeries,
}

export { seriesRepository }
