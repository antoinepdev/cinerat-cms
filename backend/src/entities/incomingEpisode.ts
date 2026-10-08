export interface IIncomingEpisodeToSave {
	message_id: number
	caption: string
	episode_number: number
	season: number
	language: 'latino' | 'castellano' | null
	is_processed: boolean
}

export interface IIncomingEpisode extends IIncomingEpisodeToSave {
	id: number
	created_at: Date
	updated_at: Date
}
