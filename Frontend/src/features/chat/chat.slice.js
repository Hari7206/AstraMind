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
        setChats: (state , action) => {
            state.chats = action.payload
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


export const {setChats , setCurrentChatId , setLoading , setError} = chatSlice.actions
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