import { pool } from "../database/index.ts"
import type { ITelegramMovie } from "../entities/movie.ts"

async function getTelegramMovies (): Promise<ITelegramMovie[]> {
  const query = 'SELECT * FROM telegram_movies'
  const result = await pool.query(query)
  return result.rows
}

const movieRepository = {
  getTelegramMovies
}

export { movieRepository }
