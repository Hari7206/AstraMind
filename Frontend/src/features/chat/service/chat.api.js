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

export const chatWithDocument = async (documentId, question, chatId) => {
  const response = await api.post("/api/documents/chat", {
    documentId,
    question,
    chatId,
  });

  return response.data;
};

export const getDocuments = async () => {
  const response = await api.get("/api/documents/");
  return response.data;
};

export const deleteDocument = async (documentId) => {
  const response = await api.delete(`/api/documents/${documentId}`);
  return response.data;
};


export const webSearch = async (query) => {
  const response = await api.post("/api/agent/search", { query });
  return response.data;
};

export const generateEmail = async (data) => {
  // If data is a string, send it as recipient
  // If data is an object, send as is
  const payload = typeof data === 'string' 
    ? { recipient: data, topic: "" } 
    : data;
  
  const response = await api.post("/api/agent/email/generate", payload);
  return response.data;
};

export const sendEmailAgent = async (data) => {
  const response = await api.post("/api/agent/email/send", data);
  return response.data;
};

export const summarizeYouTube = async (url) => {
  const response = await api.post("/api/agent/youtube/summarize", { url });
  return response.data;
};

export const saveBookmark = async (data) => {
  const response = await api.post("/api/agent/bookmarks", data);
  return response.data;
};

export const getBookmarks = async () => {
  const response = await api.get("/api/agent/bookmarks");
  return response.data;
};


export const searchJobs = async (data) => {
  const response = await api.post("/api/agent/jobs/search", data);
  return response.data;
};

export const saveAgentMessages = async (chatId, userMessage, aiMessage) => {
  const response = await api.post("/api/chats/agent-messages", {
    chatId,
    userMessage,
    aiMessage
  });
  return response.data;
};