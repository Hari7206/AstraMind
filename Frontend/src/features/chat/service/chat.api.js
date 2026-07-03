import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000",
  withCredentials: true,
});

export const sendMessage = async ({
    message,
    chatId,
    model
}) => {
    const response = await api.post("/api/chats/message", {
        message,
        chat: chatId,
        model,
    });

    return response.data;
};

export const getChats = async () => {
  const response = await api.get("/api/chats");
  return response.data;
};

export const getMessages = async (chatId) => {
  const response = await api.get(
    `/api/chats/messages/${chatId}`
  );

  return response.data;
};

export const deleteChat = async (chatId) => {
  const response = await api.delete(
    `/api/chats/delete/${chatId}`
  );

  return response.data;
};

export const generateImageApi = async ({ prompt, chatId }) => {
  const res = await api.post("/api/ai/image", {
    prompt,
    chat: chatId,
  });

  return res.data;
};

// Upload a document
export const uploadDocument = async (file, chatId) => {
  const formData = new FormData();
  formData.append("file", file);
  if (chatId) {
    formData.append("chatId", chatId);
  }

  const response = await api.post("/api/documents/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

// Chat with document
export const chatWithDocument = async (documentId, question, chatId) => {
  const response = await api.post("/api/documents/chat", {
    documentId,
    question,
    chatId,
  });

  return response.data;
};

// Get all user documents
export const getDocuments = async () => {
  const response = await api.get("/api/documents/");
  return response.data;
};

// Delete document
export const deleteDocument = async (documentId) => {
  const response = await api.delete(`/api/documents/${documentId}`);
  return response.data;
};