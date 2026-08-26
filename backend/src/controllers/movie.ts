import type { NextFunction, Request, Response } from 'express'
import { movieService } from '../services/movies.ts'

async function getTelegramMovieHandler(_: Request, res: Response) {
	try {
		const telegramMovies = await movieService.getTelegramMovies()
		return res.status(200).json(telegramMovies)
	} catch (error) {
		console.log(error)
		return res.status(500).json({ error: error.message })
	}
}

async function getMoviesHandler(req: Request, res: Response) {
	try {
		const filters = req.filteredQuery
		const movies = await movieService.getMovies(filters)
		return res.status(200).json(movies)
	} catch (error) {
		return res.status(500).json({ error: error.message })
	}
}

async function saveMovieHandler(req: Request, res: Response, next: NextFunction) {
	try {
		const movie = await movieService.saveMovie(req.body)
		return res.status(201).json(movie)
	} catch (error) {
		next(error)
	}
}

async function updateMovieHandler(req: Request, res: Response, next: NextFunction) {
	try {
		const updatedMovie = await movieService.updateMovie(req.body)
		return res.status(201).json(updatedMovie)
	} catch (error) {
		next(error)
	}
}

const movieController = {
	getTelegramMovieHandler,
	getMoviesHandler,
	saveMovieHandler,
	updateMovieHandler,
}

export { movieController }
