import {Router} from 'express';
import { sendMessage , getChats , getMessages  , deleteChat} from '../controller/chat.controller.js';
import { authUser } from '../middleware/auth.middleware.js';
import { saveAgentMessages } from "../controller/chat.controller.js";
const chatRouter = Router();


chatRouter.post("/message", authUser, sendMessage);
chatRouter.get("/", authUser, getChats);
chatRouter.get("/messages/:chatId", authUser, getMessages);
chatRouter.delete("/delete/:chatId", authUser, deleteChat);
chatRouter.post("/agent-messages", authUser, saveAgentMessages);
export default chatRouter;