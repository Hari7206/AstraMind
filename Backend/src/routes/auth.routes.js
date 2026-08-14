import { Router } from "express";
import { register, verifyEmail, login, getMe, logout } from "../controller/auth.controller.js";
import { authUser } from "../middleware/auth.middleware.js";
import { registerValidator, loginValidator } from "../validator/auth.validator.js";

const authRouter = Router();

/*
   * @route POST /api/auth/register
   * @desc Register a new user
   * @access Public
   * @body {username, email, password}
*/
authRouter.post("/register", registerValidator, register);

/*
    * @route GET /api/auth/verify-email
    * @desc Verify email address
    * @access Public
    * @query {token}
*/
authRouter.get("/verify-email", verifyEmail);

/*
    * @route POST /api/auth/login
    * @desc Login user  
    * @access Public
    * @body {email, password}
*/
authRouter.post("/login", loginValidator, login);

/*
    * @route GET /api/auth/getMe
    * @desc Get current logged in user
    * @access Private
*/
authRouter.get("/getMe", authUser, getMe);

/*
    * @route POST /api/auth/logout
    * @desc Logout user
    * @access Private
*/
authRouter.post("/logout", authUser, logout);

export default authRouter;