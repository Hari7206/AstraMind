import { createSlice } from "@reduxjs/toolkit";


const chatSlice = createSlice({
    name: 'chat',
    initialState: {
        chats: {},
        currentChatId: null,
        isLoading: false ,
        error: null,
    } ,
    reducers:{
        createNewChat: (state , action) => {
            const {chatId , title} = action.payload
            if (!chatId) return

            if (!state.chats[chatId]) {
                state.chats[ chatId ] = {
                    id: chatId ,
                    title: title || "New Chat",
                    messages: [] ,
                    lastUpdated: new Date().toISOString(),
                }
            } else {
                state.chats[chatId].title = title || state.chats[chatId].title
                state.chats[chatId].lastUpdated = new Date().toISOString()
            }
        },
        addNewMessage: (state , action) => {
            const { chatId , content , role } = action.payload 
            if (!chatId || !content) return

            if (!state.chats[chatId]) {
                state.chats[chatId] = {
                    id: chatId,
                    title: "New Chat",
                    messages: [],
                    lastUpdated: new Date().toISOString(),
                }
            }

            state.chats[chatId].messages.push({content , role})
            state.chats[chatId].lastUpdated = new Date().toISOString()
        } ,
        addMessages: (state , action) => {
            const { chatId , messages } = action.payload
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
            state.chats[chatId].lastUpdated = new Date().toISOString()
        },
        setChats: (state , action) => {
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
        } ,
        setCurrentChatId:(state , action)=>{
            state.currentChatId = action.payload
        } ,
        setLoading:(state , action)=>{
            state.isLoading = action.payload
        } ,
        setError:(state , action) => {
            state.error = action.payload
        }
    }

})


export const {setChats , setCurrentChatId , setLoading , setError  , createNewChat , addNewMessage , addMessages} = chatSlice.actions
export default chatSlice.reducer

//  Chat = {
//   "docker and Aws":{
//     messages:[
//         {
//       role: "user",
//       content: "What is the difference between Docker and AWS?"
//     },
//     {
//       role: "ai",
//       content: "Docker is a containerization platform used to package and run applications consistently across environments. AWS is a cloud computing platform that provides services such as virtual servers, storage, databases, and more. Docker can be used on AWS."
//     }
//   ],
//   id: "docker and Aws",
// lastUpdated: "2026-06-07T14:30:00.000Z"}
// };




//   "react and redux": [
//     {
//       role: "user",
//       content: "What is the difference between React and Redux?"
//     },
//     {
//       role: "ai",
//       content: "React is a JavaScript library for building user interfaces, while Redux is a state management library used to manage and share application state across React components. React handles the UI layer, whereas Redux helps manage complex state logic."
//     }
//   ]
