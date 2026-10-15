import { describe, expect, it } from 'vitest'
import {
	BASE_DELAY_MS,
	createSeriesSendDelay,
	DELAY_STEP_MS,
	FLOOD_BACKOFF_FACTOR,
	INCREASE_EVERY_SENT,
	type ISeriesSendDelay,
	MAX_DELAY_MS,
	RECOVER_EVERY_SENT,
} from './seriesSendDelay.ts'

function send(delay: ISeriesSendDelay, times: number) {
	for (let i = 0; i < times; i++) delay.onSent()
}

describe('createSeriesSendDelay', () => {
	it('starts at the base delay', () => {
		expect(createSeriesSendDelay().current()).toBe(BASE_DELAY_MS)
	})

	it('keeps the base delay for a small series', () => {
		const delay = createSeriesSendDelay()

		send(delay, INCREASE_EVERY_SENT - 1)

		expect(delay.current()).toBe(BASE_DELAY_MS)
	})

	it(`grows by ${DELAY_STEP_MS}ms every ${INCREASE_EVERY_SENT} sent messages`, () => {
		const delay = createSeriesSendDelay()

		send(delay, INCREASE_EVERY_SENT)
		expect(delay.current()).toBe(BASE_DELAY_MS + DELAY_STEP_MS)

		send(delay, INCREASE_EVERY_SENT)
		expect(delay.current()).toBe(BASE_DELAY_MS + 2 * DELAY_STEP_MS)
	})

	it('never grows past the maximum delay', () => {
		const delay = createSeriesSendDelay()

		send(delay, 10000)

		expect(delay.current()).toBe(MAX_DELAY_MS)
	})

	it('multiplies the delay on a telegram flood wait', () => {
		const delay = createSeriesSendDelay()

		delay.onFloodWait()
		expect(delay.current()).toBe(BASE_DELAY_MS + Math.round(BASE_DELAY_MS * (FLOOD_BACKOFF_FACTOR - 1)))

		delay.onFloodWait()
		expect(delay.current()).toBeGreaterThan(BASE_DELAY_MS + Math.round(BASE_DELAY_MS * (FLOOD_BACKOFF_FACTOR - 1)))
	})

	it('caps the delay at the maximum after repeated flood waits', () => {
		const delay = createSeriesSendDelay()

		for (let i = 0; i < 20; i++) delay.onFloodWait()

		expect(delay.current()).toBe(MAX_DELAY_MS)
	})

	it(`recovers the flood penalty after ${RECOVER_EVERY_SENT} successful messages`, () => {
		const delay = createSeriesSendDelay()
		delay.onFloodWait()
		const afterFlood = delay.current()

		send(delay, RECOVER_EVERY_SENT)
		const afterFirstStreak = delay.current()

		send(delay, RECOVER_EVERY_SENT * 2)

		expect(afterFirstStreak).toBeLessThan(afterFlood)
		expect(delay.current()).toBeLessThan(afterFirstStreak)
		expect(delay.current()).toBeGreaterThanOrEqual(BASE_DELAY_MS)
	})

	it('never drops below the base delay', () => {
		const delay = createSeriesSendDelay()

		for (let i = 0; i < 200; i++) {
			delay.onFloodWait()
			send(delay, RECOVER_EVERY_SENT)
		}

		expect(delay.current()).toBeGreaterThanOrEqual(BASE_DELAY_MS)
	})
})
