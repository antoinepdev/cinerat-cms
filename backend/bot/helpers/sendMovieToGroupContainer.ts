import { bot, groupContainerId, groupTestingId } from '../config.ts'

export async function sendMovieToGroupContainer(file_id: number, caption: string): Promise<number> {
	const sendedMovie = await bot.copyMessage(groupContainerId, groupTestingId, file_id, { caption })
	return sendedMovie.message_id
}
