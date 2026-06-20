import mongoose from "mongoose";
import chatModel from "../model/chat.model.js";
import messageModel from "../model/message.model.js";

export const imageController = async (req, res) => {
  try {
    const { prompt, chat } = req.body;
    const trimmedPrompt = prompt?.trim();

    if (!trimmedPrompt) {
      return res.status(400).json({
        success: false,
        message: "Prompt is required"
      });
    }

    const safeImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(trimmedPrompt)}?width=1024&height=1024&nologo=true`;
    let activeChat = null;

    if (chat && mongoose.Types.ObjectId.isValid(chat)) {
      activeChat = await chatModel.findOne({
        _id: chat,
        user: req.user.id
      });

      if (!activeChat) {
        return res.status(404).json({
          success: false,
          message: "Chat not found"
        });
      }
    } else {
      activeChat = await chatModel.create({
        user: req.user.id,
        title: trimmedPrompt.length > 35 ? `${trimmedPrompt.slice(0, 35)}...` : trimmedPrompt
      });
    }

    const userMessage = await messageModel.create({
      chat: activeChat._id,
      content: trimmedPrompt,
      role: "user",
      messageType: "text"
    });

    const aiMessage = await messageModel.create({
      chat: activeChat._id,
      content: `Generated image for: "${trimmedPrompt}"`,
      role: "ai",
      messageType: "image",
      fileUrl: safeImageUrl
    });

    return res.status(201).json({
      success: true,
      chatId: activeChat._id,
      chat: activeChat,
      userMessage,
      aiMessage
    });
  } catch (error) {
    console.error("Image generation error:", error.message);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server database error"
    });
  }
};


export const getGalleryImages = async (req, res) => {
  try {
    const userId = req.user.id;

    const images = await messageModel.find({
      role: "ai",
      messageType: "image"
    }).populate({
      path: "chat",
      match: { user: userId }
    });

    const filteredImages = images.filter(img => img.chat !== null);

    return res.status(200).json({
      success: true,
      images: filteredImages
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};