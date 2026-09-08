import type { Request, Response } from "express";
import { app } from "../config/firebase";
import { getAuth } from "firebase-admin/auth";
import User from "../models/user.model";
import crypto from "crypto";
import redis from "@bratCode/redis";
import { LoginSchema, SessionUserSchema } from "@bratCode/zod";

export const login = async (req: Request, res: Response) => {
    try {
        const parsed = LoginSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ message: "Login Token Required!" });
        }
        const { token } = parsed.data;

        const decodedToken = await getAuth(app).verifyIdToken(token);

        let user = await User.findOne({
            firebaseUID: decodedToken.uid,
        });

        if (!user) {
            user = await User.create({
                firebaseUID: decodedToken.uid,
                name: decodedToken.name,
                email: decodedToken.email,
                avatar: decodedToken.picture,
            });
        }

        const sessionID = crypto.randomUUID();
        await redis.set(
            `session:${sessionID}`,
            JSON.stringify({
                _id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
            }),
            "EX",
            60 * 60 * 24 * 7,
        );

        res.cookie("sessionID", sessionID, {
            httpOnly: true,
            secure: false, //true in production
            sameSite: "strict",
            maxAge: 60 * 60 * 24 * 7 * 1000,
        });

        return res.status(200).json(SessionUserSchema.parse(user));
    } catch (error) {
        return res.status(500).json({ message: `Login error: ${error}` });
    }
};

export const logout = async (req: Request, res: Response) => {
    try {
        const sessionID = req.cookies?.sessionID;
        if (!sessionID) {
            return res.status(400).json({ message: "No session ID found" });
        }

        await redis.del(`session:${sessionID}`);

        res.clearCookie("sessionID");

        return res.status(200).json({ message: "Logout successful" });
    } catch (error) {
        return res.status(500).json({ message: `Logout error: ${error}` });
    }
};
