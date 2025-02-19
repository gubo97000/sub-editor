<script>
	import AuthButton from '$lib/auth.svelte';
</script>

<div>
	<div>
		<AuthButton />
	</div>
</div>
<slot />

<style>
	:global(:root) {
		--background-color: var(rgba(43, 213, 216, 0.329));
	}
	:root {
		--background-color: var(rgba(43, 213, 216, 0.329));
	}
</style>
