import { pool } from '../database/index.ts'
import type { IIncomingEpisode, IIncomingEpisodeToSave } from '../entities/incomingEpisode.ts'

const COLUMNS = 'id, message_id, caption, episode_number, season, language, is_processed, created_at, updated_at'

async function markEpisodeAsProcessed(message_id: number): Promise<IIncomingEpisode | undefined> {
	const result = await pool.query(`UPDATE incoming_episodes SET is_processed = true WHERE message_id = $1 RETURNING ${COLUMNS}`, [
		message_id,
	])
	return result.rows[0]
}

async function saveIncomingEpisode(data: IIncomingEpisodeToSave): Promise<IIncomingEpisode | undefined> {
	const query =
		'INSERT INTO incoming_episodes (message_id, caption, episode_number, season, language, is_processed) VALUES ($1, $2, $3, $4, $5, $6) RETURNING ' +
		COLUMNS
	const values = [data.message_id, data.caption, data.episode_number, data.season, data.language, data.is_processed]
	const result = await pool.query(query, values)
	return result.rows[0]
}

export const incomingEpisodesRepository = {
	markEpisodeAsProcessed,
	saveIncomingEpisode,
}
