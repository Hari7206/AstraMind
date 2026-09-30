import { Router } from "express";
import { authUser } from "../middleware/auth.middleware.js";
import {createOrder, verifyPayment,getSubscription} from "../controller/payment.controller.js";

const paymentRouter = Router();

paymentRouter.post("/create-order", authUser, createOrder);

paymentRouter.post("/verify", authUser, verifyPayment);

paymentRouter.get("/subscription", authUser, getSubscription);

export default paymentRouter;