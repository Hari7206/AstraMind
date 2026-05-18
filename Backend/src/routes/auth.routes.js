import { Router } from "express";
import { register } from "../controller/auth.controller.js";
import { registerValidator} from "../validator/auth.validator.js";

const authRouter = Router();




/*
   * @route POST /api/auth/register
   * @desc Register a new user
   * @access Public
   * @body {username, email, password}
*/

authRouter.post(
    "/register",
    registerValidator,
    register
);

export default authRouter;