import { env } from "./env";
import { log } from "@bratCode/logger";
import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        await mongoose.connect(env.MONGODB_URI);
        log("Database Connected");
    } catch (error) {
        log("Error connecting to database", error);
    }
};
