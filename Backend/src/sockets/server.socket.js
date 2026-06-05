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
    io.on('connection', (socket) => {
        console.log('A user connected:', socket.id);  // here the id means every user has a unique id and everytime a user connects to the server, it will generate a new id for that user
    });
};


export function getIO() {
    if (!io) {
        throw new Error('Socket.io server not initialized');
    }
    return io;
}