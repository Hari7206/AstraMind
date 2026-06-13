import { Server } from 'socket.io';

let io;

export const initSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: "http://localhost:5173", // Adjust this to your frontend URL and port
            credentials: true,
        },
    });


    console.log("Socket.io server initialized");
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // STEP 1: join chat room
  socket.on("join-chat", (chatId) => {
    if (!chatId) return;
    socket.join(chatId);
    console.log(`Joined chat room: ${chatId}`);
  });
});
};


export function getIO() {
    if (!io) {
        throw new Error('Socket.io server not initialized');
    }
    return io;
}