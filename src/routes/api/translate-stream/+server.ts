// src/routes/api/data/+server.ts
import { AALTO_API_KEY, GLHF_API_KEY } from '$env/static/private';
import { ChatOpenAI } from '@langchain/openai';
import { maxLength } from 'zod/v4';
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

	const formData = await request.formData();
	console.log(formData);
	const options = JSON.parse(formData.get('options') as string);
	// const reqData = JSON.parse(new TextDecoder().decode((await request.body?.getReader().read())?.value));
	// const options = reqData.options;
	// const data = reqData.data;
	const data = JSON.parse(formData.get('data') as string);

	const customConfig = {
		configuration: {
			baseURL: options.apiUrl,
			apiKey: options?.apiKey ?? ''
		},
		model: options.model,
		apiKey: options?.apiKey ?? ''
	};

	const AaltoConfig = {
		configuration: {
			baseURL: 'https://ai-gateway.k8s.aalto.fi/v1',
			apiKey: AALTO_API_KEY
		},
		// model: "depseek-r1-distill-qwen-14b",
		model: 'llama-3.1-8b-instruct-fp8-l4',
		apiKey: AALTO_API_KEY
	};

	const model = new ChatOpenAI({
		...(options.apiUrl ? customConfig : AaltoConfig),
		// ...GlhfConfig,
		apiKey: options?.apiKey ?? '',
		temperature: 0.8,
		openAIApiKey: options?.apiKey ?? '',
		// timeout:900000000,
		// verbose: true
	}).withStructuredOutput(translateSchema(data?.length));

	console.log(data?.length);
	const preamble = `You are an expert English to Finnish translator, 
translate the following list of strings from English to Finnish in the most natural sounding way possible`;

	// Create a ReadableStream for SSE
	const stream = new ReadableStream({
		async start(controller) {
			try {
                console.log('Starting streaming translation');
				for await (const chunk of await model.stream(preamble + JSON.stringify(data))) {
                    // console.log('Chunk received:', chunk.length);
                    // console.log("- ",chunk);
					// Format as SSE data
					// const sseData = `data: ${JSON.stringify(chunk)}\n\n`;
					const sseData = `${JSON.stringify(chunk)}`;
					controller.enqueue(new TextEncoder().encode(sseData));
					// controller.enqueue(JSON.stringify(chunk));

				}
                console.log('Streaming completed successfully');
				// Send completion signal
				// controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
				controller.close();
			} catch (error) {
				console.error('Streaming error:', error);
				const errorData = `data: ${JSON.stringify({ error: error.message })}\n\n`;
				controller.enqueue(new TextEncoder().encode(errorData));
				controller.close();
			}
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			'Connection': 'keep-alive',
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Headers': 'Content-Type'
		}
	});
};

const hintSchema = {
	type: 'array',
	items: {
		type: 'object',
		properties: {
			index: {
				type: 'integer'
			},
			errorString: {
				type: 'string'
			},
			correctionString: {
				type: 'string'
			},
			note: {
				type: 'string'
			}
		},
		required: ['index', 'errorString', 'correctionString', 'note']
	}
};

const translateSchema = (length: number = 0) => {
	return {
		type: 'array',
		items: {
			type: 'string'
		},
		...(length > 0
			? {
					minItems: length,
					maxLength: length
				}
			: {})
	};
};
