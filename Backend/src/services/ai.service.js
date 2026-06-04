import "dotenv/config";
import { ChatMistralAI } from "@langchain/mistralai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

const model = new ChatMistralAI({
  model: "mistral-large-latest",
  apiKey: process.env.MISTRAL_API_KEY,
  temperature: 0,
});

let chatHistory = [];
const MAX_MESSAGES = 20;

export async function askAI(message) {
  try {
    console.log("📤 Sending request...");

    chatHistory.push(new HumanMessage(message));

    const result = await model.invoke([
      new SystemMessage("You are a helpful assistant."),
      ...chatHistory,
    ]);

    const response = result.content;

    chatHistory.push(result);

    chatHistory = chatHistory.slice(-MAX_MESSAGES);

    return response;

  } catch (err) {
    console.error("❌ Error:", err);
    return `Error: ${err.message}`;
  }
}