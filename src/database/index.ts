import { Pool } from "pg"

const pool = new Pool({
  port: Number(process.env.DATABASE_PORT) || 5432,
  host: process.env.DATABASE_HOST || 'localhost',
  database: process.env.DATABASE_NAME,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
})

export { pool }
