import { describe, expect, it } from 'vitest'
import type { IEpisode, IEpisodeToSave, IEpisodeToUpdate } from '../entities/episode.ts'
import { partitionEpisodes } from './partitionEpisodes.ts'

const CAS = { language_cas: true, language_lat: false, telegram_file_id_cas: 111, telegram_file_id_lat: 0 }
const LAT = { language_cas: false, language_lat: true, telegram_file_id_cas: 0, telegram_file_id_lat: 222 }
const BOTH = { language_cas: true, language_lat: true, telegram_file_id_cas: 111, telegram_file_id_lat: 222 }

function makeEpisodeToSave(overrides: Partial<IEpisodeToSave> = {}): IEpisodeToSave {
	return { episode_number: 7, season: 4, ...CAS, ...overrides }
}

function makeEpisode(overrides: Partial<IEpisode> = {}): IEpisode {
	return {
		...makeEpisodeToSave(),
		id: 1,
		series_id: 1396,
		created_at: new Date('2026-01-01T00:00:00.000Z'),
		updated_at: new Date('2026-01-01T00:00:00.000Z'),
		...overrides,
	}
}

function makeEpisodeToUpdate(id: number, overrides: Partial<IEpisodeToSave> = {}): IEpisodeToUpdate {
	return { ...makeEpisodeToSave(overrides), id }
}

