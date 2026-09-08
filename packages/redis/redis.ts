import { log } from "@bratCode/logger";
import { Redis } from "ioredis";

const redisUrl = process.env.REDIS_URL!;

if (!redisUrl) {
    throw new Error("REDIS_URL is not defined in the environment variables.");
}

const redis = new Redis(redisUrl);

redis.on("connect", () => {
    log("Redis Connected");
});

redis.on("error", (error) => {
    log("Redis Connection Error:", error);
});

export default redis;
