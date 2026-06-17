import { initializeSocketConnection } from "../service/chat.socket.js";
import { useSelector } from "react-redux";
import {
    sendMessage,
    getChats,
    getMessages,
    deleteChat,
    generateImageApi
} from "../service/chat.api.js";

import {
    setChats,
    setCurrentChatId,
    setError,
    setLoading,
    createNewChat,
    addNewMessage,
    addMessages
} from "../chat.slice.js";

import { useCallback } from "react";
import { useDispatch } from "react-redux";

export const useChats = () => {
    const dispatch = useDispatch();
    const selectedModel = useSelector(
        (state) => state.chat.selectedModel
    );


const handleSendMessage = useCallback(async (message, chatId) => {
    try {
        dispatch(setLoading(true));

        const data = await sendMessage({
            message,
            chatId,
            model: selectedModel,
        });

    } catch (error) {
        dispatch(setError(error.message));
    } finally {
        dispatch(setLoading(false));
    }
}, [dispatch, selectedModel]);

    const handleGetChats = useCallback(async () => {
        try {
            dispatch(setLoading(true));

            const response = await getChats();
            dispatch(setChats(response.chats || []));

            return response;
        } catch (error) {
            dispatch(setError(error.message));
        } finally {
            dispatch(setLoading(false));
        }
    }, [dispatch]);

    const handleGetMessages = useCallback(async (chatId) => {
        try {
            dispatch(setLoading(true));

            if (!chatId) return;

            const response = await getMessages(chatId);
            const { messages = [] } = response
            const formattedMessages = messages.map(msg => ({
                content: msg.content,
                role: msg.role,
                messageType: msg.messageType || "text",
                fileUrl: msg.fileUrl || null,
            }))
            dispatch(addMessages({
                chatId,
                messages: formattedMessages,
            }))
            dispatch(setCurrentChatId(chatId))
        } catch (error) {
            dispatch(setError(error.message));
        } finally {
            dispatch(setLoading(false));
        }
    }, [dispatch]);

    const handleDeleteChat = useCallback(async (chatId) => {
        try {
            dispatch(setLoading(true));

            const response = await deleteChat(chatId);

            const updatedChats = await getChats();
            dispatch(setChats(updatedChats.chats || []));

            return response;
        } catch (error) {
            dispatch(setError(error.message));
        } finally {
            dispatch(setLoading(false));
        }
    }, [dispatch]);




    const handleGenerateImage = useCallback(async (prompt, chatId) => {
        try {
            return await generateImageApi({
                prompt,
                chatId
            });
        } catch (error) {
            console.error("API Call inside hook failed:", error);
            throw error;
        }
    }, []);

    // Ensure this object contains only valid references
    return {
        initializeSocketConnection,
        handleSendMessage,
        handleGetChats,
        handleGetMessages,
        handleDeleteChat,
        handleGenerateImage
    };
};
