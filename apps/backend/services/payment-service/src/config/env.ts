import { PaymentServiceEnvSchema } from "@bratCode/zod";
import { log } from "@bratCode/logger";
import "dotenv/config";

const result = PaymentServiceEnvSchema.safeParse(process.env);

if (!result.success) {
    log("Invalid environment variables");
    log(result.error.flatten().fieldErrors);
    process.exit(1);
}

export const env = result.data;
