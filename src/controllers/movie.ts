import type { Response, Request, NextFunction } from 'express'
import { getTelegramMovies } from '../services/movies/getTelegramMovies.ts'
import { getMovies } from '../services/movies/getMovies.ts'
import { saveMovie } from '../services/movies/saveMovie.ts'

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

async function saveMovieHandler (req: Request, res: Response, next: NextFunction) {
  try {
    const movie = await saveMovie(req.body)
    return res.status(201).json(movie)
  }
  catch (error) {
    next(error)
  }}

const movieController = {
  getTelegramMovieHandler,
  getMoviesHandler,
  saveMovieHandler,
}

export { movieController }