// holy shit i guess we're doin this
const fetch = require("node-fetch");
import { Message, MessageChunk } from "../main/ts/conversation_interfaces";
export class RequestOptions {
    use_string: boolean;
    temperature: number;
    min_length: number;
    max_length: number;

    constructor(use_string: boolean, temperature: number, min_length: number, max_length: number){
        this.use_string = use_string;
        this.temperature = temperature;
        this.min_length = min_length;
        this.max_length = max_length;
    }
}

const STREAM_URL: string = "/generate-stream";
const CHAT_URL: string = "/generate";

export class NovelAi {
    baseURL: string;
    apiKey: string;

    constructor(baseURL: string, apiKey: string){
        this.baseURL = baseURL;
        this.apiKey = apiKey;
    }

    async createCompletion(model: string, prompt: string | Message[], stream: boolean, options?: RequestOptions){
        // var headers: Headers = new Headers();
        // headers.set('Content-Type', 'application/json');
        // headers.set('Accept', 'application/json');
        // headers.set("Authorization", `Bearer ${this.apiKey}`)

        const body: object = {
            input: prompt as String,//((prompt instanceof String ) ? prompt : this.messagesToPrompt(prompt)),
            model: model,
            parameters: options
        }
        console.log(this.baseURL+(stream ? CHAT_URL : STREAM_URL))
        

        let content = await fetch(this.baseURL+(stream ? STREAM_URL : CHAT_URL), {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Authorization": `Bearer ${this.apiKey}`
            },
            body: JSON.stringify(body)
        });
        if (!content.ok){
            return {
                "error": await content.text()
            }
        }
        return {
            content: (stream ? content.text() : await content.text())
        }

    }

    messagesToPrompt(messages: Message[]){
        let prompt: string = "";
        for(const message of messages){
            if(message["name"]){
                prompt += `${message["name"]} (${message.role}): `
            } else {
                prompt += `${message.role}: `
            }
            prompt += `${message["content"]}\n`
        }
        return prompt
    }
}