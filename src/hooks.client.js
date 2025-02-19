
import { PUBLIC_BASE_URL, PUBLIC_PANOPTO_URL } from '$env/static/public';
const clientId = encodeURIComponent(atob('Yzk0NTE3ZWItYzBjNy00ODJiLTkwNzctYjFmMDAwMDg1ODYz')); //in base64 just for obfuscating
const redirectURI = encodeURI(PUBLIC_BASE_URL + '/callback');
const scopes = encodeURIComponent('api'); // give us the id_token and the refresh token, please
const panoptoBaseUrl = PUBLIC_PANOPTO_URL;
const authUrl = `/Panopto/oauth2/connect/authorize`;
const authEndpoint = `${panoptoBaseUrl}${authUrl}?client_id=${clientId}&redirect_uri=${redirectURI}&response_type=token&scope=${scopes}`;


// export const handle = async ({ event, resolve }) => {
//     const cookies = event.request.headers.get('cookie') || '';
//     const allCookies = cookies.split('; ').reduce((acc, cookie) => {
//         const [name, value] = cookie.split('=');
//         acc[name] = value;
//         return acc;
//     }, {});
//     event.locals.cookies = allCookies;
//     console.log("All Cookies", allCookies);
//     return resolve(event);
// };

/**
 * @type {import('@sveltejs/kit').Reroute}
 */
export const reroute = async ({ url }) => {
    // console.log(url)
    // const newUrl =new URL (url)
    // console.log(newUrl)
    // console.log(newUrl.searchParams.entries())
    // return newUrl.toString()
}


// export const handleError = async ({ error, event, status, message }) => {

//     console.log("error", error, status, message, event)
//     if (status === 401) {

//         if (
//             window.confirm("Authenticate in Panopto (allow popups on this site)")
//         ) {
//             window.open(authEndpoint, '_blank');
//         }
//     }
// };


// // export async function handleFetch({ request, fetch }) {
// //     const response = await fetch(request);
//     console.log("handling")
//     // Check if the response status is 401
//     if (response.status === 401) {
//         console.log("error")
//         // Open the URL in a new tab
//         window.open(authEndpoint, '_blank');
//     }

//     return response;
// }
