import express from "express";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.routes.js";
import chatRouter from "./routes/chat.routes.js";
import imageRouter from "./routes/image.routes.js";
import documentRouter from "./routes/document.routes.js"; 
import cors from "cors";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from 'url';
import agentRouter from "./routes/agent.routes.js";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
}));

app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

app.use("/api/auth", authRouter);
app.use("/api/chats", chatRouter);
app.use("/api/ai", imageRouter);
app.use("/api/documents", documentRouter); 
app.use("/api/agent", agentRouter);

export default app;