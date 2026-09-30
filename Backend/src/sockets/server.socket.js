import { Server } from 'socket.io';

let io;
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

export const initSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: frontendUrl,
            credentials: true,
        },
    });


io.on("connection", (socket) => {

  socket.on("join-chat", (chatId) => {
    if (!chatId) return;
    socket.join(chatId);
  });
});
};


export function getIO() {
    if (!io) {
        throw new Error('Socket.io server not initialized');
    }
    return io;
}