import { describe, expect, it, type Mock, vi } from 'vitest'
import { pool } from '../database/index.ts'
import type { IEpisode, IEpisodeToSave, IEpisodeToUpdate } from '../entities/episode.ts'
import { episodeRepository } from './episode.ts'

vi.mock('../database/index.ts', () => ({ pool: { query: vi.fn() } }))

const poolQuery = vi.mocked(pool).query as unknown as Mock<(text: string, values?: unknown[]) => Promise<{ rows: IEpisode[] }>>

const CREATED_AT = new Date('2026-01-15T10:00:00.000Z')
const UPDATED_AT = new Date('2026-02-20T18:30:00.000Z')

function makeEpisode(overrides: Partial<IEpisode> = {}): IEpisode {
	return {
		id: 1,
		series_id: 1396,
		episode_number: 7,
		season: 4,
		language_cas: true,
		language_lat: false,
		telegram_file_id_cas: 111,
		telegram_file_id_lat: 0,
		created_at: CREATED_AT,
		updated_at: UPDATED_AT,
		...overrides,
	}
}

function makeEpisodeToSave(overrides: Partial<IEpisodeToSave> = {}): IEpisodeToSave {
	return {
		episode_number: 7,
		season: 4,
		language_cas: true,
		language_lat: false,
		telegram_file_id_cas: 111,
		telegram_file_id_lat: 0,
		...overrides,
	}
}

function mockRows(rows: IEpisode[]) {
	poolQuery.mockResolvedValue({ rows })
}

