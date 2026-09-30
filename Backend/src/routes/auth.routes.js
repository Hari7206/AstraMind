import { Router } from "express";
import { register, verifyEmail, login, getMe, logout } from "../controller/auth.controller.js";
import { authUser } from "../middleware/auth.middleware.js";
import { registerValidator, loginValidator } from "../validator/auth.validator.js";

const authRouter = Router();

  
authRouter.post("/register", registerValidator, register);

    
authRouter.get("/verify-email", verifyEmail);

   
authRouter.post("/login", loginValidator, login);

authRouter.get("/getMe", authUser, getMe);


authRouter.post("/logout", authUser, logout);

export default authRouter;