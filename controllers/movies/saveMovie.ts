import type { Response, Request } from "express"
import { saveMovieQuery, type Movie } from "../../models/movie.ts"
import { pool } from "../../database.ts"
import { sendPosterToGroupContainer } from "../../bot/helpers/sendPosterToGroupContainer.ts"
import { sendMovieToGroupContainer } from "../../bot/helpers/sendMovieToGroupContainer.ts"
import { groupContainerId } from "../../bot/config.ts"

export async function saveMovie(req: Request, res: Response) {
  const body: Movie = req.body
  const {title_en, title_cas, title_lat,  year, description, poster, quality, catalog_name, catalog_version, language_cas, language_lat} = body
  let {telegram_file_id_cas, telegram_file_id_lat} = body

  const allTitles = [title_en, title_cas, title_lat]
  let availableTitles: string[] = []
  allTitles.forEach(title => {if (title) return availableTitles.push(title)})

  const posterCaption = `${availableTitles.join(' | ')}\n${year}\n\n${description}`
  const telegramPosterId: number | null = await sendPosterToGroupContainer(poster, posterCaption)
  if (!telegramPosterId) return res.status(400).json({ error: 'Ha ocurrido un error al enviar el poster al grupo contenedor' })

  const old_telegram_file_id_cas = telegram_file_id_cas
  const old_telegram_file_id_lat = telegram_file_id_lat

  try {
    if (telegram_file_id_cas) {
      const movieCaption = `${availableTitles.join(' | ')}\n${year}\n${description}\n"español castellano 🇪🇸"`
      telegram_file_id_cas = await sendMovieToGroupContainer(telegram_file_id_cas, movieCaption)
    }

    if (telegram_file_id_lat) {
      const movieCaption = `${availableTitles.join(' | ')}\n${year}\n${description}\n"español latino 🇲🇽"`
      telegram_file_id_lat = await sendMovieToGroupContainer(telegram_file_id_lat, movieCaption)
    }
  } catch (error) {
    console.error(error)
    return res.status(400).json({ error: 'Ha ocurrido un error al enviar la peli al grupo contenedor' })
  }

  const movie = {
    title_en,
    title_cas: title_cas || null,
    title_lat: title_lat || null,
    year,
    poster,
    language_cas: language_cas || null,
    language_lat: language_lat || null,
    quality: quality || null,
    description,
    telegram_file_id_cas: telegram_file_id_cas || null,
    telegram_file_id_lat: telegram_file_id_lat || null,
    telegramPosterId,
    catalog_name,
    catalog_version,
    groupContainerId,
  }

  try {
    const values = Object.values(movie)
    const result = await pool.query(saveMovieQuery, values)
    const insertedId = result.rows[0].id

    try {
      const file_ids: number[] = []
      if (old_telegram_file_id_cas) file_ids.push(old_telegram_file_id_cas)
      if (old_telegram_file_id_lat) file_ids.push(old_telegram_file_id_lat)

      file_ids.forEach(async file_id => {
        await pool.query('UPDATE telegram_movies SET is_saved = true WHERE file_id = $1', [file_id])
      })
    } catch (error) {
      console.error('Error al actualizar la telegram_movies con poster: ' + poster + ' error: ' + error)
    }

    return res.status(201).json({
      id: insertedId,
      ...movie,
    });
  } catch (error) {
    console.error(`Ha ocurrido un error al insertar la pelicula ${error}`)
    return res.status(500).json({ error: 'Error interno del servidor al insertar pelicula' });
  }
}
