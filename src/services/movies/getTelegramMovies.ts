import { movieRepository } from "../../repositories/movie.ts"

export async function getTelegramMovies () {
  try {
      const telegramMovies = await movieRepository.getTelegramMovies()
      return telegramMovies
  }
  catch (error) {
    throw new Error('Internal server error')
  }
}