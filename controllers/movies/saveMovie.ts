import type { Response, Request } from "express"
import { saveEsMovieQuery, saveMxMovieQuery, type Movie } from "../../models/movie.ts"
import { pool } from "../../database.ts"
import { sendPosterToGroupContainer } from "../../bot/helpers/sendPosterToGroupContainer.ts"
import { sendMovieToGroupContainer } from "../../bot/helpers/sendMovieToGroupContainer.ts"
import { groupContainerId } from "../../bot/config.ts"

export async function saveMovie(req: Request, res: Response) {
  const body: Movie = req.body

  const posterCaption = `${body.title} | ${body.titleEs}\n${body.year}\n\n${body.description}`
  const telegramPosterId: number | null = await sendPosterToGroupContainer(body.posterUrl, posterCaption)
  if (!telegramPosterId) return res.status(400).json({ error: 'Ha ocurrido un error al enviar el poster al grupo contenedor' })
  const movie = { ...body, telegramPosterId }

  const movieCaption = `${movie.title} | ${movie.titleEs}\n${movie.year}\n${movie.language}`
  const telegramFileId: number | null = await sendMovieToGroupContainer(movie.telegramFileId, movieCaption)
  const oldTelegramFileId = movie.telegramFileId

  if (!telegramFileId) return res.status(400).json({ error: 'Ha ocurrido un error al enviar la peli al grupo contenedor' })
  movie.telegramFileId = telegramFileId

  try {
    const values = [
      movie.title,
      movie.titleEs,
      movie.year,
      movie.posterUrl,
      movie.language,
      movie.quality,
      movie.description,
      movie.telegramFileId,
      movie.telegramPosterId,
      groupContainerId,
      movie.catalog
    ];

    const result = movie.language === 'español latino 🇲🇽' ? await pool.query(saveMxMovieQuery, values) : await pool.query(saveEsMovieQuery, values)
    const insertedId = result.rows[0].id

    try {
      movie.language === 'español latino 🇲🇽' ?
        await pool.query('UPDATE raw_movies_mx SET is_saved = true WHERE file_id = $1', [oldTelegramFileId])
        :
        await pool.query('UPDATE raw_movies_es SET is_saved = true WHERE file_id = $1', [oldTelegramFileId])
    } catch (error) {

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
