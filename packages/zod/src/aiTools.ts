import { z } from "zod";

export const getTreeToolSchema = z.object({});

export const getFileToolSchema = z.object({
    fileId: z.string(),
});

export const createFolderToolSchema = z.object({
    name: z.string(),
    parentId: z.string().optional(),
});

export const createFileToolSchema = z.object({
    name: z.string(),
    parentId: z.string(),
    language: z.string().optional(),
    content: z.string(),
});

export const updateFileToolSchema = z.object({
    name: z.string(),
    fileId: z.string(),
    content: z.string().optional(),
});

export const deleteFileToolSchema = z.object({
    fileId: z.string(),
});
