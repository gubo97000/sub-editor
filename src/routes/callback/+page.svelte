<script>
	import { onMount } from 'svelte';
	let stateText = $state('Processing...');
	onMount(() => {
		//Get all parameter after the #
		const urlParams = new URLSearchParams(window.location.hash);
		const accessToken = urlParams.get('#access_token');
		// console.log(urlParams, accessToken);
		//list all the parameters
		for (let p of urlParams) {
			console.log(p);
		}
		if (accessToken) {
			localStorage.setItem('access_token', accessToken);
			stateText = 'access token found, setting cookie';
			fetch('/api/v1/proxy/api/v1/auth/legacyLogin', {
				method: 'GET',
				headers: {
					Authorization: 'Bearer ' + accessToken
				}
			}).then((res) => {
                console.log(res);
                if (res.status === 200) {
                    stateText = 'Login successful';
                } else {
                    stateText = 'Login failed';
                }
            });
			window.close();
		}
	});
</script>
<p>Hello</p>
<p>{stateText}</p>
