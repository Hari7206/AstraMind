import Document from "../model/document.model.js";
import chatModel from "../model/chat.model.js";
import messageModel from "../model/message.model.js";
import {
  extractTextFromFile,
  splitTextIntoChunks,
  createDocumentEmbeddings,
  searchDocument,
  removeDocumentEmbeddings
} from "../services/document.service.js";
import { generateResponse } from "../services/ai.service.js"; // ✅ FIXED
import fs from "fs";

export async function uploadDocument(req, res) {
  try {
    const { chatId } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded"
      });
    }

    // Validate file type
    const allowedTypes = ["pdf", "docx", "txt"];
    const fileExtension = file.originalname.split(".").pop().toLowerCase();
    const fileType = fileExtension;

    if (!allowedTypes.includes(fileType)) {
      fs.unlinkSync(file.path);
      return res.status(400).json({
        success: false,
        message: "Only PDF, DOCX, and TXT files are supported"
      });
    }

    // Extract text from file
    const extractedText = await extractTextFromFile(file.path, fileType);

    if (!extractedText || extractedText.trim().length === 0) {
      fs.unlinkSync(file.path);
      return res.status(400).json({
        success: false,
        message: "No text could be extracted from the file"
      });
    }

    console.log("📄 Extracted text length:", extractedText.length);

    // Create or get chat
    let chat = null;
    if (chatId) {
      chat = await chatModel.findOne({
        _id: chatId,
        user: req.user.id
      });
    }

    if (!chat) {
      const title = file.originalname.substring(0, 30);
      chat = await chatModel.create({
        user: req.user.id,
        title: `📄 ${title}`
      });
    }

    // Split text into chunks
    const chunks = splitTextIntoChunks(extractedText);
    console.log("📦 Number of chunks:", chunks.length);

    // Create document record FIRST
    const document = await Document.create({
      chat: chat._id,
      user: req.user.id,
      fileName: file.originalname,
      fileType: fileType,
      fileUrl: `/uploads/${file.filename}`,
      content: extractedText,
      chunks: chunks.map(text => ({ text })),
      status: "processing"
    });

    console.log("📝 Document created with ID:", document._id.toString());

    // Generate embeddings
    await createDocumentEmbeddings(document._id.toString(), chunks);
    console.log("✅ Embeddings created");

    // Update document status
    document.status = "processed";
    await document.save();

    // Save user message
    const userMessage = await messageModel.create({
      chat: chat._id,
      content: `📄 Uploaded: ${file.originalname}`,
      role: "user",
      messageType: "text"
    });

    // Save AI confirmation
    const aiMessage = await messageModel.create({
      chat: chat._id,
      content: `✅ Document "${file.originalname}" uploaded successfully! You can now ask questions about it. (${chunks.length} chunks processed)`,
      role: "ai",
      messageType: "text"
    });

    // Clean up temp file
    fs.unlinkSync(file.path);

    return res.status(201).json({
      success: true,
      chatId: chat._id,
      document: {
        id: document._id,
        fileName: document.fileName,
        fileType: document.fileType,
        status: document.status,
        chunks: chunks.length
      },
      userMessage,
      aiMessage
    });

  } catch (error) {
    console.error("Upload error:", error.message);
    if (req.file) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}
export async function chatWithDocument(req, res) {
  try {
    const { documentId, question, chatId } = req.body;

    if (!documentId || !question) {
      return res.status(400).json({
        success: false,
        message: "Document ID and question are required"
      });
    }

    const document = await Document.findOne({
      _id: documentId,
      user: req.user.id
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found"
      });
    }

    let searchResults;
    try {
      searchResults = await searchDocument(documentId, question, 5);
    } catch (error) {
      console.log("⚠️ Embedding search failed, using fallback:", error.message);
      searchResults = null;
    }

    let context;
    let sources = [];

    if (searchResults && searchResults.length > 0) {

      context = searchResults
        .filter(result => result.score > 0.01)
        .map((result, index) => `[Source ${index + 1}] ${result.text}`)
        .join("\n\n");
      
      sources = searchResults.map((r, i) => ({
        index: i + 1,
        text: r.text,
        score: r.score
      }));
    } else {
      console.log("📄 Using full document content as fallback");
      context = document.content.substring(0, 3000);
      sources = [{ index: 1, text: "Full document content", score: 1 }];
    }

 const aiResponse = await generateResponse([
  {
    role: "user",
    content: `SYSTEM INSTRUCTION: You are a strict document reader. You can ONLY answer using the exact text from the context. If you cannot find the answer, say "I cannot find this information in the document." Never use your training data

IMPORTANT RULES:
1. ONLY use information from the context below
2. If the answer is NOT in the context, say: "I cannot find this information in the document."
3. Do NOT use any external knowledge or training data
4. Do NOT make up information
5. Be brief and direct

CONTEXT:
${context}

QUESTION: ${question}

Your answer (based ONLY on the context above):`
  }
]);

    const chat = await chatModel.findOne({
      _id: chatId || document.chat,
      user: req.user.id
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found"
      });
    }

    const userMessage = await messageModel.create({
      chat: chat._id,
      content: question,
      role: "user",
      messageType: "text"
    });

    const aiMessage = await messageModel.create({
      chat: chat._id,
      content: aiResponse,
      role: "ai",
      messageType: "text",
      metadata: {
        documentId: documentId,
        sources: sources
      }
    });

    return res.status(200).json({
      success: true,
      answer: aiResponse,
      sources: sources,
      userMessage,
      aiMessage
    });

  } catch (error) {
    console.error("Document chat error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

export async function getDocuments(req, res) {
  try {
    const documents = await Document.find({
      user: req.user.id,
      status: "processed"
    }).select("fileName fileType createdAt chat");

    return res.status(200).json({
      success: true,
      documents
    });

  } catch (error) {
    console.error("Get documents error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

export async function deleteDocument(req, res) {
  try {
    const { documentId } = req.params;

    const document = await Document.findOne({
      _id: documentId,
      user: req.user.id
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found"
      });
    }
    removeDocumentEmbeddings(documentId);

    await Document.findByIdAndDelete(documentId);

    return res.status(200).json({
      success: true,
      message: "Document deleted successfully"
    });

  } catch (error) {
    console.error("Delete document error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}