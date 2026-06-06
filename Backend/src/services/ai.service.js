import "dotenv/config";
import { ChatMistralAI } from "@langchain/mistralai";
import { HumanMessage , SystemMessage , AIMessage} from "@langchain/core/messages";

const model = new ChatMistralAI({
  model: "mistral-large-latest",
  apiKey: process.env.MISTRAL_API_KEY,
  temperature: 0,
});

export async function generateResponse(messages) {
  const response = await model.invoke( messages.map((msg) => {
    if (msg.role === "user") {
      return new HumanMessage(msg.content); 
    } else if (msg.role === "ai") {
      return new AIMessage(msg.content); 
    }
  })
  );
  return response.text;
}

export async function generateTitle(message) {
  const response = await model.invoke([
    new SystemMessage(`You are a helpful assistant that generates concise and descriptive titles for given content.
      
      user will provide you with a message, and you will generate a title that captures the essence of the message in a few words. The title should be clear, engaging, and relevant to the content of the message.
      `),
    new HumanMessage(` Generate a title for the following message:
      ${message}`)  
  ]);
  return response.text;
}