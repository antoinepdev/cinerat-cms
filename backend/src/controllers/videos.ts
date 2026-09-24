import type { Request, Response } from 'express'
import { videoService } from '../services/videos.ts'

async function getPendingVideosHandler(_: Request, res: Response) {
	const pendingVideos = await videoService.getPendingVideos()
	return res.status(200).json(pendingVideos)
}

async function deleteIncomingVideoHandler(req: Request, res: Response) {
	const id = req.filteredParams!.id
	await videoService.deleteIncomingVideo(id)
	return res.status(204).send()
}

const videoController = {
	getPendingVideosHandler,
	deleteIncomingVideoHandler,
}

export { videoController }
