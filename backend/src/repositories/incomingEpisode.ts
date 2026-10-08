import { pool } from '../database/index.ts'
import type { IIncomingEpisode, IIncomingEpisodeToSave } from '../entities/incomingEpisode.ts'
import type { IIncomingEpisodeFilters } from '../schemas/incomingEpisode.ts'

const SORT_COLUMNS = {
	id: 'id',
	created_at: 'created_at',
	updated_at: 'updated_at',
} as const

const SORT_DIRECTIONS = {
	asc: 'asc',
	desc: 'desc',
} as const

const DEFAULT_SORT_COLUMN = 'id'
const DEFAULT_SORT_DIRECTION = 'desc'

const COLUMNS =
	'id, message_id, caption, episode_number, season, language, batch_id, batch_name, is_processed, created_at, updated_at'

async function getIncomingEpisodes(filters: IIncomingEpisodeFilters): Promise<IIncomingEpisode[]> {
	const values: unknown[] = []
	const conditions: string[] = []

	if (filters) {
		if (filters.is_processed !== undefined) {
			values.push(filters.is_processed)
			conditions.push(`is_processed = $${values.length}`)
		}
		if (filters.season !== undefined) {
			values.push(filters.season)
			conditions.push(`season = $${values.length}`)
		}
		if (filters.episode_number !== undefined) {
			values.push(filters.episode_number)
			conditions.push(`episode_number = $${values.length}`)
		}
	}

	const whereClause = conditions.length > 0 ? ` where ${conditions.join(' and ')}` : ''
	const sortBy = filters?.sort_by ? SORT_COLUMNS[filters.sort_by] : undefined
	const sortDirection = filters?.sort_direction ? SORT_DIRECTIONS[filters.sort_direction] : undefined
	const orderByClause = sortBy
		? ` order by ${sortBy} ${sortDirection ?? DEFAULT_SORT_DIRECTION}`
		: ` order by ${DEFAULT_SORT_COLUMN}`

	const result = await pool.query(`SELECT ${COLUMNS} from incoming_episodes${whereClause}${orderByClause}`, values)
	return result.rows
}

async function markEpisodeAsProcessed(message_id: number): Promise<IIncomingEpisode | undefined> {
	const result = await pool.query(`UPDATE incoming_episodes SET is_processed = true WHERE message_id = $1 RETURNING ${COLUMNS}`, [
		message_id,
	])
	return result.rows[0]
}

async function saveIncomingEpisode(data: IIncomingEpisodeToSave): Promise<IIncomingEpisode | undefined> {
	const query =
		'INSERT INTO incoming_episodes (message_id, caption, episode_number, season, language, batch_id, batch_name, is_processed) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING ' +
		COLUMNS
	const values = [
		data.message_id,
		data.caption,
		data.episode_number,
		data.season,
		data.language,
		data.batch_id,
		data.batch_name,
		data.is_processed,
	]
	const result = await pool.query(query, values)
	return result.rows[0]
}

export const incomingEpisodesRepository = {
	getIncomingEpisodes,
	markEpisodeAsProcessed,
	saveIncomingEpisode,
}
