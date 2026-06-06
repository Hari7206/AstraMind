import { generateResponse, generateTitle } from "../services/ai.service.js";
import chatModel from "../model/chat.model.js";
import messageModel from "../model/message.model.js";


export async function sendMessage(req, res) {
    const user = req.user;
    const { message, chat: chatId } = req.body;




    const userMessage = await messageModel.create({
        chat: chatId || chat._id,
        content: message,
        role: "user",
    });

    const messages = await messageModel.find({ chat: chatId })
    const result = await generateResponse(messages);

    let title = null;
    let chat = null;
    if (!chatId) {
        title = await generateTitle(message);
        chat = await chatModel.create({
            user: user.id,
            title: title
        });
    }

    console.log("chatId:", chatId);

    const aiMessage = await messageModel.create({
        chat: chatId || chat._id,
        content: result,
        role: "ai",
    });




    res.json({
        userMessage: userMessage,
        message: result,
        title: title,
        chat,
        aiMessage
    });

}