<script>
	import Auth from './auth.svelte';

	const panoptoBaseUrl = 'https://aalto.cloud.panopto.eu/Panopto';

	const clickHandler = async () => {
		const headers = {
			Authorization: 'Bearer ' + localStorage.getItem('access_token'),
			'Access-Control-Allow-Origin': '*'
		};
		const response = await fetch(panoptoBaseUrl + '/api/v1/users/me/sessions/viewed', {
			method: 'GET',
			headers
		});
		console.log(response);
	};
	const clickHandler2 = async () => {
		fetch('/api/v1/proxy/api/v1/users/me/sessions/viewed', {
			method: 'GET',
			headers: {
				Authorization: 'Bearer ' + localStorage.getItem('access_token')
			}
		})
			.then((res) => {
				return res.json();
			})
			.then((data) => {
				console.log(data);
			})
			.catch((err) => {
				console.log(err);
			});
	};
</script>
<!-- 
<button onclick={clickHandler}>test</button>
<button onclick={clickHandler2}>me</button> -->
