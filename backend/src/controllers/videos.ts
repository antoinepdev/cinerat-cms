import type { Request, Response } from 'express'
import { videoService } from '../services/videos.ts'

async function getVideosHandler(req: Request, res: Response) {
	const filters = req.filteredVideoQuery!
	const videos = await videoService.getVideos(filters)
	return res.status(200).json(videos)
}

async function deleteIncomingVideoHandler(req: Request, res: Response) {
	const id = req.filteredParams!.id
	await videoService.deleteIncomingVideo(id)
	return res.status(204).send()
}

const videoController = {
	getVideosHandler,
	deleteIncomingVideoHandler,
}

export { videoController }
