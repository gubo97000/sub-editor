import { register } from 'node-network-devtools';

import type { ServerInit } from '@sveltejs/kit';

export const init: ServerInit = async () => {
	console.info('Server created, registering shutdown hooks');
	const unregister = register();
	process.on('sveltekit:shutdown', async (reason) => {
		console.info('SvelteKit has shutdown because of', reason);

		// Your custom logic for closing app specific resources
		unregister();
	});
};
