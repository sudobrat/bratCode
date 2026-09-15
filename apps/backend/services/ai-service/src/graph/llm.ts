import { ChatOpenRouter } from "@langchain/openrouter";

export const llm = new ChatOpenRouter({
    model: "nex-agi/nex-n2.5-pro:free",
    temperature: 0,
    maxRetries: 2,
    // other params...
});
