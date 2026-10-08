import TelegramBot from 'node-telegram-bot-api'

const BOT_TOKEN = process.env.BOT_TOKEN
const MOVIE_CONTAINER_GROUP_ID = Number(process.env.MOVIE_CONTAINER_GROUP_ID)
const MOVIE_LISTENER_GROUP_ID = Number(process.env.MOVIE_LISTENER_GROUP_ID)
const SERIES_CONTAINER_GROUP_ID = Number(process.env.SERIES_CONTAINER_GROUP_ID)
const SERIES_LISTENER_GROUP_ID = Number(process.env.SERIES_LISTENER_GROUP_ID)
const parsedSendDelayMs = Number(process.env.SERIES_SEND_DELAY_MS ?? 1000)
const SERIES_SEND_DELAY_MS = Number.isFinite(parsedSendDelayMs) && parsedSendDelayMs >= 0 ? parsedSendDelayMs : 1000
const parsedSendMaxAttempts = Number(process.env.SERIES_SEND_MAX_ATTEMPTS ?? 3)
const SERIES_SEND_MAX_ATTEMPTS = Number.isInteger(parsedSendMaxAttempts) && parsedSendMaxAttempts >= 1 ? parsedSendMaxAttempts : 3
if (!BOT_TOKEN) {
	throw new Error('BOT_TOKEN env variable not provided')
}
if (!MOVIE_CONTAINER_GROUP_ID) {
	throw new Error('MOVIE_CONTAINER_GROUP_ID env variable not provided')
}
if (!MOVIE_LISTENER_GROUP_ID) {
	throw new Error('MOVIE_LISTENER_GROUP_ID env variable not provided')
}
if (!SERIES_CONTAINER_GROUP_ID) {
	throw new Error('SERIES_CONTAINER_GROUP_ID env variable not provided')
}
if (!SERIES_LISTENER_GROUP_ID) {
	throw new Error('SERIES_LISTENER_GROUP_ID env variable not provided')
}

const bot = new TelegramBot(BOT_TOKEN, {
	polling: true,
	request: {
		agentOptions: {
			keepAlive: true,
			family: 4,
		},
		url: 'https://api.telegram.org',
	},
})

bot.on('polling_error', (_) => {})

export {
	bot,
	MOVIE_CONTAINER_GROUP_ID,
	MOVIE_LISTENER_GROUP_ID,
	SERIES_CONTAINER_GROUP_ID,
	SERIES_LISTENER_GROUP_ID,
	SERIES_SEND_DELAY_MS,
	SERIES_SEND_MAX_ATTEMPTS,
}
