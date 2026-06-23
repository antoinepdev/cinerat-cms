import type { Response, Request } from "express"
import {pool} from '../../database.ts'
import type { Movie, MovieWithoutCriticalData } from "../../models/movie"

export async function getMoviesByCatalog (req: Request, res: Response) {
  const {catalog, version} = req.params

  try {
    const result = await pool.query('SELECT * FROM movies WHERE (catalog = $1) ORDER BY "title_en"', [`${catalog} v${version}`])
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
        catalog
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
      catalog,
      }
      return movie
    })
    
    return res.status(200).json(moviesWithoutCriticalData)

  } catch (error) {
    console.error('Error al obtener las peliculas: ' + error )
    return res.status(500).json({error: 'Internal server error'})
  }
   
}
