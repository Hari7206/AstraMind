import {Router} from 'express';
import { sendMessage , getChats , getMessages  , deleteChat} from '../controller/chat.controller.js';
import { authUser } from '../middleware/auth.middleware.js';
const chatRouter = Router();


chatRouter.post("/message", authUser, sendMessage);
chatRouter.delete("/chat/:chatId", authUser, deleteChat);
chatRouter.get("/", authUser, getChats);
chatRouter.get("/messages/:chatId", authUser, getMessages);
chatRouter.delete("/delete/:chatId", authUser, deleteChat);



export default chatRouter;