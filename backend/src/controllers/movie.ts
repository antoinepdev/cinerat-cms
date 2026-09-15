import type { Request, Response } from 'express'
import { movieService } from '../services/movies.ts'

async function getMoviesHandler(req: Request, res: Response) {
	const filters = req.filteredQuery
	const movies = await movieService.getMovies(filters)
	return res.status(200).json(movies)
}

async function saveMovieHandler(req: Request, res: Response) {
	const movie = await movieService.saveMovie(req.body)
	return res.status(201).json(movie)
}

async function updateMovieHandler(req: Request, res: Response) {
	const updatedMovie = await movieService.updateMovie(req.body)
	return res.status(200).json(updatedMovie)
}

const movieController = {
	getMoviesHandler,
	saveMovieHandler,
	updateMovieHandler,
}

export { movieController }
