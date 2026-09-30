import { pool } from '../database/index.ts'
import type { IIncomingVideo } from '../entities/incomingVideo.ts'
import type { IIncomingVideoFilters, IIncomingVideoInput } from '../schemas/incomingVideo.ts'

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

const COLUMNS = 'id, telegram_message_id, caption, language, is_processed, created_at, updated_at'

async function getVideos(filters: IIncomingVideoFilters): Promise<IIncomingVideo[]> {
	const values: unknown[] = []
	const conditions: string[] = []

	if (filters) {
		if (filters.is_processed !== undefined) {
			values.push(filters.is_processed)
			conditions.push(`is_processed = $${values.length}`)
		}
	}

	const whereClause = conditions.length > 0 ? ` where ${conditions.join(' and ')}` : ''
	const sortBy = filters?.sort_by ? SORT_COLUMNS[filters.sort_by] : undefined
	const sortDirection = filters?.sort_direction ? SORT_DIRECTIONS[filters.sort_direction] : undefined
	const orderByClause = sortBy
		? ` order by ${sortBy} ${sortDirection ?? DEFAULT_SORT_DIRECTION}`
		: ` order by ${DEFAULT_SORT_COLUMN}`

	const result = await pool.query(`SELECT ${COLUMNS} from incoming_videos${whereClause}${orderByClause}`, values)
	return result.rows
}

async function markVideoAsProcessed(telegramMessageId: number) {
	const result = await pool.query(
		`UPDATE incoming_videos SET is_processed = true WHERE telegram_message_id = $1 RETURNING ${COLUMNS}`,
		[telegramMessageId],
	)
	return result.rows[0]
}

async function saveIncomingVideo(data: IIncomingVideoInput): Promise<IIncomingVideoInput> {
	const query = 'INSERT INTO incoming_videos (telegram_message_id, caption, language, is_processed) Values ($1, $2, $3, $4)'
	const values = [data.telegram_message_id, data.caption, data.language, data.is_processed]
	const result = await pool.query(query, values)
	return result.rows[0]
}

async function deleteIncomingVideo(id: number): Promise<{ id: number } | undefined> {
	const result = await pool.query('DELETE FROM incoming_videos WHERE id = $1 RETURNING id', [id])
	return result.rows[0]
}

const videosRepository = {
	getVideos,
	markVideoAsProcessed,
	saveIncomingVideo,
	deleteIncomingVideo,
}

export { videosRepository }
