import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		mockReset: true,
		coverage: {
			provider: 'v8',
			include: ['src/**/*.ts'],
			exclude: ['src/**/*.test.ts'],
		},
	},
})
