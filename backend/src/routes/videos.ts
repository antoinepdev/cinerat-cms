import { Router } from 'express'
import { videoController } from '../controllers/videos.ts'

const router = Router()
router.get('/pending', videoController.getPendingVideosHandler)

export { router as videosRouter }
