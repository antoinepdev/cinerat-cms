import cors from 'cors'
import Express from 'express'
import { errorHandler } from './middlewares/errorHandler.ts'
import { moviesRouter } from './routes/movies.ts'
import { videosRouter } from './routes/videos.ts'

const app = Express()

// settings
app.set('port', process.env.PORT || 4000)
app.use(Express.json())
app.use(cors())

// routes
app.use('/movies', moviesRouter)
app.use('/videos', videosRouter)

app.use(errorHandler)

export { app }
