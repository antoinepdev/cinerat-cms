export interface ISeriesToSave {
	tmdb_id: number
	title_en: string
	title_cas: string
	title_lat: string
	year: number
	poster: `https://image.tmdb.org/${string}.jpg`
	description: string
	popularity: number
	backdrop_path: `https://image.tmdb.org/${string}.jpg`
	genres: string[]
}

export interface ISeries extends ISeriesToSave {
	id: number
	created_at: Date
	updated_at: Date
}

export interface ISeriesFilters {
	tmdb_id?: number
}
