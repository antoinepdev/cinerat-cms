import { createIncomingEpisodeListener } from './listeners/incomingEpisodes.ts'
import { createIncomingVideoListener } from './listeners/incomingVideos.ts'
import { bot, MOVIE_LISTENER_GROUP_ID, SERIES_LISTENER_GROUP_ID, seriesBot } from './provider/telegram.ts'
import { incomingEpisodesRepository } from './repositories/incomingEpisode.ts'
import { videosRepository } from './repositories/videos.ts'
import { app } from './server.ts'

createIncomingVideoListener({
	bot,
	groupId: MOVIE_LISTENER_GROUP_ID,
	saveIncomingVideo: videosRepository.saveIncomingVideo,
})

createIncomingEpisodeListener({
	bot: seriesBot,
	groupId: SERIES_LISTENER_GROUP_ID,
	saveIncomingEpisode: incomingEpisodesRepository.saveIncomingEpisode,
})

const port = app.get('port')
app.listen(port, (_) => console.log(`Server listen on port ${port}`))
