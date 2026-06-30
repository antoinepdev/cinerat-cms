import { Router } from "express"
import { movieController } from "../controllers/movie.ts"
// import { getTelegramMovies } from "../controllers/movies/getTelegramMovies.ts";
// import { validateMovieBody } from "../middleware/validateMovieBody.ts";
// import { saveMovie } from "../controllers/movies/saveMovie.ts";
// import { getMoviesByCatalog } from "../controllers/movies/getMoviesByCatalog.ts";

const router = Router();
router.get("/telegram", movieController.getTelegramMovieHandler);
// router.post("/", validateMovieBody, saveMovie);
// router.get("/:catalog_name/:catalog_version", getMoviesByCatalog);

export { router as moviesRouter };
