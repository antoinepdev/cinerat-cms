import type { Response, Request } from "express"
import { pool } from "../../database.ts"

export async function getRawMovies(_: Request, res: Response) {
  const result1 = await pool.query(' SELECT * FROM raw_movies_es;')
  const result2 = await pool.query(' SELECT * FROM raw_movies_mx;')
  const movies = [...result1.rows, ...result2.rows]

  return res.status(200).json(movies)
}
