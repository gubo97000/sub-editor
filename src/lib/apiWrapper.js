import { PUBLIC_BASE_URL, PUBLIC_PANOPTO_URL } from '$env/static/public';
const clientId = encodeURIComponent(atob('Yzk0NTE3ZWItYzBjNy00ODJiLTkwNzctYjFmMDAwMDg1ODYz')); //in base64 just for obfuscating
const redirectURI = encodeURI(PUBLIC_BASE_URL + '/callback');
const scopes = encodeURIComponent('api'); // give us the id_token and the refresh token, please
const panoptoBaseUrl = PUBLIC_PANOPTO_URL;
const authUrl = `/Panopto/oauth2/connect/authorize`;
export const AUTH_ENDPOINT = `${panoptoBaseUrl}${authUrl}?client_id=${clientId}&redirect_uri=${redirectURI}&response_type=token&scope=${scopes}`;


export const handleFetchResult = async (res) => {
    if (res.ok) {
        return
    } else {
        throw res.status;
    }
}

/**
 * Performs an authenticated fetch request.
 * 
 * @param {RequestInfo} endpoint - The endpoint URL to fetch.
 * @param {RequestInit} [options={}] - Optional fetch options.
 * @returns {Promise<Response>} - The fetch response.
 */
export const authedFetch = async (endpoint, options={}) => {
    console.log("authedFetch")
    const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
            Authorization: 'Bearer ' + (await import("./stores/globalStatus.svelte")).panoptoAuth.accessToken,
            // Authorization: 'Bearer ' + JSON.parse(localStorage.getItem('auth')??"")?.accessToken
        },
        ...options
    })

    console.log(response)
    if (!response.ok && window) {
        switch (response.status) {
            case 401:
                if (
                    window.confirm("Authenticate in Panopto (allow popups on this site)")
                ) {
                    window.open(AUTH_ENDPOINT, '_blank');
                }
                break;

            default:
                throw new Error(`Response status: ${response.status}`);
                break;
        }
    }
    return Promise.resolve(response);

}