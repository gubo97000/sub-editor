<script>
	import { PUBLIC_BASE_URL, PUBLIC_PANOPTO_URL } from '$env/static/public';
	import { panoptoAuth as pA, panoptoAuth } from './stores/globalStatus.svelte';
	const clientId = encodeURIComponent(atob('Yzk0NTE3ZWItYzBjNy00ODJiLTkwNzctYjFmMDAwMDg1ODYz')); //in base64 just for obfuscating
	const redirectURI = encodeURI(PUBLIC_BASE_URL + '/callback');
	const scopes = encodeURIComponent('api'); // give us the id_token and the refresh token, please
	const panoptoBaseUrl = PUBLIC_PANOPTO_URL;
	const authUrl = `/Panopto/oauth2/connect/authorize`;
	const authEndpoint = `${panoptoBaseUrl}${authUrl}?client_id=${clientId}&redirect_uri=${redirectURI}&response_type=token&scope=${scopes}`;

	console.log('hello', panoptoAuth);

	/**
	 * Parses a JSON Web Token (JWT) and returns its payload.
	 *
	 * @param {string} token - The JWT to be parsed.
	 * @returns {Object | undefined} The payload of the JWT.
	 */
	function parseJwt(token) {
		if (token == '') {
			return;
		}
		var base64Url = token.split('.')[1];
		var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
		var jsonPayload = decodeURIComponent(
			atob(base64)
				.split('')
				.map(function (c) {
					return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
				})
				.join('')
		);
		console.log('jsonPayload', jsonPayload);
		return JSON.parse(jsonPayload);
	}
	$inspect(pA);
	console.log(parseJwt(pA.accessToken ?? '')?.name);
</script>

<div>
	<a type={'button'} href={authEndpoint} target="_blank">Panopto Login</a>
	{parseJwt(pA.accessToken ?? '')?.name}
</div>
<!-- <a href={"api/v1/login"} target="_blank">Start2 Authentication</a> -->
<!-- <button onclick={clickHandler}>Start Authentication</button> -->
