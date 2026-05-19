import { Router } from "express";
import { getTelegramMovies } from "../controllers/movies/getTelegramMovies.ts";
import { validateMovieBody } from "../middleware/validateMovieBody.ts";
import { saveMovie } from "../controllers/movies/saveMovie.ts";
import { deleteTelegramMovie } from "../controllers/movies/deleteTelegramMovie.ts";
import { getMovieCatalog } from "../controllers/movies/getMovieCatalog.ts";
const router = Router();

router.post("/", validateMovieBody, saveMovie);
router.get("/standard/:version", getMovieCatalog);
router.get("/telegram", getTelegramMovies);
router.delete("/telegram/:file_id", deleteTelegramMovie);

export { router as moviesRouter };
