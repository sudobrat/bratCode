import { AuthServiceEnvSchema } from "@bratCode/zod";
import { log } from "console";
import "dotenv/config";

const result = AuthServiceEnvSchema.safeParse(process.env);

if (!result.success) {
    log("Invalid environment variables");
    log(result.error.flatten().fieldErrors);
    process.exit(1);
}

export const env = result.data;
