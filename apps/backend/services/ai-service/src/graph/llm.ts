import { ChatOpenRouter } from "@langchain/openrouter";

export const llm = new ChatOpenRouter({
    model: "poolside/laguna-xs-2.1:free",
    temperature: 0,
    maxRetries: 2,
    // other params...
});
