// src/routes/api/data/+server.ts
import { PANOPTO_CLIENT_ID } from '$env/static/private';

const redirectURI = encodeURI('http://localhost:5173/api/v1/auth/callback');
const scopes = encodeURIComponent('api'); 
const clientId = encodeURIComponent(PANOPTO_CLIENT_ID); 
const panoptoBaseUrl = 'https://aalto.cloud.panopto.eu';
const authUrl = `/Panopto/oauth2/connect/authorize`;
const authEndpoint = `${panoptoBaseUrl}${authUrl}?client_id=${clientId}&redirect_uri=${redirectURI}&response_type=code&scope=${scopes}&nonce=1`;

export const POST = async () => {
    console.log('POST, redirecting to Panopto login page');
    // make a 302 redirect to the Panopto login page
    return Response.redirect(
        authEndpoint,
         302);
};

export const GET = async () => {
    console.log('GET, redirecting to Panopto login page');
    // make a 302 redirect to the Panopto login page
    return Response.redirect(
        authEndpoint,
         302);
};
