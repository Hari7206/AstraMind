import { io } from "socket.io-client";

let socket;

export const initializeSocketConnection = (chatId, dispatch, actions) => {
  socket = io("http://localhost:3000", {
    withCredentials: true,
  });

  socket.on("connect", () => {
    console.log("Connected:", socket.id);

    // join chat room
    socket.emit("join-chat", chatId);
  });

  // AI START
  socket.on("ai-start", () => {
    console.log("AI started...");
  });

  // AI STREAM (REAL MAGIC)
  socket.on("ai-stream", ({ chatId, chunk }) => {
    dispatch(actions.updateStreamingMessage({ chatId, chunk }));
  });

  return socket;
};