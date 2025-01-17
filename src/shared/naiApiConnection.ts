import { Message, MessageChunk } from "../main/ts/conversation_interfaces";
const contextLimits = require("../../public/contextLimits.json");

import { NovelAi, RequestOptions } from "./NovelAiClient";
import { ApiConnectionInterface } from "./apiConnectionInterface";
import tiktoken from "js-tiktoken";
import { ApiConnectionConfig } from "./Config";
import { ApiConnection, Parameters } from "./apiConnection";
import OpenAI from "openai";

export interface apiConnectionTestResult{
    success: boolean,
    overwriteWarning?: boolean;
    errorMessage?: string,
}

export interface Connection{
    type: string; //openrouter, openai, ooba
    baseUrl: string;
    key: string;
    model: string;
    forceInstruct: boolean ;//only used by openrouter
    overwriteContext: boolean;
    customContext: number;
}

let encoder = tiktoken.getEncoding("cl100k_base");

export class NaiApiConnection implements ApiConnectionInterface {
    type: string; //openrouter, openai, ooba, custom
    client: NovelAi;
    model: string;
    forceInstruct: boolean ;//only used by openrouter
    requestOptions: RequestOptions;
    parameters: Parameters
    context: number;
    overwriteWarning: boolean;
    

    constructor(connection: Connection, parameters: Parameters){
        this.type = connection.type;
        this.client = new NovelAi(
            connection.baseUrl,
            connection.key
        )
        this.model = connection.model;
        this.forceInstruct = connection.forceInstruct;
        this.parameters = parameters;
        this.requestOptions = new RequestOptions(true, parameters.temperature, 10, 30)
        

        let modelName = this.model
        if(modelName && modelName.includes("/")){
            modelName = modelName.split("/").pop()!;
        }

        if(connection.overwriteContext){
            console.log("Overwriting context size!");
            this.context = connection.customContext;
            this.overwriteWarning = false;
        }
        else if(contextLimits[modelName]){
            this.context = contextLimits[modelName];
            this.overwriteWarning = false;
        }
        else{
            console.log(`Warning: couldn't find ${this.model}'s context limit. context overwrite value will be used!`);
            this.context = connection.customContext;
            this.overwriteWarning = true;
        }
    }

    
    isChat(): boolean {
        if(this.type === "novelAi"){
            return true;
        }
        else{
            return false;
        }
    }
    

    async complete(prompt: string | Message[], stream: boolean, otherArgs: object, streamRelay?: (arg1: MessageChunk)=> void,  ): Promise<string> {


        //OPENAI DOESNT ALLOW spaces inside message.name so we have to put them inside the Message content.
        console.log(prompt);
        
        let completion = await this.client.createCompletion(
            this.model,
            prompt,
            stream,
            this.requestOptions
        )

        let response: string = "";

        //@ts-ignore
        if(completion["error"]){
            //@ts-ignore
            throw completion.error;
        }
        

        if(stream){

            // @ts-ignore
            for await(const chunk of completion){
                let msgChunk: MessageChunk = chunk.choices[0].delta;
                if(msgChunk.content){
                    streamRelay!(msgChunk);
                    response += msgChunk.content;
                }   
            }
            
        }
        else{
            // @ts-ignore
            response = completion.content;
        }

        console.log(response);
        return response;
    
    }

    async testConnection(): Promise<apiConnectionTestResult>{
        let prompt: string | Message[];
        if(this.isChat()){
            prompt = [
                {
                    role: "user",
                    content: "ping"
                }
            ]
        }else{
            prompt = "ping";
        }

        return this.complete(prompt, false, {max_tokens: 1}).then( (resp) =>{
            if(resp){
                return {success: true, overwriteWarning: this.overwriteWarning };
            }
            else{
                return {success: false, overwriteWarning: false, errorMessage: "no response, something went wrong..."};
            }
        }).catch( (err) =>{
            return {success: false, overwriteWarning: false, errorMessage: err}
        });
    }

    calculateTokensFromText(text: string): number{
          return encoder.encode(text).length;
    }

    calculateTokensFromMessage(msg: Message): number{
        let sum = encoder.encode(msg.role).length + encoder.encode(msg.content).length

        if(msg.name){
            sum += encoder.encode(msg.name).length;
        }

        return sum;
    }

    calculateTokensFromChat(chat: Message[]): number{        
        let sum=0;
        for(let msg of chat){
           sum += this.calculateTokensFromMessage(msg);
        }

        return sum;
    }

   
}