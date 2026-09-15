import { z } from "zod";

export const GatewayEnvSchema = z.object({
    PORT: z.string().default("8000"),
    FRONTEND_URL: z.string().url(),
    AUTH_SERVICE: z.string().url(),
    PROJECT_SERVICE: z.string().url(),
    FILE_SERVICE: z.string().url(),
    AI_SERVICE: z.string().url(),
    TERMINAL_SERVICE: z.string().url(),
    PAYMENT_SERVICE: z.string().url(),
    REDIS_URL: z.string().url(),
});

export const AuthServiceEnvSchema = z.object({
    PORT: z.string().default("8001"),
    MONGODB_URI: z.string().url(),
    REDIS_URL: z.string().url(),
});

export const ProjectServiceEnvSchema = z.object({
    PORT: z.string().default("8002"),
    MONGODB_URI: z.string().url(),
    REDIS_URL: z.string().url(),
});

export const FileServiceEnvSchema = z.object({
    PORT: z.string().default("8003"),
    MONGODB_URI: z.string().url(),
});

export const AIServiceEnvSchema = z.object({
    PORT: z.string().default("8004"),
    MONGODB_URI: z.string().url(),
    FILE_SERVICE: z.string().url(),
    AUTH_SERVICE: z.string().url(),
    OPENROUTER_API_KEY: z.string(),
});

export const TerminalServiceEnvSchema = z.object({
    PORT: z.string().default("8005"),
    MONGODB_URI: z.string().url(),
    FILE_SERVICE: z.string().url(),
    REDIS_URL: z.string().url(),
});

export const PaymentServiceEnvSchema = z.object({
    PORT: z.string().default("8006"),
    MONGODB_URI: z.string().url(),
    REDIS_URL: z.string().url(),
    RAZORPAY_KEY_ID: z.string(),
    RAZORPAY_KEY_SECRET: z.string(),
    AUTH_SERVICE: z.string().url(),
});
