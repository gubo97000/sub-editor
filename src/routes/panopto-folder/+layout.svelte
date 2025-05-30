<script>
	import { page } from '$app/state';
	import AuthButton from '$lib/auth.svelte';
</script>

<div>
	<div>
		<AuthButton refreshAfterLogin={page.status === 401 ? true : false} />
	</div>
</div>
<slot />

<style>
	:global(:root) {
		/* --primary-color: rgba(21, 141, 43, 0.472);
    --primary-color-hover: rgba(21, 141, 43, 0.8);
    --primary-color-active: rgba(68, 233, 98, 0.48);
    --secondary-color: rgba(36, 158, 58, 0.279);
    --secondary-color-border: rgba(7, 55, 31, 0.297);
    --background-color: rgba(43, 216, 75, 0.096); */
		--primary-color: rgba(69, 165, 255, 0.568);
		--primary-color-hover: rgba(69, 165, 255, 0.8);
		--primary-color-active: rgba(69, 165, 255, 0.48);
		--background-color: rgba(0, 221, 255, 0.108);
	}
</style>
