import type { Request, Response } from 'express'
import { episodeService } from '../services/episodes.ts'

async function saveSeriesWithEpisodesHandler(req: Request, res: Response) {
	await episodeService.saveSeriesWithEpisodes(req.body)
	return res.status(201).send()
}

const episodeController = {
	saveSeriesWithEpisodesHandler,
}

export { episodeController }
