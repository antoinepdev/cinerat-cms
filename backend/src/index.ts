import { createIncomingEpisodeListener } from './listeners/incomingEpisodes.ts'
import { createIncomingVideoListener } from './listeners/incomingVideos.ts'
import { createSeriesCommandsListener } from './listeners/seriesCommands.ts'
import { bot, MOVIE_LISTENER_GROUP_ID, SERIES_LISTENER_GROUP_ID, seriesBot } from './provider/telegram.ts'
import { incomingEpisodesRepository } from './repositories/incomingEpisode.ts'
import { videosRepository } from './repositories/videos.ts'
import { app } from './server.ts'
import { createSeriesBatchStore } from './state/seriesBatch.ts'

const seriesBatchStore = createSeriesBatchStore()

createIncomingVideoListener({
	bot,
	groupId: MOVIE_LISTENER_GROUP_ID,
	saveIncomingVideo: videosRepository.saveIncomingVideo,
})

createSeriesCommandsListener({
	bot: seriesBot,
	groupId: SERIES_LISTENER_GROUP_ID,
	batchStore: seriesBatchStore,
})

createIncomingEpisodeListener({
	bot: seriesBot,
	groupId: SERIES_LISTENER_GROUP_ID,
	getBatch: seriesBatchStore.get,
	saveIncomingEpisode: incomingEpisodesRepository.saveIncomingEpisode,
	sendMessage: seriesBot.sendMessage.bind(seriesBot),
})

const port = app.get('port')
app.listen(port, (_) => console.log(`Server listen on port ${port}`))
