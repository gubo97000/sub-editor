<script>
	import { PUBLIC_BASE_URL, PUBLIC_PANOPTO_URL } from '$env/static/public';
	import { authedFetch } from './apiWrapper';

	import { panoptoAuth as pA, panoptoAuth } from './stores/globalStatus.svelte';
	import { isExpired } from './utility';
	const clientId = encodeURIComponent(atob('Yzk0NTE3ZWItYzBjNy00ODJiLTkwNzctYjFmMDAwMDg1ODYz')); //in base64 just for obfuscating
	const redirectURI = encodeURI(PUBLIC_BASE_URL + '/callback');
	const scopes = encodeURIComponent('api'); // give us the id_token and the refresh token, please
	const panoptoBaseUrl = PUBLIC_PANOPTO_URL;
	const authUrl = `/Panopto/oauth2/connect/authorize`;
	const authEndpoint = `${panoptoBaseUrl}${authUrl}?client_id=${clientId}&redirect_uri=${redirectURI}&response_type=token&scope=${scopes}`;

	console.log('hello', panoptoAuth);
	let { refreshAfterLogin = false } = $props();
	let loginStatus = $state('NO');

	const handleClick = () => {
		const windowProxy = window.open(authEndpoint, '_blank', 'width=400,height=400');
		loginStatus = 'PROGRESS';

		console.log(windowProxy);
	};
	$effect(() => {
		if (pA.value?.accessToken && refreshAfterLogin) {
			authedFetch("/api/v1/proxy/api/v1/captionproviders").then((res) => {
				if (res.status === 200) {
					console.log('Login successful, reloading page');
					location.reload();
				} 
			});
			
		}
	});
</script>

<div>
	<button onclick={handleClick} style={`display: flex; align-items:center;`}>
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" style="width:24px">
			<path
				d="M 27.767578 3.9570312 C 26.936484 3.9725 26.114609 4.1342187 25.349609 4.4492188 L 25.029297 4.5703125 L 25.009766 4.5898438 C 24.809766 4.6698438 24.619219 4.7691406 24.449219 4.8691406 L 23.369141 5.4902344 L 9.5195312 13.400391 C 7.3495313 14.650391 6 16.980469 6 19.480469 L 6 30.419922 L 9.5390625 32.699219 C 11.349063 33.749219 13.669063 33.770469 15.539062 32.730469 L 22 29.140625 L 22 18.480469 L 22.009766 18.480469 L 22 16.710938 L 22 12 C 21.99 11.94 22 11.890078 22 11.830078 C 22.05 11.180078 22.169141 10.529922 22.369141 9.9199219 L 22.400391 9.8300781 C 22.780391 8.7000781 23.400703 7.6707813 24.220703 6.8007812 C 24.720703 6.2807813 25.280156 5.8292188 25.910156 5.4492188 L 28.599609 3.9902344 C 28.322109 3.9627344 28.044609 3.951875 27.767578 3.9570312 z M 31.269531 4.8105469 L 26.900391 7.1796875 C 25.100391 8.2596875 23.970469 10.279687 23.980469 12.429688 L 24.009766 19.650391 L 33.300781 25.029297 L 38.519531 28.060547 C 40.659531 29.550547 41.98 32.030391 42 34.650391 L 41.849609 38.640625 C 43.099609 37.450625 43.860469 35.830078 43.980469 34.080078 L 43.980469 33.949219 C 44.000469 33.839219 44 33.709609 44 33.599609 L 44 16.400391 C 44 13.960391 42.699609 11.660625 40.599609 10.390625 L 31.519531 4.9492188 C 31.439531 4.8992188 31.359531 4.8505469 31.269531 4.8105469 z M 31.310547 26.140625 L 16.519531 34.470703 C 15.289531 35.150703 13.930313 35.490234 12.570312 35.490234 C 11.610312 35.490234 10.66 35.320234 9.75 34.990234 C 9.32 34.840234 8.9 34.640156 8.5 34.410156 L 6.5195312 33.130859 C 6.9995313 34.340859 7.8292187 35.410469 8.9492188 36.230469 L 9.0390625 36.289062 C 9.1990625 36.399062 9.3695312 36.519609 9.5195312 36.599609 L 24.460938 45.130859 C 25.530938 45.740859 26.729922 46.050781 27.919922 46.050781 C 29.169922 46.050781 30.419531 45.710781 31.519531 45.050781 L 39.800781 40.089844 L 40 34.619141 C 39.98 32.519141 38.820703 30.519453 36.970703 29.439453 L 31.310547 26.140625 z"
			/>
		</svg>

		{#if isExpired(pA.value?.decodedToken?.exp)}
			{'Logged as ' + pA.value.decodedToken?.name}
		{:else}
			Login into Panopto
		{/if}
	</button>
</div>
<!-- <a href={"api/v1/login"} target="_blank">Start2 Authentication</a> -->
<!-- <button onclick={clickHandler}>Start Authentication</button> -->
