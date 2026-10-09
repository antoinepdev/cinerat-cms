import { pool } from '../database/index.ts'
import type { IEpisode, IEpisodeFilters, IEpisodeToSave, IEpisodeToUpdate } from '../entities/episode.ts'

async function saveEpisodes(seriesId: number, episodes: IEpisodeToSave[]): Promise<IEpisode[]> {
	if (episodes.length === 0) return []

	const baseQuery =
		'INSERT INTO episodes (series_id, episode_number, season, language_cas, language_lat, telegram_file_id_cas, telegram_file_id_lat) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *'

	const savedEpisodes: IEpisode[] = []
	for (const ep of episodes) {
		const values = [
			seriesId,
			ep.episode_number,
			ep.season,
			ep.language_cas ?? false,
			ep.language_lat ?? false,
			ep.telegram_file_id_cas ?? null,
			ep.telegram_file_id_lat ?? null,
		]

		const result = await pool.query(baseQuery, values)
		savedEpisodes.push(result.rows[0])
	}

	return savedEpisodes
}

async function updateEpisodes(episodes: IEpisodeToUpdate[]): Promise<IEpisode[]> {
	const updatedEpisodes: IEpisode[] = []

	for (const ep of episodes) {
		const values: unknown[] = []
		const setClauses: string[] = []

		if (ep.language_cas) {
			values.push(ep.telegram_file_id_cas)
			setClauses.push(`telegram_file_id_cas = $${values.length}`)
			values.push(true)
			setClauses.push(`language_cas = $${values.length}`)
		}
		if (ep.language_lat) {
			values.push(ep.telegram_file_id_lat)
			setClauses.push(`telegram_file_id_lat = $${values.length}`)
			values.push(true)
			setClauses.push(`language_lat = $${values.length}`)
		}
		if (setClauses.length === 0) continue

		values.push(ep.id)

		const result = await pool.query(
			`UPDATE episodes SET ${setClauses.join(', ')} WHERE id = $${values.length} RETURNING *`,
			values,
		)
		updatedEpisodes.push(result.rows[0])
	}

	return updatedEpisodes
}

async function getEpisodes(filters: IEpisodeFilters): Promise<IEpisode[]> {
	const baseQuery =
		'SELECT id, series_id, episode_number, season, language_cas, language_lat, telegram_file_id_cas, telegram_file_id_lat, created_at, updated_at from episodes'

	const conditions: string[] = []
	const values: unknown[] = []

	if (filters) {
		if (filters.series_id) {
			values.push(filters.series_id)
			conditions.push(`series_id = $${values.length}`)
		}
	}

	const whereClause = conditions.length > 0 ? ` where ${conditions.join(' and ')}` : ''

	const result = await pool.query(baseQuery + whereClause, values)
	return result.rows
}

export const episodeRepository = {
	saveEpisodes,
	updateEpisodes,
	getEpisodes,
}
