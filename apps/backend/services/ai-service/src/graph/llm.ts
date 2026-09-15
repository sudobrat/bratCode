import { ChatOpenRouter } from "@langchain/openrouter";

export const llm = new ChatOpenRouter({
    model: "deepseek/deepseek-chat:free",
    temperature: 0,
    maxRetries: 2,
    // other params...
});
