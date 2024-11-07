<script>
const clientId = encodeURIComponent(atob('Yzk0NTE3ZWItYzBjNy00ODJiLTkwNzctYjFmMDAwMDg1ODYz')); //in base64 just for obfuscating
const redirectURI = encodeURI('https://localhost:5173/callback');
const scopes = encodeURIComponent('api'); // give us the id_token and the refresh token, please
const panoptoBaseUrl = 'https://aalto.cloud.panopto.eu';
const authUrl = `/Panopto/oauth2/connect/authorize`;
const authEndpoint = `${panoptoBaseUrl}${authUrl}?client_id=${clientId}&redirect_uri=${redirectURI}&response_type=token&scope=${scopes}`;

</script>

<a type={"button"} href={authEndpoint} target="_blank">Panopto Login</a>
<!-- <a href={"api/v1/login"} target="_blank">Start2 Authentication</a> -->
<!-- <button onclick={clickHandler}>Start Authentication</button> -->
