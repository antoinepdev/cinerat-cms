import type { Request, Response, NextFunction } from 'express'
import { MovieFiltersSchema } from '../schemas/movie.ts'


export async function validateGetMoviesQueryParams (req: Request, res: Response, next: NextFunction) {
  const result = MovieFiltersSchema.safeParse(req.query)

  if (!result.success) {
    return res.status(400).json({ error: 'Invalidated query params' })
  }

  req.filteredQuery = result.data
  const query = req.filteredQuery

  if (query?.catalog_version) {
     if (!query?.catalog_name)  return res.status(400).json({ error: 'If you use catalog_version filter you need also specify catalog_name filter'})
  }
  next()
}