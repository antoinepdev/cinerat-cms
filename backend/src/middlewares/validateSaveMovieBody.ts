import type { Request, Response, NextFunction } from 'express'
import { MovieSchema, type IMovieInput } from '../schemas/movie.ts'


export async function validateSaveMovieBody (req: Request, res: Response, next: NextFunction) {
  const result = MovieSchema.safeParse(req.body)

  if (!result.success) {
    return res.status(400).json({ error: 'Invalidated Body' })
  }

  req.body = result.data
  const body: IMovieInput = req.body

  if (!body.language_cas && !body.language_lat) return res.status(400).json({ error: 'You need specify one language at latest' })
  if (!body.telegram_file_id_cas && !body.telegram_file_id_lat) return res.status(400).json({ error: 'You need specify one telegram file id at latest' })

  next()
}
