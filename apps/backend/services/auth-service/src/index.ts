import { env } from "./config/env";
import express from "express";
import type { Response } from "express";
import { connectDB } from "./config/db";
import router from "./routes/auth.route";
import { log } from "@bratCode/logger";
import cookieParser from "cookie-parser";

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use("/", router);

app.get("/", (_, res: Response) => {
    res.json({
        message: "bratCode Auth Service",
        timeStamp: new Date().toString(),
    });
});

app.listen(env.PORT, () => {
    connectDB();
    log(`Auth Service started on PORT ${env.PORT}`);
});
