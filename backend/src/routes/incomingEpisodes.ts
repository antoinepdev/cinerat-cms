import { Router } from 'express'
import { incomingEpisodesController } from '../controllers/incomingEpisodes.ts'
import { validateGetIncomingEpisodesQueryParams } from '../middlewares/validateGetIncomingEpisodesQueryParams.ts'

const router = Router()
router.get('/', validateGetIncomingEpisodesQueryParams, incomingEpisodesController.getIncomingEpisodesHandler)

export { router as incomingEpisodesRouter }
