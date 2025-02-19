import { register } from 'node-network-devtools';

process.env.NODE_ENV === 'development' && register()

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

// 	console.log("error", error, status, message, event)
// };