describe('episodeRepository', () => {
	describe('getEpisodes', () => {
		it('selects the episode columns without wrapping them in parentheses', async () => {
			mockRows([makeEpisode()])

			await episodeRepository.getEpisodes({ series_id: 1396 })

			const sql = poolQuery.mock.calls[0]![0]
			expect(sql).toContain(
				'SELECT id, series_id, episode_number, season, language_cas, language_lat, telegram_file_id_cas, telegram_file_id_lat, created_at, updated_at from episodes',
			)
			expect(sql).not.toContain('SELECT (')
		})

		it('passes the filters as numbered parameters to the query', async () => {
			mockRows([makeEpisode()])

			await episodeRepository.getEpisodes({ series_id: 1396 })

			const sql = poolQuery.mock.calls[0]![0]
			expect(sql).toContain('where series_id = $1')
			expect(poolQuery.mock.calls[0]![1]).toEqual([1396])
		})

		it('returns the rows untouched', async () => {
			const rows = [makeEpisode(), makeEpisode({ id: 2, episode_number: 8 })]
			mockRows(rows)

			const result = await episodeRepository.getEpisodes({ series_id: 1396 })

			expect(result).toEqual(rows)
		})

		it('sends an empty values array when there are no filters', async () => {
			mockRows([])

			await episodeRepository.getEpisodes({ series_id: 0 })

			const sql = poolQuery.mock.calls[0]![0]
			expect(sql).not.toContain('where')
			expect(poolQuery.mock.calls[0]![1]).toEqual([])
		})
	})

	describe('saveEpisodes', () => {
		it('inserts every episode with its values in column order', async () => {
			const episodes = [makeEpisodeToSave(), makeEpisodeToSave({ episode_number: 8, telegram_file_id_cas: 222 })]
			poolQuery.mockResolvedValueOnce({ rows: [makeEpisode()] }).mockResolvedValueOnce({
				rows: [makeEpisode({ id: 2, episode_number: 8, telegram_file_id_cas: 222 })],
			})

			await episodeRepository.saveEpisodes(1396, episodes)

			expect(poolQuery).toHaveBeenCalledTimes(2)
			expect(poolQuery.mock.calls[0]![0]).toContain(
				'INSERT INTO episodes (series_id, episode_number, season, language_cas, language_lat, telegram_file_id_cas, telegram_file_id_lat)',
			)
			expect(poolQuery.mock.calls[0]![1]).toEqual([1396, 7, 4, true, false, 111, 0])
			expect(poolQuery.mock.calls[1]![1]).toEqual([1396, 8, 4, true, false, 222, 0])
		})

		it('takes the series id from the parameter instead of the payload', async () => {
			mockRows([makeEpisode()])

			await episodeRepository.saveEpisodes(42, [makeEpisodeToSave()])

			expect(poolQuery.mock.calls[0]![1]).toEqual([42, 7, 4, true, false, 111, 0])
		})

		it('returns the saved episodes in insertion order', async () => {
			const saved = [makeEpisode(), makeEpisode({ id: 2, episode_number: 8 })]
			poolQuery.mockResolvedValueOnce({ rows: [saved[0]!] }).mockResolvedValueOnce({ rows: [saved[1]!] })

			const result = await episodeRepository.saveEpisodes(1396, [makeEpisodeToSave(), makeEpisodeToSave({ episode_number: 8 })])

			expect(result).toEqual(saved)
		})

		it('does not query the database when there are no episodes', async () => {
			const result = await episodeRepository.saveEpisodes(1396, [])

			expect(poolQuery).not.toHaveBeenCalled()
			expect(result).toEqual([])
		})
	})

	describe('updateEpisodes', () => {
		function makeEpisodeToUpdate(overrides: Partial<IEpisodeToUpdate> = {}): IEpisodeToUpdate {
			return { ...makeEpisodeToSave(), id: 1, ...overrides }
		}

		it('writes only the castellano cell when the episode brings castellano only', async () => {
			const update = makeEpisodeToUpdate({ telegram_file_id_cas: 111, telegram_file_id_lat: 0 })
			mockRows([makeEpisode()])

			await episodeRepository.updateEpisodes([update])

			expect(poolQuery).toHaveBeenCalledTimes(1)
			expect(poolQuery.mock.calls[0]![0]).toContain(
				'UPDATE episodes SET telegram_file_id_cas = $1, language_cas = $2 WHERE id = $3 RETURNING *',
			)
			expect(poolQuery.mock.calls[0]![0]).not.toContain('language_lat')
			expect(poolQuery.mock.calls[0]![1]).toEqual([111, true, 1])
		})

		it('writes only the latino cell when the episode brings latino only', async () => {
			const update = makeEpisodeToUpdate({
				language_cas: false,
				language_lat: true,
				telegram_file_id_cas: 0,
				telegram_file_id_lat: 222,
			})
			mockRows([makeEpisode()])

			await episodeRepository.updateEpisodes([update])

			expect(poolQuery.mock.calls[0]![0]).toContain(
				'UPDATE episodes SET telegram_file_id_lat = $1, language_lat = $2 WHERE id = $3 RETURNING *',
			)
			expect(poolQuery.mock.calls[0]![0]).not.toContain('language_cas')
			expect(poolQuery.mock.calls[0]![1]).toEqual([222, true, 1])
		})

		it('writes both cells when the episode brings both languages', async () => {
			const update = makeEpisodeToUpdate({
				language_cas: true,
				language_lat: true,
				telegram_file_id_cas: 111,
				telegram_file_id_lat: 222,
			})
			mockRows([makeEpisode()])

			await episodeRepository.updateEpisodes([update])

			expect(poolQuery.mock.calls[0]![0]).toContain(
				'UPDATE episodes SET telegram_file_id_cas = $1, language_cas = $2, telegram_file_id_lat = $3, language_lat = $4 WHERE id = $5 RETURNING *',
			)
			expect(poolQuery.mock.calls[0]![1]).toEqual([111, true, 222, true, 1])
		})

		it('writes no cell when the episode brings no language', async () => {
			const update = makeEpisodeToUpdate({ language_cas: false, language_lat: false })
			mockRows([])

			const result = await episodeRepository.updateEpisodes([update])

			expect(poolQuery).not.toHaveBeenCalled()
			expect(result).toEqual([])
		})

		it('targets the episode row by id instead of by season and episode_number', async () => {
			const update = makeEpisodeToUpdate({ id: 42, season: 4, episode_number: 7 })
			mockRows([makeEpisode()])

			await episodeRepository.updateEpisodes([update])

			const sql = poolQuery.mock.calls[0]![0]
			expect(sql).toContain('WHERE id = $3')
			expect(sql).not.toContain('season')
			expect(sql).not.toContain('episode_number')
		})

		it('updates every episode in a single query each', async () => {
			const updates = [
				makeEpisodeToUpdate({ id: 1, episode_number: 7 }),
				makeEpisodeToUpdate({
					id: 2,
					episode_number: 8,
					language_cas: false,
					language_lat: true,
					telegram_file_id_cas: 0,
					telegram_file_id_lat: 222,
				}),
			]
			mockRows([makeEpisode(), makeEpisode({ id: 2 })])

			await episodeRepository.updateEpisodes(updates)

			expect(poolQuery).toHaveBeenCalledTimes(2)
			expect(poolQuery.mock.calls[0]![1]).toEqual([111, true, 1])
			expect(poolQuery.mock.calls[1]![1]).toEqual([222, true, 2])
		})

		it('returns the updated episodes in update order', async () => {
			const updated = [makeEpisode(), makeEpisode({ id: 2, episode_number: 8, language_lat: true, telegram_file_id_lat: 222 })]
			poolQuery.mockResolvedValueOnce({ rows: [updated[0]!] }).mockResolvedValueOnce({ rows: [updated[1]!] })

			const result = await episodeRepository.updateEpisodes([
				makeEpisodeToUpdate({ episode_number: 7 }),
				makeEpisodeToUpdate({
					id: 2,
					episode_number: 8,
					language_cas: false,
					language_lat: true,
					telegram_file_id_cas: 0,
					telegram_file_id_lat: 222,
				}),
			])

			expect(result).toEqual(updated)
		})

		it('does not query the database when there are no episodes to update', async () => {
			const result = await episodeRepository.updateEpisodes([])

			expect(poolQuery).not.toHaveBeenCalled()
			expect(result).toEqual([])
		})
	})
})
