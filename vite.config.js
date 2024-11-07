import { sveltekit } from '@sveltejs/kit/vite';
import fs from 'fs';
import { vite as vidstack } from 'vidstack/plugins';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit(), vidstack()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	},
	server: {
		https: {
			key: fs.readFileSync('./cert/key.pem'),
			cert: fs.readFileSync('./cert/cert.pem')
		},
		proxy:{}
	}
});
