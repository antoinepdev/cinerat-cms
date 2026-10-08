import { Router } from 'express'
import { episodeController } from '../controllers/episodes.ts'
import { validateSaveSeriesWithEpisodesBody } from '../middlewares/validateSaveSeriesWithEpisodesBody.ts'

const router = Router()
router.post('/', validateSaveSeriesWithEpisodesBody, episodeController.saveSeriesWithEpisodesHandler)

export { router as seriesRouter }
