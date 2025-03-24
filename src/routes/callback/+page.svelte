<script>
	import { PUBLIC_PANOPTO_URL } from '$env/static/public';
	import { panoptoAuth as pA } from '$lib/stores/globalStatus.svelte';
	import { onMount } from 'svelte';
	let stateText = $state('Processing...');
	
	onMount(() => {
		//Get all parameter after the #
		const urlParams = new URLSearchParams(window.location.hash);
		const newAccessToken = urlParams.get('#access_token');
		// console.log(urlParams, accessToken);
		//list all the parameters
		for (let p of urlParams) {
			console.log(p);
		}
		if (newAccessToken) {
			pA.value.accessToken = newAccessToken;
			// localStorage.setItem('access_token', newAccessToken);
			stateText = 'access token found, setting cookie';
			// fetch('/api/v1/getCookie',{
			// 	method: 'GET',
			// 	headers: {
			// 		Authorization: 'Bearer ' + accessToken
			// 	}
			// })
			fetch('/api/v1/proxy/api/v1/auth/legacyLogin', {
			// fetch(PUBLIC_PANOPTO_URL + '/Panopto/api/v1/auth/legacyLogin', {
				method: 'GET',
				headers: {
					Authorization: 'Bearer ' + pA.value.accessToken
				}
			}).then((res) => {
				console.log(res);
				if (res.status === 200) {
					stateText = 'Login successful';
					res.text().then((data) => {
						console.log('The data' + data);
						window.close();
					});
				} else {
					stateText = 'Login failed';
				}
			}).catch((err) => {
				console.log(err);
				stateText = 'Login failed, Fetch error';
			});
		}
	});
</script>

<p>Hello</p>
<p>{stateText}</p>
