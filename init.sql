CREATE TABLE raw_movies_mx (
  id serial primary key,
  file_id int not null unique,
  text text not null unique,
  language text not null CHECK ( language = 'español latino 🇲🇽'),
  is_saved boolean not null
);

CREATE TABLE raw_movies_es (
  id serial primary key,
  file_id int not null unique,
  text text not null unique,
  language text not null CHECK ( language = 'español castellano 🇪🇸'),
  is_saved boolean not null
);

CREATE TABLE movies_mx (
  title TEXT NOT NULL UNIQUE,
  title_es TEXT[] NOT NULL UNIQUE,
  year SMALLINT NOT NULL CHECK ( year > 1950 AND year <= 2026),
  poster TEXT NOT NULL CHECK ( poster ~ '^https:\/\/.+' ),
  language TEXT NOT NULL CHECK ( language = 'español latino 🇲🇽'),
  quality TEXT NOT NULL CHECK ( quality = 'HD (1040p)' OR quality = 'Copia de cine' OR quality = '720p' OR quality = 'Indefinida'),
  id SERIAL PRIMARY KEY,
  description TEXT NOT NULL,
  telegram_file_id INTEGER NOT NULL UNIQUE,
  telegram_poster_id INTEGER NOT NULL,
  telegram_container_group_id BIGINT NOT NULL,
  catalog TEXT NOT NULL
);


CREATE TABLE movies_es (
  title TEXT NOT NULL UNIQUE,
  title_es TEXT[] NOT NULL UNIQUE,
  year SMALLINT NOT NULL CHECK ( year > 1950 AND year <= 2026),
  poster TEXT NOT NULL CHECK ( poster ~ '^https:\/\/.+' ),
  language TEXT NOT NULL CHECK ( language = 'español castellano 🇪🇸'),
  quality TEXT NOT NULL CHECK ( quality = 'HD (1040p)' OR quality = 'Copia de cine' OR quality = '720p' OR quality = 'Indefinida'),
  id SERIAL PRIMARY KEY,
  description TEXT NOT NULL,
  telegram_file_id INTEGER NOT NULL UNIQUE,
  telegram_poster_id INTEGER NOT NULL,
  telegram_container_group_id BIGINT NOT NULL,
  catalog TEXT NOT NULL
);
