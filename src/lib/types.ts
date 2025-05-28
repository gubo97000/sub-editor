export type VideoLibContext = {
	saveSubtitle: (subToSave: any, video: any, element?: undefined) => Promise<true | undefined>;
	loadVideoEntry: (id: string) => Promise<string>;
	loadSubtitles: (id: string) => Promise<
		{
			text: string;
			id: any;
			language: string;
		}[]
	>;
	getVideoEntrySync: (id: string) => string;
};

export type AlertsContext = { parsingErrors: { message: string }[] };

export type CustomLLMEndpoints = Record<
	string,
	{
		endpoint: string;
		model: string;
		apiKey: string;
		commands: string;
		chunkSize?: number;
	}
>;
export type CustomOptions = {
	model: CustomLLMEndpoints extends Record<any, infer V> ? V : never;
	commands?: string;
};
