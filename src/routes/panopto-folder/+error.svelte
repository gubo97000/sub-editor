<script>
	import { page } from '$app/state';
	import Auth from '$lib/auth.svelte';
</script>

<h1>{page.status}</h1>
<p>{page.error?.message}</p>
<!-- 
{#if page.status === 401}
    <Auth />
{/if} -->
