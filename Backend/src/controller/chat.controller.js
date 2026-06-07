import { generateResponse, generateTitle } from "../services/ai.service.js";
import chatModel from "../model/chat.model.js";
import messageModel from "../model/message.model.js";


export async function sendMessage(req, res) {

    const { message, chat: chatId } = req.body;


    let title = null, chat = null;

    if (!chatId) {
        title = await generateTitle(message);
        chat = await chatModel.create({
            user: req.user.id,
            title
        })
    }

    const userMessage = await messageModel.create({
        chat: chatId || chat._id,
        content: message,
        role: "user"
    })

    const messages = await messageModel.find({ chat: chatId || chat._id })

    const result = await generateResponse(messages);

    const aiMessage = await messageModel.create({
        chat: chatId || chat._id,
        content: result,
        role: "ai"
    })


    res.status(201).json({
        title,
        chat,
        aiMessage
    })

}


export async function getChats(req, res) {
    const user = req.user;

    const chats = await chatModel.find({ user: user.id });

    res.status(200).json({
        message: "Chats retrieved successfully",
        chats
    });
}

export async function getMessages(req, res) {
    const user = req.user;
    const { chatId } = req.params;

    const chat = await chatModel.findOne({
        _id: chatId,
        user: user.id
    });

    if (!chat) {
        return res.status(404).json({
            message: "Chat not found"
        });
    }

    const messages = await messageModel.find({ chat: chatId });

    res.status(200).json({
        message: "Messages retrieved successfully",
        messages
    });
}

export async function deleteChat(req, res) {
    const user = req.user;
    const { chatId } = req.params;

    const chat = await chatModel.findOne({
        _id: chatId,
        user: user.id
    });

    if (!chat) {
        return res.status(404).json({
            message: "chat not found"
        })
    }

    await chatModel.deleteOne({ _id: chatId });
    await messageModel.deleteMany({ chat: chatId });

    res.json({
        message: "Chat deleted successfully"
    })

}