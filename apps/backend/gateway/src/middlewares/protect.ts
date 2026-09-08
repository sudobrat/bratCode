import type { NextFunction, Request, Response } from "express";
import redis from "@bratCode/redis";
import { SessionUserSchema } from "@bratCode/zod";

export const protect = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const sessionID = req.cookies?.sessionID;
        if (!sessionID) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const result = await redis.get(`session:${sessionID}`);
        if (!result) {
            return res.status(401).json({ message: "Session expired" });
        }
        const parsed = SessionUserSchema.safeParse(JSON.parse(result));
        if (!parsed.success) {
            return res.status(401).json({ message: "Invalid session" });
        }
        req.user = parsed.data;
        next();
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};
