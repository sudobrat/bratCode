import { env } from "./config/env";
import express from "express";
import type { Response } from "express";
import { connectDB } from "./config/db";
import router from "./routes/project.route";
import { log } from "@bratCode/logger";

const app = express();

app.use(express.json());

app.use("/", router);

app.get("/", (_, res: Response) => {
    res.json({
        message: "bratCode Project Service",
        timeStamp: new Date().toString(),
    });
});

app.listen(env.PORT, () => {
    connectDB();
    log(`Project Service started on port ${env.PORT}`);
});
