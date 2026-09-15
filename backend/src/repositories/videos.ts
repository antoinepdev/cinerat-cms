import { pool } from '../database/index.ts'
import type { IIncomingVideo } from '../entities/movie.ts'
import type { IIncomingVideoInput } from '../schemas/movie.ts'

async function getPendingVideos(): Promise<IIncomingVideo[]> {
	const query = 'SELECT * FROM incoming_videos WHERE is_processed = false'
	const result = await pool.query(query)
	return result.rows
}

async function markVideoAsProcessed(telegramMessageId: number) {
	const result = await pool.query('UPDATE incoming_videos SET is_processed = true WHERE telegram_message_id = $1 RETURNING *', [
		telegramMessageId,
	])
	return result.rows[0]
}

async function saveIncomingVideo(data: IIncomingVideoInput): Promise<IIncomingVideoInput> {
	const query = 'INSERT INTO incoming_videos (telegram_message_id, caption, language, is_processed) Values ($1, $2, $3, $4)'
	const values = [data.telegram_message_id, data.caption, data.language, data.is_processed]
	const result = await pool.query(query, values)
	return result.rows[0]
}

const videosRepository = {
	getPendingVideos,
	markVideoAsProcessed,
	saveIncomingVideo,
}

export { videosRepository }
