import axios from "axios";

export async function generateZephyrResponse(messages) {
  if (!process.env.HF_API_KEY) {
    throw new Error("HF_API_KEY is missing. Add your Hugging Face API key to Backend/.env.");
  }

  const prompt = messages
    .map((msg) => `${msg.role}: ${msg.content}`)
    .join("\n")
    .concat("\nai:");

  const response = await axios.post(
    "https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta",
    {
      inputs: prompt,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.HF_API_KEY}`,
      },
    }
  );

  const generatedText = response.data?.[0]?.generated_text || "";
  return generatedText.replace(prompt, "").trim() || generatedText.trim() || "No response";
}
