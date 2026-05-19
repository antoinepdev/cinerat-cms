import { z } from "zod";

const MovieSchema = z.object({
  title: z.string(),
  titleEs: z.array(z.string()).min(1),
  year: z.number().int().positive(),
  language: z.enum(["español latino 🇲🇽", "español castellano 🇪🇸"]),
  quality: z.enum(["HD (1040p)", "Copia de cine", "720p", "Indefinida"]),
  posterUrl: z.string().startsWith("https://"),
  description: z.string(),
  telegramFileId: z.number().int(),
  catalog: z.string(),
});

const saveEsMovieQuery = `
      INSERT INTO movies_es (
        title,
        title_es,
        year,
        poster,
        language,
        quality,
        description,
        telegram_file_id,
        telegram_poster_id,
        telegram_container_group_id,
        catalog
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
      )
      RETURNING id
    `;

const saveMxMovieQuery = `
      INSERT INTO movies_mx (
        title,
        title_es,
        year,
        poster,
        language,
        quality,
        description,
        telegram_file_id,
        telegram_poster_id,
        telegram_container_group_id,
        catalog
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
      )
      RETURNING id
    `;
export type Movie = z.infer<typeof MovieSchema>;

const TelegramMovieSchema = z.object({
  fileId: z.number().int().positive(),
  text: z.string(),
  language: z.enum(["español latino 🇲🇽", "español castellano 🇪🇸"]),
  is_saved: z.boolean(),
});

export type TelegramMovie = z.infer<typeof TelegramMovieSchema>;

export { MovieSchema, saveEsMovieQuery, saveMxMovieQuery };
