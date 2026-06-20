import express from "express";
import { imageController } from "../controller/image.controller.js";
import { authUser } from "../middleware/auth.middleware.js"; 
import { getGalleryImages } from "../controller/image.controller.js";
const imageRouter = express.Router();


imageRouter.post("/image", authUser, imageController);
imageRouter.get("/gallery", authUser, getGalleryImages);


export default imageRouter;