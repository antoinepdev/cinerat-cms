import type { IMovieInput } from '../schemas/movie.ts'

const TELEGRAM_CAPTION_CHARACTER_LIMIT = 1024
const ELLIPSIS = '...'

export async function getPosterCaption(movie: IMovieInput): Promise<string> {
	const { title_en, title_cas, title_lat, year, description } = movie
	const availableTitles = [title_en, title_cas, title_lat].filter(Boolean)

	const fullCaption = `${availableTitles.join(' | ')}\n${year}\n\n${description}`
	if (fullCaption.length > TELEGRAM_CAPTION_CHARACTER_LIMIT) {
		const posterCaption = `${fullCaption.slice(0, TELEGRAM_CAPTION_CHARACTER_LIMIT - ELLIPSIS.length)}${ELLIPSIS}`
		return posterCaption
	}
	return fullCaption
}
