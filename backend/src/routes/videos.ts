import { Router } from 'express'
import { videoController } from '../controllers/videos.ts'
import { validateVideoIdParam } from '../middlewares/validateVideoIdParam.ts'

const router = Router()
router.get('/pending', videoController.getPendingVideosHandler)
router.delete('/:id', validateVideoIdParam, videoController.deleteIncomingVideoHandler)

export { router as videosRouter }
