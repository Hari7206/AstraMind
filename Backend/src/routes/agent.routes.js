import { Router } from "express";
import { authUser } from "../middleware/auth.middleware.js";
import { checkUsage } from "../middleware/checkUsage.js";
import { webSearch, sendEmailAgent, generateEmail, summarizeYouTube, saveBookmark, getBookmarks, searchJobs } from "../controller/agent.controller.js";

const agentRouter = Router();

// Web Search (FREE - no limit)
agentRouter.post("/search", authUser, webSearch);

// Email Agent
agentRouter.post("/email/send", authUser, sendEmailAgent);
agentRouter.post("/email/generate", authUser, generateEmail);

// YouTube Summarizer
agentRouter.post("/youtube/summarize", authUser, summarizeYouTube);

// Bookmarks
agentRouter.post("/bookmarks", authUser, saveBookmark);
agentRouter.get("/bookmarks", authUser, getBookmarks);

// Job Search (with usage limit)
agentRouter.post("/jobs/search", authUser, checkUsage, searchJobs);

export default agentRouter;