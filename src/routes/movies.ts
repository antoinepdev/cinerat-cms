import { Router } from "express"
import { movieController } from "../controllers/movie.ts"
import { validateSaveMovieBody } from "../middlewares/validateSaveMovieBody.ts"
import { errorHandler } from "../middlewares/errorHandler.ts"

const router = Router();
router.get("/telegram", movieController.getTelegramMovieHandler)
router.get("/", movieController.getMoviesHandler)
router.post("/", validateSaveMovieBody, movieController.saveMovieHandler, errorHandler)

export { router as moviesRouter };
