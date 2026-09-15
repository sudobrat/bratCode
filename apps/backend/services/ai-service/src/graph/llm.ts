import { ChatOpenRouter } from "@langchain/openrouter";

export const llm = new ChatOpenRouter({
    model: "google/gemma-4-31b-it:free",
    temperature: 0,
    maxRetries: 2,
    // other params...
});
