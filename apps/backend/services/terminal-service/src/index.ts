import { env } from "./config/env";
import express from "express";
import type { Response } from "express";
import { connectDB } from "./config/db";
import { log } from "@bratCode/logger";

const app = express();

app.use(express.json());

app.get("/", (_, res: Response) => {
    res.json({
        message: "bratCode Terminal Service",
        timeStamp: new Date().toString(),
    });
});

app.listen(env.PORT, () => {
    connectDB();
    log(`Terminal Service started on port ${env.PORT}`);
});
