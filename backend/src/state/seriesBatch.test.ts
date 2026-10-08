import { describe, expect, it } from 'vitest'
import { createSeriesBatchStore } from './seriesBatch.ts'

const BATCH = { batch_id: 555, batch_name: 'Breaking Bad' }

describe('createSeriesBatchStore', () => {
	it('starts a batch and exposes it by chat id', () => {
		const store = createSeriesBatchStore()

		const started = store.start(123, BATCH)

		expect(started).toEqual(BATCH)
		expect(store.get(123)).toEqual(BATCH)
	})

	it('does not start a batch when the chat already has one active', () => {
		const store = createSeriesBatchStore()
		store.start(123, BATCH)

		const started = store.start(123, { batch_id: 999, batch_name: 'The Wire' })

		expect(started).toBeUndefined()
		expect(store.get(123)).toEqual(BATCH)
	})

	it('ends the active batch and clears it', () => {
		const store = createSeriesBatchStore()
		store.start(123, BATCH)

		const ended = store.end(123)

		expect(ended).toEqual(BATCH)
		expect(store.get(123)).toBeUndefined()
	})

	it('returns undefined when ending a chat without a batch', () => {
		const store = createSeriesBatchStore()

		expect(store.end(123)).toBeUndefined()
	})

	it('returns undefined for a chat without a batch', () => {
		const store = createSeriesBatchStore()

		expect(store.get(123)).toBeUndefined()
	})

	it('keeps the batches of different chats isolated', () => {
		const store = createSeriesBatchStore()
		store.start(123, BATCH)
		store.start(456, { batch_id: 777, batch_name: 'The Wire' })

		store.end(123)

		expect(store.get(123)).toBeUndefined()
		expect(store.get(456)).toEqual({ batch_id: 777, batch_name: 'The Wire' })
	})
})
