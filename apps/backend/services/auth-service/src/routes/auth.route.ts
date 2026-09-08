import express from "express";
import { login, logout } from "../controllers/auth.controller.ts";

const router: express.Router = express.Router();

router.post("/login", login);
router.get("/logout", logout);

export default router;
