import type { Response, Request } from "express";
import { pool } from "../../database.ts";

export async function getTelegramMovies(_: Request, res: Response) {
  const result = await pool.query( " SELECT * FROM telegram_movies where (is_saved = false);",);
  const movies = result.rows

  return res.status(200).json(movies);
}
