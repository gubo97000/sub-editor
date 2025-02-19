import { authedFetch } from '$lib/apiWrapper';
export const prerender = false;
export const ssr = false;
// import { panoptoAuth as pA } from '$lib/stores/globalStatus.svelte';
export const load = async ({ params }) => {
    const fetchFolderContent = async (folderId = "", index = 0) => {
        const res = await authedFetch(
            `/api/v1/proxy/api/v1/folders/${folderId}/sessions?pageNumber=${index}`, //without page number will loop forever
            // {
            //     method: 'GET',
            //     headers: {
            //         // Authorization: 'Bearer ' + pA.accessToken
            //         Authorization: 'Bearer ' + localStorage.getItem('')
            //     }
            // }
        );
        let data = await res.json();
        if (data.Results.length > 0) {
            console.log(data.Results);
            data.Results = data.Results.concat((await fetchFolderContent(folderId, index + 1))?.Results ?? []);
        }
        console.log(data);
        return data;
    };

    const folder = await fetchFolderContent(params.id);
    // Form a videoLib
    let videoLib = {}
    folder?.Results.map((video) => {
        videoLib[video.Id] = {
            video: {
                name: video.Name,
                // description: video.Description,
                // id: video.Id,
                // thumbnail: video.ThumbnailUrl,
                // url: `${panoptoBaseUrl}/Panopto/Pages/Viewer.aspx?id=${video.Id}`
            }
        }
    });
    console.log(folder);
    return { folder, videoLib };
}