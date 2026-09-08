import type { Request, Response } from "express";

export const getCurrentUser = async (req: Request, res: Response) => {
    try {
        const user = req.user;
        return res.status(200).json(user);
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
};
