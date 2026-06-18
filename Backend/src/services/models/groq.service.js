import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function generateGroqResponse(messages) {
  try {
    // Convert your message format to Groq format
    const groqMessages = messages.map((msg) => ({
      role: msg.role === "user" ? "user" : "assistant",
      content: msg.content,
    }));

    const chatCompletion = await groq.chat.completions.create({
      messages: groqMessages,
      model: "llama-3.3-70b-versatile", // Updated model - currently supported
      temperature: 0.7,
      max_tokens: 1024,
    });

    return chatCompletion.choices[0]?.message?.content || "No response";
  } catch (error) {
    console.error("Groq API Error:", error.message);
    throw new Error(`Groq API failed: ${error.message}`);
  }
}