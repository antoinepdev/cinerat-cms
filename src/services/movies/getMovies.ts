import { movieRepository } from "../../repositories/movie.ts"

export async function getMovies () {
  try {
      const movies = await movieRepository.getMovies()
      return movies
  }
  catch (error) {
    throw new Error('Internal server error')
  }
}