import { z } from "zod";

export const chatRoleSchema = z.enum(["user", "assistant", "tool"]);
export type ChatRole = z.infer<typeof chatRoleSchema>;

export const aiToolTypeSchema = z.enum([
    "folder_created",
    "file_created",
    "file_updated",
    "file_deleted",
]);
export type AIToolType = z.infer<typeof aiToolTypeSchema>;

export const chatMessageSchema = z.object({
    role: chatRoleSchema,
    content: z.string().optional(),
    toolType: z.string().optional(),
    detail: z.string().optional(),
    error: z.boolean().optional(),
});
export type ChatMessage = z.infer<typeof chatMessageSchema>;

export const historyMessageSchema = z.object({
    role: z.string().optional(),
    content: z.string().optional(),
});
export type HistoryMessage = z.infer<typeof historyMessageSchema>;

export const chatRequestSchema = z.object({
    projectId: z.string(),
    message: z.string(),
    history: z.array(historyMessageSchema).optional(),
});
export type ChatRequest = z.infer<typeof chatRequestSchema>;

export const graphSchema = z.object({
    projectId: z.string(),
    userId: z.string(),
});
export type Graph = z.infer<typeof graphSchema>;
