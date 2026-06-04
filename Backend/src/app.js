import express from "express"
import cookieParser from "cookie-parser"
import authRouter from "./routes/auth.routes.js"
import cors from "cors"
import morgan from "morgan"



const app = express()

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
}))

app.use(express.json())
app.use(cookieParser())
app.use(morgan("dev"))
app.use("/api/auth" , authRouter)

export default app