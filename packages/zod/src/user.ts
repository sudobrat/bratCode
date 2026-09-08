import { z } from "zod";

export const UserSchema = z.object({
    _id: z.coerce.string(),
    firebaseUID: z.string(),
    name: z.string(),
    email: z.string().email(),
    avatar: z.string().default(""),
    createdAt: z.coerce.string(),
    updatedAt: z.coerce.string(),
});

export type User = z.infer<typeof UserSchema>;

export const SessionUserSchema = z.object({
    _id: z.coerce.string(),
    name: z.string(),
    email: z.string().email(),
    avatar: z.string().default(""),
});

export type SessionUser = z.infer<typeof SessionUserSchema>;

export const LoginSchema = z.object({
    token: z.string().min(1, "Firebase ID token is required"),
});
