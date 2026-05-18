import { Router } from "express";
import { register , verifyEmail} from "../controller/auth.controller.js";
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


authRouter.get("/verify-email"  , verifyEmail)

export default authRouter;