describe('partitionEpisodes', () => {
	it.for<{
		name: string
		episodesToSave: IEpisodeToSave[]
		existentEpisodes: IEpisode[]
		toSave: IEpisodeToSave[]
		toUpdate: IEpisodeToSave[]
		toDelete: IEpisodeToSave[]
	}>([
		{
			name: 'empty partitions when there is nothing incoming',
			episodesToSave: [],
			existentEpisodes: [],
			toSave: [],
			toUpdate: [],
			toDelete: [],
		},
		{
			name: 'every episode is saved when the serie has none',
			episodesToSave: [makeEpisodeToSave(), makeEpisodeToSave({ episode_number: 8 })],
			existentEpisodes: [],
			toSave: [makeEpisodeToSave(), makeEpisodeToSave({ episode_number: 8 })],
			toUpdate: [],
			toDelete: [],
		},
		{
			name: 'an incoming episode that matches nothing is saved',
			episodesToSave: [makeEpisodeToSave({ episode_number: 8 })],
			existentEpisodes: [makeEpisode({ episode_number: 7 })],
			toSave: [makeEpisodeToSave({ episode_number: 8 })],
			toUpdate: [],
			toDelete: [],
		},
		{
			name: 'an incoming episode whose language is already filled is deleted',
			episodesToSave: [makeEpisodeToSave(CAS)],
			existentEpisodes: [makeEpisode(CAS)],
			toSave: [],
			toUpdate: [],
			toDelete: [makeEpisodeToSave(CAS)],
		},
		{
			name: 'an incoming episode bringing the missing language is updated',
			episodesToSave: [makeEpisodeToSave(LAT)],
			existentEpisodes: [makeEpisode(CAS)],
			toSave: [],
			toUpdate: [makeEpisodeToUpdate(1, LAT)],
			toDelete: [],
		},
		{
			name: 'an incoming episode is updated when only one of its two languages is missing',
			episodesToSave: [makeEpisodeToSave(BOTH)],
			existentEpisodes: [makeEpisode(CAS)],
			toSave: [],
			toUpdate: [makeEpisodeToUpdate(1, BOTH)],
			toDelete: [],
		},
		{
			name: 'an incoming episode is deleted when the serie already has both languages',
			episodesToSave: [makeEpisodeToSave(BOTH)],
			existentEpisodes: [makeEpisode(BOTH)],
			toSave: [],
			toUpdate: [],
			toDelete: [makeEpisodeToSave(BOTH)],
		},
		{
			name: 'an incoming episode is updated when the existent row has both cells empty',
			episodesToSave: [makeEpisodeToSave(CAS)],
			existentEpisodes: [
				makeEpisode({ language_cas: false, language_lat: false, telegram_file_id_cas: 0, telegram_file_id_lat: 0 }),
			],
			toSave: [],
			toUpdate: [makeEpisodeToUpdate(1, CAS)],
			toDelete: [],
		},
		{
			name: 'an incoming episode that fills no cell at all is deleted',
			episodesToSave: [makeEpisodeToSave({ language_cas: false, language_lat: false })],
			existentEpisodes: [makeEpisode(CAS)],
			toSave: [],
			toUpdate: [],
			toDelete: [makeEpisodeToSave({ language_cas: false, language_lat: false })],
		},
		{
			name: 'the same episode_number in another season does not collide',
			episodesToSave: [makeEpisodeToSave({ season: 3, episode_number: 7 })],
			existentEpisodes: [makeEpisode({ season: 4, episode_number: 7 })],
			toSave: [makeEpisodeToSave({ season: 3, episode_number: 7 })],
			toUpdate: [],
			toDelete: [],
		},
		{
			name: 'the same season with another episode_number does not collide',
			episodesToSave: [makeEpisodeToSave({ season: 4, episode_number: 8 })],
			existentEpisodes: [makeEpisode({ season: 4, episode_number: 7 })],
			toSave: [makeEpisodeToSave({ season: 4, episode_number: 8 })],
			toUpdate: [],
			toDelete: [],
		},
		{
			name: 'episode_number 7 does not collide with episode_number 8',
			episodesToSave: [makeEpisodeToSave({ episode_number: 7 })],
			existentEpisodes: [makeEpisode({ episode_number: 8 })],
			toSave: [makeEpisodeToSave({ episode_number: 7 })],
			toUpdate: [],
			toDelete: [],
		},
		{
			name: 'season 4 does not collide with season 14',
			episodesToSave: [makeEpisodeToSave({ season: 14, episode_number: 7 })],
			existentEpisodes: [makeEpisode({ season: 4, episode_number: 7 })],
			toSave: [makeEpisodeToSave({ season: 14, episode_number: 7 })],
			toUpdate: [],
			toDelete: [],
		},
		{
			name: 'a season given as text still collides with its numeric counterpart',
			episodesToSave: [makeEpisodeToSave({ season: '4' as unknown as number })],
			existentEpisodes: [makeEpisode(CAS)],
			toSave: [],
			toUpdate: [],
			toDelete: [makeEpisodeToSave({ season: '4' as unknown as number })],
		},
		{
			name: 'an episode repeated in the incoming batch is kept only once',
			episodesToSave: [makeEpisodeToSave({ telegram_file_id_cas: 111 }), makeEpisodeToSave({ telegram_file_id_cas: 333 })],
			existentEpisodes: [],
			toSave: [makeEpisodeToSave({ telegram_file_id_cas: 111 })],
			toUpdate: [],
			toDelete: [],
		},
		{
			name: 'an episode repeated in the incoming batch against an existing one is deleted once',
			episodesToSave: [makeEpisodeToSave(CAS), makeEpisodeToSave(CAS)],
			existentEpisodes: [makeEpisode(CAS)],
			toSave: [],
			toUpdate: [],
			toDelete: [makeEpisodeToSave(CAS)],
		},
		{
			name: 'the three partitions keep the incoming order',
			episodesToSave: [
				makeEpisodeToSave({ episode_number: 1, ...CAS }),
				makeEpisodeToSave({ episode_number: 2, ...CAS }),
				makeEpisodeToSave({ episode_number: 3, ...CAS }),
				makeEpisodeToSave({ episode_number: 4, ...LAT }),
				makeEpisodeToSave({ episode_number: 5, ...LAT }),
				makeEpisodeToSave({ episode_number: 6, ...BOTH }),
				makeEpisodeToSave({ episode_number: 7, ...BOTH }),
			],
			existentEpisodes: [
				makeEpisode({ id: 11, episode_number: 1, ...CAS }),
				makeEpisode({ id: 12, episode_number: 2, ...LAT }),
				makeEpisode({ id: 14, episode_number: 4, ...CAS }),
				makeEpisode({ id: 16, episode_number: 6, ...BOTH }),
				makeEpisode({ id: 17, episode_number: 7, ...CAS }),
			],
			toSave: [makeEpisodeToSave({ episode_number: 3, ...CAS }), makeEpisodeToSave({ episode_number: 5, ...LAT })],
			toUpdate: [
				makeEpisodeToUpdate(12, { episode_number: 2, ...CAS }),
				makeEpisodeToUpdate(14, { episode_number: 4, ...LAT }),
				makeEpisodeToUpdate(17, { episode_number: 7, ...BOTH }),
			],
			toDelete: [makeEpisodeToSave({ episode_number: 1, ...CAS }), makeEpisodeToSave({ episode_number: 6, ...BOTH })],
		},
	])('partitions $name', ({ episodesToSave, existentEpisodes, toSave, toUpdate, toDelete }) => {
		expect(partitionEpisodes(episodesToSave, existentEpisodes)).toEqual({ toSave, toUpdate, toDelete })
	})

	it('does not mutate the incoming episodes', () => {
		const episodesToSave = [makeEpisodeToSave(CAS), makeEpisodeToSave({ episode_number: 8 })]

		partitionEpisodes(episodesToSave, [makeEpisode(CAS)])

		expect(episodesToSave).toHaveLength(2)
	})

	it('takes the id from the existent row that matches the incoming episode', () => {
		const episodesToSave = [makeEpisodeToSave({ episode_number: 7 }), makeEpisodeToSave({ episode_number: 8 })]

		const { toUpdate } = partitionEpisodes(episodesToSave, [
			makeEpisode({ id: 11, episode_number: 7, ...LAT }),
			makeEpisode({ id: 12, episode_number: 8, ...LAT }),
		])

		expect(toUpdate.map((episode) => episode.id)).toEqual([11, 12])
	})
})
