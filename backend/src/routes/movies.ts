import { Router } from 'express'
import { movieController } from '../controllers/movie.ts'
import { validateGetMoviesQueryParams } from '../middlewares/validateGetMoviesQueryParams.ts'
import { validateSaveMovieBody } from '../middlewares/validateSaveMovieBody.ts'
import { validateUpdateMovieBody } from '../middlewares/validateUpdateMovieBody.ts'

const router = Router()
router.get('/telegram', movieController.getPendingVideosHandler)
router.get('/', validateGetMoviesQueryParams, movieController.getMoviesHandler)
router.post('/', validateSaveMovieBody, movieController.saveMovieHandler)
router.patch('/', validateUpdateMovieBody, movieController.updateMovieHandler)

export { router as moviesRouter }
