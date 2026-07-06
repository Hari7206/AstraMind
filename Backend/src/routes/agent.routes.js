import { Router } from "express";
import { authUser } from "../middleware/auth.middleware.js";
import {
  webSearch,
  sendEmailAgent,
  generateEmail,
  summarizeYouTube,
  saveBookmark,
  getBookmarks
} from "../controller/agent.controller.js";

const agentRouter = Router();

agentRouter.post("/search", authUser, webSearch);

agentRouter.post("/email/send", authUser, sendEmailAgent);
agentRouter.post("/email/generate", authUser, generateEmail);

agentRouter.post("/youtube/summarize", authUser, summarizeYouTube);

agentRouter.post("/bookmarks", authUser, saveBookmark);
agentRouter.get("/bookmarks", authUser, getBookmarks);

export default agentRouter;