import { initializeSocketConnection } from "../service/chat.socket.js";
import { useSelector } from "react-redux";
import {
    sendMessage,
    getChats,
    getMessages,
    deleteChat,
    generateImageApi,
    uploadDocument,        
    chatWithDocument,     
    getDocuments,          
    deleteDocument        
} from "../service/chat.api.js";

import {
    setChats,
    setCurrentChatId,
    setError,
    setLoading,
    createNewChat,
    addNewMessage,
    addMessages,
    setAiThinking         
} from "../chat.slice.js";

import { useCallback } from "react";
import { useDispatch } from "react-redux";

const formatMessage = (msg) => ({
    content: msg.content,
    role: msg.role,
    messageType: msg.messageType || "text",
    fileUrl: msg.fileUrl || null,
    model: msg.model || null,
});

export const useChats = () => {
    const dispatch = useDispatch();
    const selectedModel = useSelector(
        (state) => state.chat.selectedModel
    );

    const handleSendMessage = useCallback(async (message, chatId, modelOverride) => {
        try {
            dispatch(setLoading(true));

            const data = await sendMessage({
                message,
                chatId,
                model: modelOverride || selectedModel,
            });

            const activeChatId = data.chat?._id || chatId;

            if (data.chat?._id) {
                dispatch(createNewChat({
                    chatId: data.chat._id,
                    title: data.chat.title || data.title || "New Chat",
                }));
                dispatch(setCurrentChatId(data.chat._id));
            }

            if (activeChatId && data.userMessage && !chatId) {
                dispatch(addNewMessage({
                    chatId: activeChatId,
                    ...formatMessage(data.userMessage),
                }));
            }

            if (activeChatId && data.aiMessage) {
                if (chatId) {
                    const response = await getMessages(activeChatId);
                    dispatch(addMessages({
                        chatId: activeChatId,
                        messages: (response.messages || []).map(formatMessage),
                    }));
                } else {
                    dispatch(addNewMessage({
                        chatId: activeChatId,
                        ...formatMessage(data.aiMessage),
                    }));
                }
            }

            return data;
        } catch (error) {
            dispatch(setError(error.message));
            throw error;
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
            const formattedMessages = messages.map(formatMessage)
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

    // ========== NEW DOCUMENT FUNCTIONS ==========

    const handleUploadDocument = useCallback(async (file, chatId) => {
        try {
            dispatch(setLoading(true));
            const data = await uploadDocument(file, chatId);

            if (data.success && data.chatId) {
                if (!chatId) {
                    dispatch(createNewChat({
                        chatId: data.chatId,
                        title: data.document.fileName,
                    }));
                    dispatch(setCurrentChatId(data.chatId));
                }

                if (data.userMessage) {
                    dispatch(addNewMessage({
                        chatId: data.chatId,
                        ...formatMessage(data.userMessage),
                    }));
                }

                if (data.aiMessage) {
                    dispatch(addNewMessage({
                        chatId: data.chatId,
                        ...formatMessage(data.aiMessage),
                    }));
                }

                const updatedChats = await getChats();
                dispatch(setChats(updatedChats.chats || []));
            }

            return data;
        } catch (error) {
            dispatch(setError(error.message));
            throw error;
        } finally {
            dispatch(setLoading(false));
        }
    }, [dispatch]);

    const handleChatWithDocument = useCallback(async (documentId, question, chatId) => {
        try {
            dispatch(setLoading(true));
            dispatch(setAiThinking(true));

            const data = await chatWithDocument(documentId, question, chatId);

            if (data.success) {
                if (data.userMessage) {
                    dispatch(addNewMessage({
                        chatId: data.userMessage.chat,
                        ...formatMessage(data.userMessage),
                    }));
                }

                if (data.aiMessage) {
                    dispatch(addNewMessage({
                        chatId: data.aiMessage.chat,
                        ...formatMessage(data.aiMessage),
                    }));
                }

                const chatToRefresh = chatId || data.userMessage?.chat;
                if (chatToRefresh) {
                    const response = await getMessages(chatToRefresh);
                    dispatch(addMessages({
                        chatId: chatToRefresh,
                        messages: (response.messages || []).map(formatMessage),
                    }));
                }
            }

            return data;
        } catch (error) {
            dispatch(setError(error.message));
            throw error;
        } finally {
            dispatch(setLoading(false));
            dispatch(setAiThinking(false));
        }
    }, [dispatch]);

    const handleGetDocuments = useCallback(async () => {
        try {
            dispatch(setLoading(true));
            const data = await getDocuments();
            return data;
        } catch (error) {
            dispatch(setError(error.message));
            throw error;
        } finally {
            dispatch(setLoading(false));
        }
    }, [dispatch]);

    const handleDeleteDocument = useCallback(async (documentId) => {
        try {
            dispatch(setLoading(true));
            const data = await deleteDocument(documentId);
            return data;
        } catch (error) {
            dispatch(setError(error.message));
            throw error;
        } finally {
            dispatch(setLoading(false));
        }
    }, [dispatch]);

    return {
        initializeSocketConnection,
        handleSendMessage,
        handleGetChats,
        handleGetMessages,
        handleDeleteChat,
        handleGenerateImage,
        handleUploadDocument,      
        handleChatWithDocument,   
        handleGetDocuments,        
        handleDeleteDocument      
    };
};
