import { createIncomingVideoListener } from './listeners/incomingVideos.ts'
import { bot, MOVIE_LISTENER_GROUP_ID } from './provider/telegram.ts'
import { videosRepository } from './repositories/videos.ts'
import { app } from './server.ts'

createIncomingVideoListener({
	bot,
	groupId: MOVIE_LISTENER_GROUP_ID,
	saveIncomingVideo: videosRepository.saveIncomingVideo,
})

const port = app.get('port')
app.listen(port, (_) => console.log(`Server listen on port ${port}`))
