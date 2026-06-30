import { pool } from "../database/index.ts"
import type { IMovie, ITelegramMovie } from "../entities/movie.ts"

async function getTelegramMovies (): Promise<ITelegramMovie[]> {
  const query = 'SELECT * FROM telegram_movies'
  const result = await pool.query(query)
  return result.rows
}

async function getMovies (): Promise<IMovie[]> {
  const query = 'SELECT * FROM movies'
  const result = await pool.query(query)
  return result.rows
}

const movieRepository = {
  getTelegramMovies,
  getMovies,
}

export { movieRepository }
