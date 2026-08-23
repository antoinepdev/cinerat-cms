import type { IMovieFilters } from '../schemas/movie.ts'

declare global {
	namespace Express {
		interface Request {
			filteredQuery: IMovieFilters
		}
	}
}
