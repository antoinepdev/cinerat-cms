import { videosRepository } from '../repositories/videos.ts'
import { NotFoundError } from '../utils/errors.ts'

async function getPendingVideos() {
	const pendingVideos = await videosRepository.getPendingVideos()
	return pendingVideos
}

async function deleteIncomingVideo(id: number) {
	const deletedVideo = await videosRepository.deleteIncomingVideo(id)
	if (!deletedVideo) throw new NotFoundError('Incoming video not found')
}

export const videoService = {
	getPendingVideos,
	deleteIncomingVideo,
}
