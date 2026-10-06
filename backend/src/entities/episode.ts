export interface IEpisodeToSave {
	episode_number: number
	season: number
	language_cas: boolean
	language_lat: boolean
	telegram_file_id_cas: number
	telegram_file_id_lat: number
}

export interface IEpisode extends IEpisodeToSave {
	id: number
	series_id: number
	created_at: Date
	updated_at: Date
}

export interface IEpisodeToUpdate extends IEpisodeToSave {
	id: number
}

export interface IEpisodeFilters {
	series_id: number
}
