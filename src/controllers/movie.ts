import type { Response, Request } from 'express'
import { getTelegramMovies } from '../services/movies/getTelegramMovies.ts'
import { getMovies } from '../services/movies/getMovies.ts'

async function getTelegramMovieHandler (_: Request, res: Response) {
  try {
    const telegramMovies = await getTelegramMovies()
    return res.status(200).json(telegramMovies)
  }
  catch (error) {
    console.log(error)
    return res.status(500).json({error: error.message})
  }
}

async function getMoviesHandler (_: Request, res: Response) {
  try {
    const movies = await getMovies()
    return res.status(200).json(movies)
  }
  catch (error) {
    console.log(error)
    return res.status(500).json({error: error.message})
  }}

const movieController = {
  getTelegramMovieHandler,
  getMoviesHandler,
}

export { movieController }