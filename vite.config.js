import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { vite as vidstack } from 'vidstack/plugins';

export default defineConfig({
	plugins: [sveltekit(),vidstack()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});
