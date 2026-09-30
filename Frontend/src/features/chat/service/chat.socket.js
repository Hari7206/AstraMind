import { io } from "socket.io-client";
import { SOCKET_URL } from "../../../config/api";

let socket;

export const initializeSocketConnection = (chatId, dispatch, actions) => {
  socket = io(SOCKET_URL, {
    withCredentials: true,
  });

  socket.on("connect", () => {

    
    socket.emit("join-chat", chatId);
  });

  
  socket.on("ai-start", () => {
    dispatch(actions.setAiThinking(true));
  });

  
  socket.on("ai-stream", ({ chatId, chunk, model }) => {
    dispatch(actions.updateStreamingMessage({ chatId, chunk, model }));
  });


  socket.on("ai-done", () => {
    dispatch(actions.setAiThinking(false));
  });

  return socket;
};
