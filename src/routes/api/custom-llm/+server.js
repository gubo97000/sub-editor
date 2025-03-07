// src/routes/api/data/+server.ts
import { AALTO_API_KEY, GLHF_API_KEY } from '$env/static/private';
import { ChatOpenAI, OpenAI } from '@langchain/openai';
export const POST = async ({ request }) => {

    const reqData = JSON.parse(new TextDecoder().decode((await request.body?.getReader().read())?.value));
    const options = reqData.options;
    const data = reqData.data;

    const customConfig = {
        configuration: {
            baseURL: options.apiUrl,
            apiKey: options?.apiKey ?? "",
        },
        model: options.model,
        apiKey: options?.apiKey ?? "",
    }

    const AaltoConfig = {
        configuration: {
            baseURL: 'https://ai-gateway.k8s.aalto.fi/v1',
            apiKey: AALTO_API_KEY
        },
        // model: "depseek-r1-distill-qwen-14b",
        model: "llama-3.1-8b-instruct-fp8-l4",
        apiKey: AALTO_API_KEY,
    }

    const model = new ChatOpenAI({
        ...(options.apiUrl ? customConfig : AaltoConfig),
        // ...GlhfConfig,

        temperature: 0.8,
        verbose: true
    });

    const preamble = `You are a good editor, you will receive some instructions to edit subtitles follow them carefully,
    You will receive subtitles in the following format and you NEED to output the correction in the format after the ->, use this example only for format and structure not for content, except the index matching:
    ["2 - John duffers blorn, and the mathematical equivalent of"] -> [{"index": 2, "errorString":"John duffers blorn", "correctionString":"", "note"?:"allucination or mistranscription"}]
    ["6 - So you can look here that the knot flips the inputs."] -> [{"index": 6, "errorString":"knot", "correctionString":"NOT", "note"?:"mistranscription"}]
    ["45 - And now we explain by what principles"] -> [] //there is nothing to correct
    INSTRUCTIONS:
    - is very possible that no edit is required, SKIP the subtitle 
    - checking the phrase before and after helps understanding the context
    - do NOT talk, ONLY output an JSON COMPLIANT array of this elements: {"index": number, "errorString":string, "correctionString":string, "note"?:string}
    - if no corrections are found output: "[]"
    - start with '['
    - do not use markdown

    HERE THE IMPERATIVE COMMANDS that you MUST follow:
    ${options.commands}

    here the file: `;

    const response = await model.invoke(preamble + JSON.stringify(reqData));
    // console.log(response);
    return new Response(JSON.stringify(response), {
        headers: { 'Content-Type': 'application/json' }
    });
};
