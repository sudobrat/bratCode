import { ChatOpenRouter } from "@langchain/openrouter";

export const llm = new ChatOpenRouter({
    model: "deepseek/deepseek-chat",
    temperature: 0,
    // other params...
});
