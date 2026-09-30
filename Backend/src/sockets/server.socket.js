import { Server } from 'socket.io';

let io;

export const initSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: "http://localhost:5173", 
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