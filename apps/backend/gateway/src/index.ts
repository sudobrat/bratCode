import { env } from "./config/env";
import express from "express";
import type { Response } from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import cors from "cors";
import proxy from "express-http-proxy";
import { protect } from "./middlewares/protect";
import { getCurrentUser } from "./controllers/user.controller";
import { proxyWithHeader } from "./util/proxyWithHeaders";
import { log } from "@bratCode/logger";

const app = express();

app.use(
    cors({
        origin: env.FRONTEND_URL,
        credentials: true,
    }),
);
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

app.use("/api/auth", proxy(env.AUTH_SERVICE));
app.use("/api/project", protect, proxyWithHeader(env.PROJECT_SERVICE));
app.use("/api/file", protect, proxyWithHeader(env.FILE_SERVICE));

app.get("/api/me", protect, getCurrentUser);

app.get("/", (_, res: Response) => {
    res.json({
        message: "bratCode Gateway",
        timeStamp: new Date().toString(),
    });
});

app.listen(env.PORT, () => {
    log(`Gateway started on PORT ${env.PORT}`);
});
