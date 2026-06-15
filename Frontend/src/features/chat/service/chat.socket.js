import { io } from "socket.io-client";

let socket;

export const initializeSocketConnection = (chatId, dispatch, actions) => {
  socket = io("http://localhost:3000", {
    withCredentials: true,
  });

  socket.on("connect", () => {
    console.log("Connected:", socket.id);

    
    socket.emit("join-chat", chatId);
  });

  
  socket.on("ai-start", ({ chatId }) => {
    console.log("AI started for chat:", chatId);
    dispatch(actions.setAiThinking(true));
  });

  
  socket.on("ai-stream", ({ chatId, chunk }) => {
    dispatch(actions.updateStreamingMessage({ chatId, chunk }));
  });


  socket.on("ai-done", ({ chatId }) => {
    console.log("AI finished for chat:", chatId);
    dispatch(actions.setAiThinking(false));
  });

  return socket;
};