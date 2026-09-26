CREATE TABLE movies (
    id SERIAL PRIMARY KEY,
    title_en TEXT NOT NULL,
    title_cas TEXT,
    title_lat TEXT,
    year SMALLINT NOT NULL CHECK ( year > 1900 AND year <= 2026),
    telegram_file_id_cas INT UNIQUE,
    telegram_file_id_lat INT UNIQUE,
    language_cas BOOLEAN DEFAULT FALSE,
    language_lat BOOLEAN DEFAULT FALSE,
    catalog_name TEXT NOT NULL DEFAULT 'standard',
    catalog_version SMALLINT NOT NULL,
    quality TEXT,
    poster TEXT NOT NULL UNIQUE CHECK ( poster ~ '^https:\/\/.+' ),
    telegram_poster_id INT NOT NULL,
    telegram_container_group_id BIGINT NOT NULL,
    description TEXT NOT NULL,
    tmdb_id INT NOT NULL UNIQUE,
    popularity FLOAT NOT NULL,
    backdrop_path TEXT NOT NULL UNIQUE CHECK ( backdrop_path ~ '^https:\/\/.+' ),
    genres TEXT[] NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER movies_set_updated_at
BEFORE UPDATE ON movies
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE incoming_videos (
    id SERIAL PRIMARY KEY,
    telegram_message_id INT NOT NULL UNIQUE,
    caption TEXT NOT NULL,
    language TEXT NOT NULL CHECK (language IN ('latino', 'castellano')),
    is_processed BOOLEAN DEFAULT FALSE
);
