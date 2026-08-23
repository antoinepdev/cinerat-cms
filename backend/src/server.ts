import cors from 'cors'
import Express from 'express'
import { moviesRouter } from './routes/movies.ts'

const app = Express()

// settings
app.set('port', process.env.PORT || 4000)
app.use(Express.json())
app.use(cors())

// routes
app.use('/movies', moviesRouter)

export { app }
