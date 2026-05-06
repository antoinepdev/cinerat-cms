import { bot, groupContainerId, groupTestingId } from "./config.ts"
import { pool } from "../database.ts"
import { toPascalCase } from "./helpers/toPascalCase.ts"
import { cleanText } from "./helpers/cleanText.ts"
import type { RawMovie } from "../models/movie.ts"


bot.on('video', async msg => {
  if (msg.chat.id !== groupContainerId) return
  if (!msg.video) return
  if (!msg.caption) return

  function guessLanguage(text: string): 'español latino 🇲🇽' | 'español castellano 🇪🇸' | undefined {
    const hasMxFlag = text.includes('🇲🇽');
    const hasLatinoWord = text.toLowerCase().includes('latino')
    if (hasLatinoWord || hasMxFlag) return 'español latino 🇲🇽'
    const hasEsFlag = text.includes('🇪🇸');
    const hasCastellanoWord = text.toLowerCase().includes('castellano')
    if (hasCastellanoWord || hasEsFlag) return 'español castellano 🇪🇸'
    return undefined
  }

  const language = guessLanguage(msg.caption)
  if (!language) return await bot.deleteMessage(groupContainerId, msg.message_id)
  const cleanedText = cleanText(msg.caption)
  if (cleanedText === '') return

  const movie: RawMovie = {
    fileId: msg.message_id,
    text: toPascalCase(cleanedText),
    language,
    is_saved: false
  }

  console.log(movie)
  try {
    if (movie.language === 'español latino 🇲🇽') {
      await pool.query(
        'INSERT INTO raw_movies_mx (file_id, text, language, is_saved) VALUES ($1, $2, $3, $4)',
        [movie.fileId, movie.text, movie.language, movie.is_saved]
      )
    } else if (movie.language === 'español castellano 🇪🇸') {
      await pool.query(
        'INSERT INTO raw_movies_es (file_id, text, language, is_saved) VALUES ($1, $2, $3, $4)',
        [movie.fileId, movie.text, movie.language, movie.is_saved]
      )
    }
  } catch (error) {
    console.error(`Ha ocurrido un error al insertar la raw movie: ${error}`)
  }
})

