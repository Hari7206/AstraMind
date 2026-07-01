import { generateTitle } from "../services/ai.service.js";
import chatModel from "../model/chat.model.js";
import { aiRouter } from "../services/aiRouter.service.js";
import { getIO } from "../sockets/server.socket.js";
import messageModel from "../model/message.model.js";


// Keep your other existing imports at the top (chatModel, messageModel, generateTitle, getIO, etc.)

export async function sendMessage(req, res) {
  const { message, chat: chatId, model: selectedModel } = req.body;
const allowedModels = ["mistral", "groq"];

const model = allowedModels.includes(selectedModel)
  ? selectedModel
  : "mistral";


  let title = null,
    chat = null;

  if (!chatId) {
    title = await generateTitle(message);
    chat = await chatModel.create({
      user: req.user.id,
      title,
    });
  }

  const userMessage = await messageModel.create({
    chat: chatId || chat._id,
    content: message,
    role: "user",
  });

  const messages = await messageModel
    .find({ chat: chatId || chat._id })
    .sort({ createdAt: 1 });

  const io = getIO();
  const chatIdFinal = chatId || chat._id;

  io.to(chatIdFinal).emit("ai-start", {
    chatId: chatIdFinal,
    model,
  });

  const result = await aiRouter({
    messages,
    model,
  });

  const text =
    typeof result === "string"
      ? result
      : result?.text || result?.generated_text || "";

  let fullText = "";

  for (let i = 0; i < text.length; i++) {
    fullText += text[i];

    io.to(chatIdFinal).emit("ai-stream", {
      chatId: chatIdFinal,
      chunk: text[i],
      model,
    });

    await new Promise((res) => setTimeout(res, 15));
  }

  io.to(chatIdFinal).emit("ai-done", {
    chatId: chatIdFinal,
    content: fullText,
    model,
  });

  const aiMessage = await messageModel.create({
    chat: chatIdFinal,
    content: fullText,
    role: "ai",
    model,
  });

  res.status(201).json({
    title,
    chat,
    userMessage,
    aiMessage,
  });
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
