import { log } from "@bratCode/logger";
import mongoose from "mongoose";
import { env } from "./env";

export const connectDB = async () => {
    try {
        await mongoose.connect(env.MONGODB_URI);
        log("Database Connected");
    } catch (error) {
        log("Error connecting to database", error);
    }
};
