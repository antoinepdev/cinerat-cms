import { bot, groupContainerId } from '../config.ts'

export async function sendPosterToGroupContainer(posterUrl: string, caption: string): Promise<number | null> {
	try {
		const sendedPoster = await bot.sendPhoto(groupContainerId, posterUrl, { caption })
		const telegramPosterId = sendedPoster.message_id
		return telegramPosterId
	} catch (error) {
		console.error(`Error al intentar enviar el poster al grupo contenedor: ${error}`)
		return null
	}
}
