
import dotenv from "dotenv";
dotenv.config();



import http from "http";
import app from "./src/app.js"
import conntecToDb from "./src/config/database.js";
import { initSocket } from "./src/sockets/server.socket.js";



const httpServer = http.createServer(app);
initSocket(httpServer);

conntecToDb()

httpServer.listen(3000, () => {
    console.log("server is running on port 3000");
})

