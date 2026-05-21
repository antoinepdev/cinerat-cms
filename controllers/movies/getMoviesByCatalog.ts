import type { Response, Request } from "express"
import {pool} from '../../database.ts'
import type { Movie, MovieWithoutCriticalData } from "../../models/movie"

export async function getMoviesByCatalog (req: Request, res: Response) {
  const {catalog, version} = req.params

  try {
    const result1 = await pool.query('SELECT * FROM movies_mx WHERE (catalog = $1) ORDER BY "title"', [`${catalog} v${version}`])
    const result2 = await pool.query('SELECT * FROM movies_es WHERE (catalog = $1) ORDER BY "title"', [`${catalog} v${version}`])
    const movies: Movie[] = [...result1.rows, ...result2.rows]

    const moviesWithoutCriticalData: MovieWithoutCriticalData[] = movies.map(m => {
      const result: MovieWithoutCriticalData = {
      title: m.title,
      title_es: m.title_es,
      year: m.year,
      description: m.description,
      language: [m.language],
      poster: m.poster,
      catalog: m.catalog,
      }
      return result
    })
    
    const formattedMovies = joinSameMoviesWithDiferentLangugesInSameMovieObject(moviesWithoutCriticalData)

    return res.status(200).json(formattedMovies)

  } catch (error) {
    console.error('Error al obtener las peliculas: ' + error )
    return res.status(500).json({error: 'Internal server error'})
  }
   
}

function joinSameMoviesWithDiferentLangugesInSameMovieObject (movieArray: MovieWithoutCriticalData[]):MovieWithoutCriticalData[] {
  const movies: MovieWithoutCriticalData[] = []
  const handledMovies: number[] = []
  
  movieArray.forEach((currentMovie, index)=> {
    if (handledMovies.some(i => i === index)) return
    let hasSameMovieWithDiferentLanguage = false
  
    movieArray.forEach((m, mIndex) => {
      if (m.poster === currentMovie.poster && m.language[0] !== currentMovie.language[0]) {
        handledMovies.push(mIndex)
        hasSameMovieWithDiferentLanguage = true
        movies.push({...currentMovie, language: ['español castellano 🇪🇸', 'español latino 🇲🇽']})
      }
    }) 

    if (!hasSameMovieWithDiferentLanguage) movies.push(currentMovie)
  })

  
  return movies
}
