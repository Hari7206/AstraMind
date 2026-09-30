import { ChatOpenAI } from "@langchain/openai";
import {
  HumanMessage,
  SystemMessage,
  AIMessage,
} from "@langchain/core/messages";

const model = new ChatOpenAI({
  model: "nvidia/llama-3.1-nemotron-70b-instruct",
  apiKey: process.env.NVIDIA_API_KEY,
  temperature: 0,
  configuration: {
    baseURL: "https://integrate.api.nvidia.com/v1",
  },
});

export async function generateMistralResponse(messages) {
  const response = await model.invoke([
    new SystemMessage(
      `You are a helpful AI assistant. 
Answer the user's question directly, clearly, and concisely.
DO NOT show your reasoning, thinking process, analysis, or internal thoughts.
DO NOT write things like "Here's a thinking process", "Analyze User Input", "Identify the Core Topic", etc.
Just give the final answer with clean bullet points when helpful.`
    ),
    ...messages.map((msg) => {
      if (msg.role === "user") {
        return new HumanMessage(msg.content);
      }
      return new AIMessage(msg.content);
    }),
  ]);

  let text = response.text || "";

  text = text
    .replace(/^(Here'?s? (a |the )?thinking process[:\.]?[\s\S]*?)(?=\n\n(?=[A-Z]))/i, "")
    .replace(/^Analyze User Input[\s\S]*?(?=\n\n[A-Z][a-z])/i, "")
    .replace(/^(Identify the Core Topic|Extract Key Information|Synthesize)[\s\S]*?(?=\n\n[A-Z][a-z])/i, "")
    .trim();

  return text;
}