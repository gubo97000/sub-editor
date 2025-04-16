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
	// console.log('GET');
	// /** @type {string[]} */
	// const reqData = JSON.parse(new TextDecoder().decode((await request.body?.getReader().read())?.value));

	//////////////////////////////////////


	const formData = await request.formData()
	console.log(formData)
	const options = JSON.parse(formData.get("options"))
	// const reqData = JSON.parse(new TextDecoder().decode((await request.body?.getReader().read())?.value));
	// const options = reqData.options;
	// const data = reqData.data;
	const data = JSON.parse(formData.get("data"))

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
		apiKey: options?.apiKey ?? "",
		temperature: 0.8,
		verbose: true
	});

	console.log(data?.length);
	// const theList = z.array(z.string());
	//Create a structuredLLM model with the list
	// const structuredLLM = model.withStructuredOutput(theList);
	const preamble = `You are an expert english to finnish translator, 
	translate the following list of strings from English to Finnish in the most natural sounding way possible, 
	output list has to have the SAME number of strings be VERY careful, do not talk, only create the list, omit \`\`\`json, start with '[': `
	let response = await model.invoke(preamble + JSON.stringify(data));

	//Parse and clean up the response
	const jsonContentParse = (response) => {
		try {
			let jsonContent = JSON.parse(response.content)
			return jsonContent
		} catch (error) {
			console.log("trying to clean up", response)
			let jsonContent = JSON.parse(String(response.content).replace(/```json/, "").replace(/```/, "").trim())
			return jsonContent
		}
	}

	const jsonContent = jsonContentParse(response)

	try {
		//Checking the length of the response
		if (jsonContent.length !== data.length) {
			console.log(jsonContent.length, data.length, "trying it again")
			response = await model.invoke(preamble + response.content + " YOU MADE A MISTAKE AND THE LIST WAS NOT THE SAME SIZE AS THE ORIGINAL, DO IT AGAIN, BE MORE VIGILANT, DO NOT TALK DO NOT APOLOGIZE, start with '['")
			console.log(jsonContent.length, "new")
			response.content = JSON.stringify(jsonContentParse(response))
		}

		const resData = new FormData()
		resData.append("data", JSON.stringify(response))
		return new Response(resData, {});

	} catch (error) {
		console.log("error parsing response", response)
		return new Response(JSON.stringify({ error }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json'
			}
		});
	}
};
