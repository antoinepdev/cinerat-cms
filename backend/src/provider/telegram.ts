import TelegramBot from 'node-telegram-bot-api'

const BOT_TOKEN = process.env.BOT_TOKEN
const MOVIE_CONTAINER_GROUP_ID = Number(process.env.MOVIE_CONTAINER_GROUP_ID)
const MOVIE_LISTENER_GROUP_ID = Number(process.env.MOVIE_LISTENER_GROUP_ID)
if (!BOT_TOKEN) {
	throw new Error('BOT_TOKEN env variable not provided')
}
if (!MOVIE_CONTAINER_GROUP_ID) {
	throw new Error('MOVIE_CONTAINER_GROUP_ID env variable not provided')
}
if (!MOVIE_LISTENER_GROUP_ID) {
	throw new Error('MOVIE_LISTENER_GROUP_ID env variable not provided')
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

export { bot, MOVIE_CONTAINER_GROUP_ID, MOVIE_LISTENER_GROUP_ID }
