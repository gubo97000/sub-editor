import { panoptoAuth as pA } from '$lib/stores/globalStatus.svelte';

/** @type {import('./$types').PageLoad} */
export async function load({fetch, params }) {

	const res = await fetch(
		`/api/v1/proxy/api/v1/sessions/${params.id}`,
		{
			method: 'GET',
			headers: {
				Authorization: 'Bearer ' + pA.value.accessToken,
			}
		}
	);
	const sessionData = await res.json();
	if (!sessionData.Urls.CaptionDownloadUrl) {
		return ;
	}
	// console.log(sessionData.Urls.CaptionDownloadUrl.split('Panopto/'))
	const sub = await fetch(
		//Get only string after Panopto/
		`/api/v1/proxy/${sessionData.Urls.CaptionDownloadUrl.split('Panopto/')[1]}`,
		{
			method: 'GET',
			headers: {
				Authorization: 'Bearer ' + pA.value.accessToken,
				"Access-Control-Allow-Origin": "no-cors"
			}
		}
	);
	console.log(sub)
	const subData = await sub.text();
	return { sessionData, subData };
}