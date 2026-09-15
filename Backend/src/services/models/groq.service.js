import OpenAI from "openai";

const nvidia = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: "https://integrate.api.nvidia.com/v1",
});

export async function generateGroqResponse(messages) {
  try {
    console.log("=== NVIDIA (Nemotron) DEBUG ===");
    console.log("API Key exists:", !!process.env.NVIDIA_API_KEY);
    console.log("API Key length:", process.env.NVIDIA_API_KEY?.length || 0);
    console.log("Messages count:", messages.length);

    const nvidiaMessages = messages.map((msg) => ({
      role: msg.role === "user" ? "user" : "assistant",
      content: msg.content,
    }));

    console.log("Sending request to NVIDIA API...");

    const chatCompletion = await nvidia.chat.completions.create({
      messages: nvidiaMessages,
      model: "nvidia/nemotron-3.5-lightning-30b-a3b",
      temperature: 0.7,
      max_tokens: 1024,
    });

    console.log("✅ NVIDIA response received successfully!");
    return chatCompletion.choices[0]?.message?.content || "No response";
  } catch (error) {
    console.error("=== NVIDIA ERROR DETAILS ===");
    console.error("Error Status:", error.status || "No status");
    console.error("Error Message:", error.message);
    console.error("Error Code:", error.code || "No code");
    console.error("Full Error:", JSON.stringify(error, null, 2));

    throw new Error(`NVIDIA API failed: ${error.message}`);
  }
}