const panoptoBaseUrl = 'https://aalto.cloud.panopto.eu';

// export const POST = async ({ request, params }) => {


//     console.log(params)

//     const res = await fetch(`${panoptoBaseUrl}/Panopto/${params.slug}`, {
//         method: 'GET',
//         headers: {
//             Authorization: request.headers.get('Authorization')
//         },

//     })


//     console.log(res)
//     const content = await res.json()
//     console.log(content)
//     return new Response(JSON.stringify(content), {
//         headers: {
//             'Content-Type': 'application/json'
//         }
//     });

// };

/** @type {import('./$types').RequestHandler} */
export const fallback = async ({ request, params }) => {
    console.log("Proxy to", `${panoptoBaseUrl}/Panopto/${params.slug}${request.url.split(params.slug)[1]}`)
    const res = await fetch(`${panoptoBaseUrl}/Panopto/${params.slug}${request.url.split(params.slug)[1]}`, {
        ...request,
        headers: {
            Authorization: request.headers.get('Authorization')
        },
    })
    console.log(request)
    const content = await res.text()
    console.log(content.length)
    return new Response(content, {
        headers: {...res.headers,
            "Access-Control-Allow-Origin": "https://aalto.cloud.panopto.eu",
            "Access-Control-Allow-Credentials": true
        },
        // headers: {
        //     'Content-Type': 'application/json'
        // }
    });
}
