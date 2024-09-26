// src/routes/api/data/+server.ts
import { GLHF_API_KEY } from '$env/static/private';
import { ChatOpenAI } from '@langchain/openai';
export const POST = async ({ request }) => {
    // const model = new ChatOpenAI({
    // 	configuration: {
    // 		baseURL: 'http://localhost:1234/v1',
    // 		apiKey: 'lm-studio'
    // 	},
    // 	apiKey: 'lm-studio',
    // 	temperature: 0
    // });
    const reqData = JSON.parse(new TextDecoder().decode((await request.body?.getReader().read())?.value));
    const model = new ChatOpenAI({
        configuration: {
            baseURL: 'https://glhf.chat/api/openai/v1',
            apiKey: GLHF_API_KEY
        },
        // model: "hf:Qwen/Qwen2-72B-Instruct",
        model: "hf:meta-llama/Meta-Llama-3.1-405B-Instruct",
        apiKey: GLHF_API_KEY,
        temperature: 0.8,
        verbose: true
    });

    const preamble = `You are a good transcriber,
    You ONLY check for possible mistranscription or allucination errors during the process, like:
    ["2 - John duffers blorn, and the mathematical equivalent of"] -> [{"index": 2, "errorString":"John duffers blorn", "correctionString":"", "note"?:"allucination or mistranscription"}]
    ["6 - So you can look here that the knot flips the inputs."] -> [{"index": 6, "errorString":"knot", "correctionString":"NOT", "note"?:"mistranscription"}]
    ["45 - And now we explain by what principles"] -> [] //possible repharsing, grammatical error ignored because is NOT you job
    INSTRUCTIONS:
    - is very possible that no error or suggestions are found, SKIP the subtitle 
    - You only need to check for mistranscriptions, mistakes, capitalization based on the context
    - checking the prase before and after helps understanding the context
    - do NOT talk, ONLY output an JSON COMPLIANT array of this elements: {"index": number, "errorString":string, "correctionString":string, "note"?:string}
    - if no corrections are found output: "[]"
    - start with '['
    - this is the dictionary of special terms used in this contex {"MyCourses","A+"}
    here the file: `;

    const response = await model.invoke(preamble + JSON.stringify(reqData));
    // console.log(response);
    return new Response(JSON.stringify(response), {
        headers: { 'Content-Type': 'application/json' }
    });
};
