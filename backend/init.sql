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
    catalog_name TEXT NOT NULL,
    catalog_version SMALLINT NOT NULL,
    quality TEXT,
    poster TEXT NOT NULL UNIQUE CHECK ( poster ~ '^https:\/\/.+' ),
    telegram_poster_id INT NOT NULL,
    telegram_container_group_id BIGINT NOT NULL,
    description TEXT NOT NULL,
    tmdb_id INT NOT NULL UNIQUE,
    popularity FLOAT NOT NULL,
    backdrop_path TEXT NOT NULL UNIQUE CHECK ( backdrop_path ~ '^https:\/\/.+' ),
    genres TEXT[] NOT NULL

)

CREATE TABLE telegram_movies (
    id SERIAL PRIMARY KEY,
    file_id INT NOT NULL UNIQUE,
    message_text NOT NULL,
    language TEXT NOT NULL CHECK (language IN ('latino', 'castellano')),
    is_saved BOOLEAN DEFAULT FALSE
)