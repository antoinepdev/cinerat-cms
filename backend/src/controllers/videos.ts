import type { Request, Response } from 'express'
import { videoService } from '../services/videos.ts'

async function getPendingVideosHandler(_: Request, res: Response) {
	const pendingVideos = await videoService.getPendingVideos()
	return res.status(200).json(pendingVideos)
}

const videoController = {
	getPendingVideosHandler,
}

export { videoController }
