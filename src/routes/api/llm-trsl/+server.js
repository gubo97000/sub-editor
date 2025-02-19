// src/routes/api/data/+server.ts
import { AALTO_API_KEY, GLHF_API_KEY } from '$env/static/private';
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
        // configuration: {
        //     baseURL: 'https://glhf.chat/api/openai/v1',
        //     apiKey: GLHF_API_KEY,
        //     // baseURL: 'http://10.0.0.1:1234/v1',
        //     // apiKey: 'lm-studio'
        // },
        configuration: {
            baseURL: 'https://ai-gateway.k8s.aalto.fi/v1',
            apiKey: AALTO_API_KEY
        },
        // model: "hf:Qwen/Qwen2-72B-Instruct",
        model: "hf:meta-llama/Meta-Llama-3.1-405B-Instruct",
        // model: "hf:microsoft/Phi-3.5-MoE-instruct",
        apiKey: GLHF_API_KEY,
        // model: "TheBloke/Poro-34B-GGUF/poro-34b.Q3_K_S.gguf",
        // apiKey: 'lm-studio',
        temperature: 0.8,
        verbose: true
    });

    const preamble = `You are an expert Finnish speaker, check for error or possible improvements in the following list of strings,
     INSTRUCTIONS:
    - is very possible that no error or suggestions are found, SKIP the subtitle 
    - You only need to check for mistranscriptions, mistakes, capitalization based on the context
    - checking the prase before and after helps understanding the context
    - do NOT talk, ONLY output an JSON COMPLIANT array of this elements: {"index": number, "errorString":string, "correctionString":string, "note"?:string}
    - if no corrections are found output: "[]"
    - start with '['
    here the file: `;

    const response = await model.invoke(preamble + JSON.stringify(reqData));
    // console.log(response);
    return new Response(JSON.stringify(response), {
        headers: { 'Content-Type': 'application/json' }
    });
};
