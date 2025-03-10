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
	console.log('GET');
	/** @type {string[]} */
	const reqData = JSON.parse(new TextDecoder().decode((await request.body?.getReader().read())?.value));
	const AaltoConfig = {
		configuration: {
			baseURL: 'https://ai-gateway.k8s.aalto.fi/v1',
			apiKey: AALTO_API_KEY
		},
		// model: "depseek-r1-distill-qwen-14b",
		model: "llama-3.1-8b-instruct-fp8-l4",

		apiKey: AALTO_API_KEY,
	}
	const GlhfConfig = {
		configuration: {
			baseURL: 'https://glhf.chat/api/openai/v1',
			apiKey: GLHF_API_KEY
		},
		model: "hf:meta-llama/Meta-Llama-3.1-405B-Instruct",
		apiKey: GLHF_API_KEY,
	}
	const model = new ChatOpenAI({
        ...AaltoConfig,
        // ...GlhfConfig,
        
        temperature: 0.8,
        verbose: true
    });

	console.log(reqData?.length);
	// const theList = z.array(z.string());
	//Create a structuredLLM model with the list
	// const structuredLLM = model.withStructuredOutput(theList);
	const preamble = `You are an expert english to finnish translator, 
	translate the following list of strings from English to Finnish in the most natural sounding way possible, 
	output list has to have the SAME number of strings be VERY careful, do not talk, only create the list, start with '[': `
	let response = await model.invoke(preamble + JSON.stringify(reqData));

	if (JSON.parse(response.content).length !== reqData.length) {
		console.log(JSON.parse(response.content).length, reqData.length, "trying it again")
		response = await model.invoke(preamble + response.content + " YOU MADE A MISTAKE AND THE LIST WAS NOT THE SAME SIZE AS THE ORIGINAL, DO IT AGAIN, BE MORE VIGILANT, DO NOT TALK DO NOT APOLOGIZE, start with '['")
		console.log(JSON.parse(response.content).length, "new")
	}


	return new Response(JSON.stringify(response), {
		headers: { 'Content-Type': 'application/json' }
	});
};
