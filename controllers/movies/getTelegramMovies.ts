import type { Response, Request } from "express";
import { pool } from "../../database.ts";

export async function getTelegramMovies(_: Request, res: Response) {
  const result1 = await pool.query(
    " SELECT * FROM raw_movies_es where (is_saved = false);",
  );
  const result2 = await pool.query(
    " SELECT * FROM raw_movies_mx where (is_saved = false);",
  );
  const movies = [...result1.rows, ...result2.rows];

  return res.status(200).json(movies);
}
