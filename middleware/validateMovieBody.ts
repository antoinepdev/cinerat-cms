import type { Request, Response, NextFunction } from 'express'
import { MovieSchema, type Movie } from '../models/movie.ts'


export function validateMovieBody(req: Request, res: Response, next: NextFunction) {
  const body: Movie = req.body
  const result = MovieSchema.safeParse(body)

  if (!result.success) {
    return res.status(400).json({
      error: 'Body inválido',
      details: result.error,
    });
  }

  if (!body.language_cas && !body.language_lat) return res.status(400).json({ error: 'Necesitas especificar al menos un idioma' })
  if (!body.telegram_file_id_cas && !body.telegram_file_id_lat) return res.status(400).json({ error: 'Necesitas enviar al menos un file_id' })

  next();
}
