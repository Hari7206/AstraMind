import { createSlice } from "@reduxjs/toolkit";

const chatSlice = createSlice({
    name: 'chat',
    initialState: {
        chats: {},
        currentChatId: null,
        isLoading: false,
        error: null,
        plan: "free",
        isAiThinking: false,
        selectedModel: "mistral",
    },
    reducers: {
        setModel: (state, action) => {
            state.selectedModel = action.payload;
        },
        setAiThinking: (state, action) => {
            state.isAiThinking = action.payload;
        },
        createNewChat: (state, action) => {
            const { chatId, title } = action.payload
            if (!chatId) return

            if (!state.chats[chatId]) {
                state.chats[chatId] = {
                    id: chatId,
                    title: title || "New Chat",
                    messages: [],
                    lastUpdated: new Date().toISOString(),
                }
            } else {
                state.chats[chatId].title = title || state.chats[chatId].title
                state.chats[chatId].lastUpdated = new Date().toISOString()
            }
        },
        addNewMessage: (state, action) => {
            const { chatId, content, role, messageType, fileUrl, model } = action.payload;
            if (state.chats[chatId]) {
                state.chats[chatId].messages.push({
                    content,
                    role,
                    messageType: messageType || "text",
                    fileUrl: fileUrl || null,
                    model: model || null,
                    timestamp: new Date().toISOString()
                });
                state.chats[chatId].lastUpdated = new Date().toISOString();
            }
        },
        addMessages: (state, action) => {
            const { chatId, messages } = action.payload
            if (!chatId || !Array.isArray(messages)) return

            if (!state.chats[chatId]) {
                state.chats[chatId] = {
                    id: chatId,
                    title: "New Chat",
                    messages: [],
                    lastUpdated: new Date().toISOString(),
                }
            }

            state.chats[chatId].messages = messages
        },

        updateStreamingMessage: (state, action) => {
            const { chatId, chunk, model } = action.payload;

            const chat = state.chats[chatId];
            if (!chat) return;

            let messages = chat.messages;
            let lastMsg = messages[messages.length - 1];

            if (!lastMsg || lastMsg.role !== "ai") {
                messages.push({
                    role: "ai",
                    content: chunk,
                    model: model || null,
                    messageType: "text",
                });
            } else {
                lastMsg.content += chunk;
                lastMsg.model = model || lastMsg.model || null;
            }
        },
        setChats: (state, action) => {
            if (action.payload && !Array.isArray(action.payload) && !action.payload.chats) {
                state.chats = action.payload
                return
            }

            const chats = Array.isArray(action.payload)
                ? action.payload
                : action.payload?.chats || []

            state.chats = chats.reduce((acc, chat) => {
                const id = chat._id || chat.id
                if (!id) return acc

                acc[id] = {
                    id,
                    title: chat.title || "New Chat",
                    messages: state.chats[id]?.messages || chat.messages || [],
                    lastUpdated: chat.updatedAt || chat.lastUpdated || new Date().toISOString(),
                }

                return acc
            }, {})
        },
        setCurrentChatId: (state, action) => {
            state.currentChatId = action.payload
        },
        setLoading: (state, action) => {
            state.isLoading = action.payload
        },
        setError: (state, action) => {
            state.error = action.payload
        },
        setPlan: (state, action) => {
            state.plan = action.payload;
        },
    }
})


export const {
    setChats,
    setCurrentChatId,
    setLoading,
    setError,
    createNewChat,
    addNewMessage,
    addMessages,
    updateStreamingMessage,
    setAiThinking,
    setModel,
    setPlan,
} = chatSlice.actions

export default chatSlice.reducer


