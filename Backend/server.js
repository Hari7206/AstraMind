
import dotenv from "dotenv";
dotenv.config();



import http from "http";
import app from "./src/app.js"
import conntecToDb from "./src/config/database.js";
import { initSocket } from "./src/sockets/server.socket.js";



const port = process.env.PORT || 3000;
const httpServer = http.createServer(app);
initSocket(httpServer);

conntecToDb()

httpServer.listen(port, "0.0.0.0", () => {
})

