import {Router} from 'express';
import { sendMessage } from '../controller/chat.controller.js';
import { authUser } from '../middleware/auth.middleware.js';
const chatRouter = Router();


chatRouter.post("/message", authUser, sendMessage);




export default chatRouter;