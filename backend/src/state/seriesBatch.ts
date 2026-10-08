export interface ISeriesBatch {
	batch_id: number
	batch_name: string
}

export function createSeriesBatchStore() {
	const batches = new Map<number, ISeriesBatch>()

	function get(chatId: number): ISeriesBatch | undefined {
		return batches.get(chatId)
	}

	function start(chatId: number, batch: ISeriesBatch): ISeriesBatch | undefined {
		if (batches.has(chatId)) return undefined
		batches.set(chatId, batch)
		return batch
	}

	function end(chatId: number): ISeriesBatch | undefined {
		const batch = batches.get(chatId)
		batches.delete(chatId)
		return batch
	}

	return { get, start, end }
}

export type SeriesBatchStore = ReturnType<typeof createSeriesBatchStore>
