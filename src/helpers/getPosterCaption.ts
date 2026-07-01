import type { IMovieInput } from "../schemas/movie.ts"

export async function getPosterCaption (movie: IMovieInput): Promise<string> {
  const {title_en, title_cas, title_lat, year, description} = movie
  const availableTitles = [title_en, title_cas, title_lat].filter(Boolean)

  const posterCaption = `${availableTitles.join(' | ')}\n${year}\n\n${description}`
  return posterCaption
}
