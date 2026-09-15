import { ChatOpenRouter } from "@langchain/openrouter";

export const llm = new ChatOpenRouter({
    model: "openrouter/free",
    temperature: 0,
    // other params...
});
