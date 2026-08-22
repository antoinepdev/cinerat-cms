import type { IMovieInput } from "../schemas/movie.ts"

export async function getMovieCaption(movie: IMovieInput, language: 'cas' | 'lat'): Promise<string> {
  const { title_en, title_cas, title_lat, year } = movie
  const availableTitles = [title_en, title_cas, title_lat].filter(Boolean)

  let caption = `${availableTitles.join(' | ')}\n${year}`

  if (language === 'cas') caption += "\nEspañol castellano 🇪🇸"
  else if (language === 'lat') caption += "\nEspañol latino 🇲🇽"

  return caption
}