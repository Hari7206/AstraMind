import "dotenv/config";
import { ChatMistralAI } from "@langchain/mistralai";
import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import * as z from "zod"
import {createAgent} from "langchain"
import { searchInternet } from "./internet.service.js";




const model = new ChatMistralAI({
  model: "mistral-large-latest",
  apiKey: process.env.MISTRAL_API_KEY,
  temperature: 0,
});


const searchInternetTool = tool(
  searchInternet,
  {
    name: "searchInternet",
    description: "use this tool to get the latest information from the internet",
    schema: z.object({
      query: z.string().describe("The search query to look up to the internet")
    })

  }
)

const agent = createAgent({
  model: model,
  tools: [searchInternetTool]
})

export async function generateResponse(messages) {
  const response = await agent.invoke({
    messages: [
     new SystemMessage(`
You MUST use the searchInternet tool for:
- latest news
- current events
- recent updates
- anything time sensitive

Do not answer from memory.
`),

      ...messages.map((msg) => {
        if (msg.role === "user") {
          return new HumanMessage(msg.content);
        } else if (msg.role === "ai") {
          return new AIMessage(msg.content);
        }
      }),
    ],
  });

  return response.messages[response.messages.length - 1].text;
}

export async function generateTitle(message) {
  const response = await model.invoke([
    new SystemMessage(`
You are a title generator.

Rules:
- Generate VERY SHORT title (2–5 words max)
- Make it UNIQUE for each message
- Avoid generic titles like "Hello", "New Chat"
- Never repeat same title pattern
- Add context-specific words
- No punctuation
- No explanations
`),
    new HumanMessage(`
Create a short unique chat title for:
${message}
    `),
  ]);

  return response.text;
}