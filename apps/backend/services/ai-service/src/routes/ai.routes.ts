import express from "express";
import { chat } from "../controllers/ai.controller.js";

const router: express.Router = express.Router();

router.post("/chat", chat);

export default router;
