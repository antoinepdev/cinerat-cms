const BASE_DELAY_MS = 1500
const MAX_DELAY_MS = 10000
const DELAY_STEP_MS = 250
const INCREASE_EVERY_SENT = 40
const FLOOD_BACKOFF_FACTOR = 1.5
const RECOVER_EVERY_SENT = 20

export interface ISeriesSendDelay {
	current(): number
	onSent(): void
	onFloodWait(): void
}

function createSeriesSendDelay(): ISeriesSendDelay {
	let sentCount = 0
	let penaltyMs = 0
	let okStreak = 0

	function countDelayMs(): number {
		return BASE_DELAY_MS + DELAY_STEP_MS * Math.floor(sentCount / INCREASE_EVERY_SENT)
	}

	return {
		current() {
			return Math.min(MAX_DELAY_MS, countDelayMs() + penaltyMs)
		},
		onSent() {
			sentCount++
			if (penaltyMs <= 0) return

			okStreak++
			if (okStreak >= RECOVER_EVERY_SENT) {
				penaltyMs = Math.max(0, penaltyMs - DELAY_STEP_MS)
				okStreak = 0
			}
		},
		onFloodWait() {
			okStreak = 0
			penaltyMs = Math.min(
				MAX_DELAY_MS - BASE_DELAY_MS,
				penaltyMs === 0 ? Math.round(BASE_DELAY_MS * (FLOOD_BACKOFF_FACTOR - 1)) : Math.round(penaltyMs * FLOOD_BACKOFF_FACTOR),
			)
		},
	}
}

export {
	BASE_DELAY_MS,
	createSeriesSendDelay,
	DELAY_STEP_MS,
	FLOOD_BACKOFF_FACTOR,
	INCREASE_EVERY_SENT,
	MAX_DELAY_MS,
	RECOVER_EVERY_SENT,
}
