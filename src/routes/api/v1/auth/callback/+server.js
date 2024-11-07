// src/routes/api/data/+server.ts
import { PANOPTO_CLIENT_ID, PANOPTO_CLIENT_SECRET } from '$env/static/private';

const panoptoBaseUrl = 'https://aalto.cloud.panopto.eu';
const tokenUrl = `/Panopto/oauth2/connect/token`;

export const GET = async ({ request }) => {
    // console.log(request)
    //create a POST request to the Panopto token endpoint
    const data = {
        grant_type: "authorization_code",
        code: new URL(request.url).searchParams.get('code'),
        redirect_uri: "http://localhost:5173/api/v1/auth/callback",
    }

    const response = await fetch(`${panoptoBaseUrl}${tokenUrl}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${Buffer.from(`${PANOPTO_CLIENT_ID}:${PANOPTO_CLIENT_SECRET}`).toString('base64')}`
        },
        // body must be encoded 'application/x-www-form-urlencoded'
        body: new URLSearchParams(data).toString()
    })

    // return new Response(res, {
    //     headers: {
    //         'Set-Cookie': `panopto_access_token=${await response?.json()?.access_token}; Secure; HttpOnly; SameSite=None;`,
    //         'Content-Type': 'text/plain'
    //     }
    // });
    // return Response.redirect(
    //     'http://localhost:5173',
    //      302);
}
