import { videosRepository } from '../repositories/videos.ts'

async function getPendingVideos() {
	const pendingVideos = await videosRepository.getPendingVideos()
	return pendingVideos
}

export const videoService = {
	getPendingVideos,
}
