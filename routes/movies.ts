import { Router } from "express";
import { getTelegramMovies } from "../controllers/movies/getTelegramMovies.ts";
import { validateMovieBody } from "../middleware/validateMovieBody.ts";
import { saveMovie } from "../controllers/movies/saveMovie.ts";
import { getMoviesByCatalog } from "../controllers/movies/getMoviesByCatalog.ts";
const router = Router();

router.post("/", validateMovieBody, saveMovie);
router.get("/:catalog_name/:catalog_version", getMoviesByCatalog);
router.get("/telegram", getTelegramMovies);

export { router as moviesRouter };
