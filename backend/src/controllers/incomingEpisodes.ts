import type { Request, Response } from 'express'
import { incomingEpisodesService } from '../services/incomingEpisodes.ts'

async function getIncomingEpisodesHandler(req: Request, res: Response) {
	const filters = req.filteredEpisodeQuery!
	const episodes = await incomingEpisodesService.getIncomingEpisodes(filters)
	return res.status(200).json(episodes)
}

const incomingEpisodesController = {
	getIncomingEpisodesHandler,
}

export { incomingEpisodesController }
