import { app } from "./server.ts"
import './listeners/telegramMovies.ts'

const port = app.get('port')
app.listen(port, (_) => console.log(`Server listen on port ${port}`))
