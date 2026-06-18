import { generateResponse as mistralResponse } from "./ai.service.js";
import { generateGroqResponse } from "./models/groq.service.js";

export async function aiRouter({ messages, model }) {

    console.log("MODEL SELECTED:", model);

    if (model === "mistral") {
        console.log("USING MISTRAL");
        return await mistralResponse(messages);
    }

    if (model === "groq" || model === "zephyr") {
        console.log("USING GROQ");
        return await generateGroqResponse(messages);
    }

    console.log("FALLBACK TO MISTRAL");
    return await mistralResponse(messages);
}