
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
    new SystemMessage("You are a helpful AI assistant."),
    ...messages.map((msg) => {
      if (msg.role === "user") {
        return new HumanMessage(msg.content);
      }

      return new AIMessage(msg.content);
    }),
  ]);

  return response.text;
}
