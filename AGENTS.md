# AGENTS.md - Cinerat CMS

## Quickstart (backend)

**Working directory:** `/mnt/data/workspace/cinerat-cms/backend`

```bash
cd backend
bun install  # deps managed by bun.lock
bun run dev  # runs with .dev.env and node --watch
bun run prod # runs with .env
bun run test # runs vitest
bun run db:backup  # ./scripts/backup-db.sh
bun run db:sync    # ./scripts/sync-dev-db.sh (syncs prod/dev DBs)
```

## Toolchain

- **Runtime/Bundler:** Bun (bun.lock; `@types/bun` present). Package is ESM (`"type": "module"`).
- **TypeScript:** `module: Preserve`, `moduleResolution: bundler`, `noEmit: true`, strict mode (see `tsconfig.json`).
- **Formatter/Linter:** Biome 2.5.10 (`biome.json`). Uses tabs, single quotes, semicolons as-needed, organize imports on.
- **Testing:** Vitest 5. Config in `vitest.config.ts` (`mockReset: true`, v8 coverage for `src/**/*.ts` excluding `*.test.ts`).
- **Validation:** Zod v4 (`zod` in deps).

## Lint & typecheck

No explicit `lint`/`typecheck` scripts. Common commands from this toolchain:
- Lint/format check: `bunx biome check .` (or `npx @biomejs/biome check .`)
- Auto-fix: `bunx biome check --write .`
- Typecheck: `bunx tsc --noEmit` (or `tsc --noEmit`)

Run these after completing changes when relevant.

## Architecture (high-signal)

Backend is Express API + Telegram bot listeners. Key structure in `src/`:
- `index.ts` wires bot listeners and starts server from `server.ts`.
- `server.ts` sets up Express app, routes, CORS, error handler.
- `controllers/` handle HTTP requests; `routes/` define endpoints; `middlewares/` validate (Zod) and handle errors.
- `services/` business logic (e.g. `series.ts`, `videos.ts`, `movies.ts`, `episodes.ts`, `incomingEpisodes.ts`, `incomingVideos.ts`).
- `repositories/` DB access via `pg` (see `database/index.ts`).
- `schemas/` Zod validation schemas.
- `entities/` TypeScript types/entities.
- `providers/telegram.ts` creates Telegram bots using `node-telegram-bot-api` (polling). Expects many env vars.
- `listeners/` Telegram message listeners (incoming videos/episodes, series commands). Use `state/seriesBatch.ts` for batching.
- `helpers/` pure utilities with co-located `*.test.ts`.
- `state/`, `utils/` support modules.

Routes (from server): `/movies`, `/videos`, `/series`, `/incoming-episodes`. Error handling via `errorHandler` middleware.

## Environment

Two env files in `backend/`: `.dev.env` (dev DB `dev_cineman`, different Telegram tokens/groups) and `.env` (prod DB `cineman`). 
Required env vars (see `providers/telegram.ts`): `BOT_TOKEN`, `SERIES_BOT_TOKEN`, `MOVIE_CONTAINER_GROUP_ID`, `MOVIE_LISTENER_GROUP_ID`, `SERIES_CONTAINER_GROUP_ID`, `SERIES_LISTENER_GROUP_ID`, plus DB vars (`DATABASE_*` or `DATABASE_URL`). `SERIES_SEND_MAX_ATTEMPTS` optional (default 3). 
Scripts load `.env` (`db:backup`, `db:sync`) or code loads `.dev.env`/`.env` via `--env-file`.

**Never commit `.env` files** (gitignored). Be careful with secrets.

## Database

PostgreSQL schema in `init.sql`. Helpers: `set_updated_at()` trigger. Tables include `movies`, `series`, `episodes`, `incoming_videos`, `incoming_episodes`. 
DB scripts: `scripts/backup-db.sh` (dumps with retention), `scripts/sync-dev-db.sh` (syncs prod DB to dev; can also use `--from-backup <file>`). Both read from `.env`.

## Testing notes

- Tests are co-located as `*.test.ts` next to source.
- Run all tests: `bun run test`. Vitest can run specific files/patterns: `bun run test -- path/to/file.test.ts` or `bun run test -- --run` to run once without watch.
- Coverage configured (v8) including all `src/**/*.ts`, excluding `*.test.ts`.
- Many helpers and listeners have unit tests; tests use vitest defaults + `mockReset: true`.

## Conventions

- TypeScript with verbatim module syntax; import with `.ts` extensions (e.g. `./server.ts`).
- Biome enforces style (tabs, single quotes, no non-null assertions off).
- Co-located tests. Keep changes minimal and follow existing patterns.
- Strict TypeScript; prefer existing utilities/helpers.

## Repo-specific rules (important)

This repo has a detailed commit convention defined in `backend/skills/generic/commits/SKILL.md` (also symlinked at `backend/.opencode/skills/commits`). Key points:
- Conventional Commits: `<type>(<scope>)!: <subject>` in English.
- Atomicity: each commit must be a functional checkpoint (project stays buildable/runnable). Never mix declaration and implementation in the same commit if it breaks functionality; group only when necessary to keep project functional.
- Feature-based contiguous blocks: finish one feature's commits before starting another.
- Selective staging: never `git add .`; only stage explicitly specified files/hunks.
- Never commit secrets, env files, binaries, build outputs, or node_modules.

When asked to commit, follow those rules precisely.

## References

- Root ignores: `.gitignore` (mostly ignores frontend/.atl in root; backend has its own .gitignore)
- No root-level `AGENTS.md`/`CLAUDE.md`/`opencode.json` - check `backend/.opencode/` for repo-local OpenCode config/skills.
- Additional skills registry at `.atl/skill-registry.md` (references global skills).
