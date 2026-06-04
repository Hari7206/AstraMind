import { initializeSocketConnection } from "../service/chat.socket.js";

export const useChats = () => {
    return {
        initializeSocketConnection: initializeSocketConnection,
    };
};