import type { IIncomingEpisodeFilters } from '../schemas/incomingEpisode.ts'
import type { IIncomingVideoFilters } from '../schemas/incomingVideo.ts'
import type { IMovieFilters } from '../schemas/movie.ts'

declare global {
	namespace Express {
		interface Request {
			filteredQuery: IMovieFilters
			filteredVideoQuery?: IIncomingVideoFilters
			filteredEpisodeQuery?: IIncomingEpisodeFilters
			filteredParams?: { id: number }
		}
	}
}
