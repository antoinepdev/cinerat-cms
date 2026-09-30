import { videosRepository } from '../repositories/videos.ts'
import type { IIncomingVideoFilters } from '../schemas/incomingVideo.ts'
import { NotFoundError } from '../utils/errors.ts'

async function getVideos(filters: IIncomingVideoFilters) {
	const videos = await videosRepository.getVideos(filters)
	return videos
}

async function deleteIncomingVideo(id: number) {
	const deletedVideo = await videosRepository.deleteIncomingVideo(id)
	if (!deletedVideo) throw new NotFoundError('Incoming video not found')
}

export const videoService = {
	getVideos,
	deleteIncomingVideo,
}
