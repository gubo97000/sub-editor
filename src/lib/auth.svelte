<script>
	import { PUBLIC_BASE_URL, PUBLIC_PANOPTO_URL } from '$env/static/public';
	const clientId = encodeURIComponent(atob('Yzk0NTE3ZWItYzBjNy00ODJiLTkwNzctYjFmMDAwMDg1ODYz')); //in base64 just for obfuscating
	const redirectURI = encodeURI(PUBLIC_BASE_URL + '/callback');
	const scopes = encodeURIComponent('api'); // give us the id_token and the refresh token, please
	const panoptoBaseUrl = PUBLIC_PANOPTO_URL;
	const authUrl = `/Panopto/oauth2/connect/authorize`;
	const authEndpoint = `${panoptoBaseUrl}${authUrl}?client_id=${clientId}&redirect_uri=${redirectURI}&response_type=token&scope=${scopes}`;
</script>

<a type={'button'} href={authEndpoint} target="_blank">Panopto Login</a>
<!-- <a href={"api/v1/login"} target="_blank">Start2 Authentication</a> -->
<!-- <button onclick={clickHandler}>Start Authentication</button> -->
