import { Router } from 'express'
import { videoController } from '../controllers/videos.ts'
import { validateGetVideosQueryParams } from '../middlewares/validateGetVideosQueryParams.ts'
import { validateVideoIdParam } from '../middlewares/validateVideoIdParam.ts'

const router = Router()
router.get('/', validateGetVideosQueryParams, videoController.getVideosHandler)
router.delete('/:id', validateVideoIdParam, videoController.deleteIncomingVideoHandler)

export { router as videosRouter }
