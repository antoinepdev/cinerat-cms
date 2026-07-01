import { pool } from "../database/index.ts"
import type { IMovie, IMovieToSave, ITelegramMovie } from "../entities/movie.ts"

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

async function saveMovie (data: IMovieToSave): Promise<IMovie> {
  const query = ` INSERT INTO movies ( title_en, title_cas, title_lat, year, poster, language_cas, language_lat, quality, description, telegram_file_id_cas, telegram_file_id_lat, telegram_poster_id, catalog_name, catalog_version ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING title_en, title_cas, title_lat, year, poster, language_cas, language_lat, quality, description, telegram_file_id_cas, telegram_file_id_lat, telegram_poster_id, catalog_name, catalog_version `;
    const values = [data.title_en, data.title_cas, data.title_lat, data.year, data.poster, data.language_cas, data.language_lat, data.quality, data.description, data.telegram_file_id_cas, data.telegram_file_id_lat, data.telegram_poster_id, data.catalog_name, data.catalog_version]
  const result = await pool.query(query, values)
  return result.rows[0]
}

async function updateTelegramMovie (file_id: number) {
  const result = await pool.query('UPDATE telegram_movies SET is_saved = true WHERE file_id = $1 RETURNING *', [file_id])
  return result.rows[0]
}

const movieRepository = {
  getTelegramMovies,
  getMovies,
  saveMovie,
  updateTelegramMovie,
}

export { movieRepository }
