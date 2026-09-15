import express from "express";
import { createOrder, verify } from "../controllers/payment.controllers";

const router: express.Router = express.Router();

router.post("/create", createOrder);
router.post("/verify", verify);
export default router;
