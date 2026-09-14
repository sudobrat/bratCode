import { env } from "./config/env";
import express from "express";
import type { Response } from "express";
import "dotenv/config";
import { connectDB } from "./config/db";
import { log } from "@bratCode/logger";
import router from "./routes/ai.routes";

const app = express();

app.use(express.json());
app.use("/", router);

app.get("/", (_, res: Response) => {
    res.json({
        message: "bratCode AI Service",
        timeStamp: new Date().toString(),
    });
});

app.listen(env.PORT, () => {
    connectDB();
    log(`AI Service started on port ${env.PORT}`);
});
