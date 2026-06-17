import { generateResponse as mistralResponse } from "./ai.service.js";
import axios from "axios";

export async function aiRouter({ messages, model }) {

  if (model === "mistral") {
    return await mistralResponse(messages);
  }

  if (model === "zephyr") {
    return await callZephyr(messages);
  }

  // fallback always safe
  return await mistralResponse(messages);
}

async function callZephyr(messages) {
  const prompt = messages
    .map(m => `${m.role}: ${m.content}`)
    .join("\n");

  const res = await axios.post(
    "https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta",
    { inputs: prompt },
    {
      headers: {
        Authorization: `Bearer ${process.env.HF_API_KEY}`,
      },
    }
  );

  return res.data?.[0]?.generated_text || "No response";
}