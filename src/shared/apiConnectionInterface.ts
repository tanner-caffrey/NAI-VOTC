import { Message, MessageChunk } from "../main/ts/conversation_interfaces";
import OpenAI from "openai";
const contextLimits = require("../../public/contextLimits.json");

import tiktoken from "js-tiktoken";
import { ApiConnectionConfig } from "./Config";
import { NovelAi } from "./NovelAiClient";

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

export interface Parameters{
    temperature: number,
	frequency_penalty: number,
	presence_penalty: number,
	top_p: number,
}

let encoder = tiktoken.getEncoding("cl100k_base");

export interface ApiConnectionInterface{
    type: string; //openrouter, openai, ooba, custom
    client: OpenAI | NovelAi;
    model: string;
    forceInstruct: boolean ;//only used by openrouter
    context: number;
    overwriteWarning: boolean;

    isChat(): boolean;
    complete(prompt: string | Message[], stream: boolean, otherArgs: object, streamRelay?: (arg1: MessageChunk)=> void,  ): Promise<string>
    testConnection(): Promise<apiConnectionTestResult>;

    calculateTokensFromText(text: string): number;

    calculateTokensFromMessage(msg: Message): number;

    calculateTokensFromChat(chat: Message[]): number;
}

