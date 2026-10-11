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
    is_processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER incoming_videos_set_updated_at
BEFORE UPDATE ON incoming_videos
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE series (
    id SERIAL PRIMARY KEY,
    title_en TEXT NOT NULL,
    title_cas TEXT,
    title_lat TEXT,
    year SMALLINT NOT NULL CHECK ( year > 1900 AND year <= 2026),
    tmdb_id INT NOT NULL UNIQUE,
    poster TEXT NOT NULL,
    telegram_poster_id INT NOT NULL,
    backdrop_path TEXT NOT NULL,
    description TEXT NOT NULL,
    popularity FLOAT NOT NULL,
    genres TEXT[] NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER series_set_updated_at
BEFORE UPDATE ON series
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE episodes (
    id SERIAL PRIMARY KEY,
    series_id INT NOT NULL REFERENCES series (id),
    episode_number SMALLINT NOT NULL CHECK ( episode_number > 0 ),
    season SMALLINT NOT NULL CHECK ( season > 0 ),
    telegram_file_id_cas INT UNIQUE,
    telegram_file_id_lat INT UNIQUE,
    language_cas BOOLEAN NOT NULL DEFAULT FALSE,
    language_lat BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE ( series_id, season, episode_number )
);

CREATE TRIGGER episodes_set_updated_at
BEFORE UPDATE ON episodes
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE incoming_episodes (
    id SERIAL PRIMARY KEY,
    message_id INT NOT NULL UNIQUE,
    caption TEXT NOT NULL,
    episode_number SMALLINT NOT NULL CHECK ( episode_number > 0 ),
    season SMALLINT NOT NULL CHECK ( season > 0 ),
    language TEXT CHECK ( language IN ('latino', 'castellano') ),
    batch_id INT,
    batch_name TEXT,
    is_processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER incoming_episodes_set_updated_at
BEFORE UPDATE ON incoming_episodes
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
