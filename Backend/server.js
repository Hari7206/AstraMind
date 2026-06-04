
import dotenv from "dotenv";
dotenv.config();




import app from "./src/app.js"
import conntecToDb from "./src/config/database.js";

conntecToDb()

app.listen(3000 , ()=> {
    console.log("server is running on port 3000");
})

