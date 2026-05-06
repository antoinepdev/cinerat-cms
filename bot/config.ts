import TelegramBot from "node-telegram-bot-api"

// env
const botToken = process.env.BOT_TOKEN
const groupContainerId = Number(process.env.GROUP_CONTAINER_ID)
const groupTestingId = Number(process.env.GROUP_TESTING_ID)
if (!botToken) { throw new Error('BOT_TOKEN env variable not provided') }
// if (!groupContainerId) { throw new Error('GROUP_CONTAINER_ID env variable not provided') }
// if (!groupTestingId) { throw new Error('GROUP_TESTING_ID env variable not provided') }

// config bot
const bot = new TelegramBot(botToken, {
  polling: true,
  request: {
    agentOptions: {
      keepAlive: true,
      family: 4
    },
    url: "https://api.telegram.org",
  }
})

// errors
bot.on("polling_error", (_) => { })

console.log('Bot ready...')
export { bot, groupContainerId, groupTestingId }
