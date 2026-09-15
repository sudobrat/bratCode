import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

export const llm = new ChatGoogleGenerativeAI({
    model: "gemini-3.5-flash-lite",
    temperature: 0,
    maxRetries: 2,
    apiKey: process.env.GEMINI_API_KEY,
    // other params...
});
