import { Router } from "express"
import { movieController } from "../controllers/movie.ts"
// import { validateMovieBody } from "../middleware/validateMovieBody.ts";
// import { saveMovie } from "../controllers/movies/saveMovie.ts";

const router = Router();
router.get("/telegram", movieController.getTelegramMovieHandler);
router.get("/", movieController.getMoviesHandler);
// router.post("/", validateMovieBody, saveMovie);

export { router as moviesRouter };
