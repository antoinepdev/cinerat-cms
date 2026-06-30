import { z } from "zod";

const MovieSchema = z.object({
  title_en: z.string(),
  title_cas: z.string().optional(),
  title_lat: z.string().optional(),
  year: z.number().int().positive(),
  language_cas: z.boolean().optional(),
  language_lat: z.boolean().optional(),
  quality: z.enum(["cam", "720"]).optional(),
  poster: z.string().startsWith("https://"),
  description: z.string(),
  telegram_file_id_cas: z.number().int().optional(),
  telegram_file_id_lat: z.number().int().optional(),
  catalog_name: z.string(),
  catalog_version: z.number().int().positive()
})

const TelegramMovieSchema = z.object({
  file_id: z.number().int().positive(),
  message_text: z.string(),
  language: z.enum(["latino", "castellano"]),
  is_saved: z.boolean(),
})

export type IMovieInput = z.infer<typeof MovieSchema>
export type ITelegramMovieInput = z.infer<typeof TelegramMovieSchema>;