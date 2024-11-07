/** @type {import('./$types').PageLoad} */
export async function load({ params }) {

	const res = await fetch(
		`/api/v1/proxy/api/v1/sessions/${params.id}`,
		{
			method: 'GET',
			headers: {
				Authorization: 'Bearer ' + localStorage.getItem('access_token')
			}
		}
	);
	const sessionData = await res.json();
	console.log(sessionData.Urls.CaptionDownloadUrl.split('Panopto/'))
	const sub = await fetch(
		//Get only string after Panopto/
		`/api/v1/proxy/${sessionData.Urls.CaptionDownloadUrl.split('Panopto/')[1]}`,
		{
			method: 'GET',
			headers: {
				Authorization: 'Bearer ' + localStorage.getItem('access_token'),
				"Access-Control-Allow-Origin": "no-cors"
			}
		}
	);
	console.log(sub)
	const subData = await sub.text();
	return { sessionData, subData };
}