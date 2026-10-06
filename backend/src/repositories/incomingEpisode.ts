import { pool } from '../database/index.ts'
import type { IIncomingEpisode } from '../entities/incomingEpisode.ts'

const COLUMNS = 'id, message_id, caption, episode_number, season, is_processed, created_at, updated_at'

async function markEpisodeAsProcessed(message_id: number): Promise<IIncomingEpisode | undefined> {
	const result = await pool.query(`UPDATE incoming_episodes SET is_processed = true WHERE message_id = $1 RETURNING ${COLUMNS}`, [
		message_id,
	])
	return result.rows[0]
}

export const incomingEpisodesRepository = {
	markEpisodeAsProcessed,
}
