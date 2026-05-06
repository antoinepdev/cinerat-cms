import type { Request, Response, NextFunction } from 'express'
import { MovieSchema } from '../models/movie.ts'


export function validateMovieBody(req: Request, res: Response, next: NextFunction) {
  const result = MovieSchema.safeParse(req.body)

  if (!result.success) {
    return res.status(400).json({
      error: 'Body inválido',
      details: result.error,
    });
  }
  next();
}
