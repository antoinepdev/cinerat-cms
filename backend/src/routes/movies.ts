import { Router } from 'express'
import { movieController } from '../controllers/movie.ts'
import { errorHandler } from '../middlewares/errorHandler.ts'
import { validateGetMoviesQueryParams } from '../middlewares/validateGetMoviesQueryParams.ts'
import { validateSaveMovieBody } from '../middlewares/validateSaveMovieBody.ts'
import { validateUpdateMovieBody } from '../middlewares/validateUpdateMovieBody.ts'

const router = Router()
router.get('/telegram', movieController.getTelegramMovieHandler)
router.get('/', validateGetMoviesQueryParams, movieController.getMoviesHandler)
router.post('/', validateSaveMovieBody, movieController.saveMovieHandler, errorHandler)
router.patch('/', validateUpdateMovieBody, movieController.updateMovieHandler, errorHandler)

export { router as moviesRouter }
