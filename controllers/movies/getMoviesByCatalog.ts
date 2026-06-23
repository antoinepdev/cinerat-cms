import type { Response, Request } from "express"
import {pool} from '../../database.ts'
import type { Movie, MovieWithoutCriticalData } from "../../models/movie"

export async function getMoviesByCatalog (req: Request, res: Response) {
  const {catalog_name, catalog_version} = req.params

  try {
    const result = await pool.query('SELECT * FROM movies WHERE (catalog_name = $1 AND catalog_version = $2) ORDER BY "title_en"', [catalog_name, catalog_version])
    const movies: Movie[] = result.rows

    const moviesWithoutCriticalData: MovieWithoutCriticalData[] = movies.map(
      ({
        title_en,
        title_cas,
        title_lat,
        year,
        description,
        language_cas,
        language_lat,
        poster,
        catalog_name,
        catalog_version
      }) => {

      const movie: MovieWithoutCriticalData = {
      title_en,
      title_cas,
      title_lat,
      year,
      description,
      language_cas,
      language_lat,
      poster,
      catalog_name,
      catalog_version
      }
      return movie
    })

    return res.status(200).json(moviesWithoutCriticalData)

  } catch (error) {
    console.error('Error al obtener las peliculas: ' + error )
    return res.status(500).json({error: 'Internal server error'})
  }

}
