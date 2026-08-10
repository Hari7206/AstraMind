// routes/agent.routes.js
import { Router } from "express";
import { authUser } from "../middleware/auth.middleware.js";
import { checkUsage } from "../middleware/checkUsage.js";
import { webSearch, sendEmailAgent, generateEmail, summarizeYouTube, saveBookmark, getBookmarks, deleteBookmark, searchJobs } from "../controller/agent.controller.js";

const agentRouter = Router();

agentRouter.post("/search", authUser, webSearch);

agentRouter.post("/email/send", authUser, sendEmailAgent);
agentRouter.post("/email/generate", authUser, generateEmail);

agentRouter.post("/youtube/summarize", authUser, summarizeYouTube);


agentRouter.post("/bookmarks", authUser, saveBookmark);
agentRouter.get("/bookmarks", authUser, getBookmarks);

agentRouter.delete("/bookmarks/:bookmarkId", authUser, deleteBookmark);


agentRouter.post("/jobs/search", authUser, checkUsage, searchJobs);



export default agentRouter;