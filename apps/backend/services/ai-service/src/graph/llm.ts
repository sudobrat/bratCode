import { ChatOpenRouter } from "@langchain/openrouter";

export const llm = new ChatOpenRouter({
    model: "nvidia/nemotron-3-ultra-550b-a55b:free",
    temperature: 0,
    maxRetries: 2,
    // other params...
});
