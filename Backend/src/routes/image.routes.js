import express from "express";
import { imageController } from "../controller/image.controller.js";
import { authUser } from "../middleware/auth.middleware.js"; 
const imageRouter = express.Router();


imageRouter.post("/image", authUser, imageController);

export default imageRouter;