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
