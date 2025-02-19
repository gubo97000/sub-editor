const panoptoBaseUrl = 'https://aalto.cloud.panopto.eu';

/** @type {import('./$types').RequestHandler} */
export const fallback = async ({ request, params }) => {
    console.log("Proxy to", `${panoptoBaseUrl}/Panopto/${params.slug}${request.url.split(params.slug)[1]}`)
    let body;
    if (request.method === "POST") {
        body = await request.text();
    }

    const res = await fetch(`${panoptoBaseUrl}/Panopto/${params.slug}${request.url.split(params.slug)[1]}`, 
    {
        method: request.method,
        headers: request.headers,
        body,
        redirect: 'manual',
    }
)

    return res
}
