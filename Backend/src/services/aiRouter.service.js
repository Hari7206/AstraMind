import { generateResponse as mistralResponse } from "./ai.service.js";
import { generateGroqResponse } from "./models/groq.service.js";

export async function aiRouter({ messages, model }) {


    if (model === "mistral") {
        return await mistralResponse(messages);
    }

    if (model === "groq" || model === "zephyr") {
        return await generateGroqResponse(messages);
    }

    return await mistralResponse(messages);
}