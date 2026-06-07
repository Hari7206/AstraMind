import { initializeSocketConnection } from "../service/chat.socket.js";
import {
    sendMessage,
    getChats,
    getMessages,
    deleteChat
} from "../service/chat.api.js";

import {
    setChats,
    setCurrentChatId,
    setError,
    setLoading
} from "../chat.slice.js";

import { useDispatch } from "react-redux";

export const useChats = () => {
    const dispatch = useDispatch();

    async function handleSendMessage(message, chatId) {
        try {
            dispatch(setLoading(true));

            const data = await sendMessage({
                message,
                chatId,
            });
            const { chat, aiMessage } = data;
            dispatch(setChats((prev) => {
                return {
                    ...prev,
                    [chat.title]: {
                        ...chat,
                        message: [{ content: message, role: "user" }, ...aiMessage]
                    }
                }
            }))
            dispatch(setCurrentChatId(chat._id))
        } catch (error) {
            dispatch(setError(error.message));
        } finally {
            dispatch(setLoading(false));
        }
    };

    const handleGetChats = async () => {
        try {
            dispatch(setLoading(true));

            const response = await getChats();

            dispatch(setChats(response));

            return response;
        } catch (error) {
            dispatch(setError(error.message));
        } finally {
            dispatch(setLoading(false));
        }
    };

    const handleGetMessages = async (chatId) => {
        try {
            dispatch(setLoading(true));

            const response = await getMessages(chatId);

            return response;
        } catch (error) {
            dispatch(setError(error.message));
        } finally {
            dispatch(setLoading(false));
        }
    };

    const handleDeleteChat = async (chatId) => {
        try {
            dispatch(setLoading(true));

            const response = await deleteChat(chatId);

            const updatedChats = await getChats();
            dispatch(setChats(updatedChats));

            return response;
        } catch (error) {
            dispatch(setError(error.message));
        } finally {
            dispatch(setLoading(false));
        }
    };

    return {
        initializeSocketConnection,
        handleSendMessage,
        handleGetChats,
        handleGetMessages,
        handleDeleteChat,
    };
};