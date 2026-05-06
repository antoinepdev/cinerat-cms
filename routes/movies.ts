import { Router } from "express";
import { getRawMovies } from "../controllers/movies/getRawMovies.ts";
import { validateMovieBody } from "../middleware/validateMovieBody.ts"
import { saveMovie } from "../controllers/movies/saveMovie.ts"
const router = Router()

router.post('/', validateMovieBody, saveMovie)
router.get('/raw', getRawMovies)

export { router as moviesRouter }

