import { movieRepository } from "../../repositories/movie.ts"
import type { IMovieFilters } from '../../schemas/movie.ts'

export async function getMovies (filters: IMovieFilters) {
  try {
      const movies = await movieRepository.getMovies(filters)
      return movies
  }
  catch (error) {
    console.log(error)
    throw new Error('Internal server error')
  }
}