import { z } from "zod";

export const FileSchema = z.object({
    _id: z.coerce.string(),
    owner: z.coerce.string(),
    parentId: z.coerce.string().nullable(),
    projectId: z.coerce.string(),
    name: z.string(),
    type: z.enum(["file", "folder"]),
    extension: z.string().default(""),
    language: z.string().default("plainText"),
    content: z.string().default(""),
    size: z.number().default(0),
    isDeleted: z.boolean().default(false),
    createdAt: z.coerce.string(),
    updatedAt: z.coerce.string(),
});

export type File = z.infer<typeof FileSchema>;

export interface FileTreeNode extends File {
    children: FileTreeNode[];
}

export const FilesSchema = z.array(FileSchema);

export const CreateRootFolderSchema = z.object({
    projectId: z.string().min(1, "Project ID is required"),
    projectName: z.string().min(1, "Project name is required"),
});

export const CreateFolderSchema = z.object({
    projectId: z.string().min(1, "Project ID is required"),
    parentId: z.string().min(1, "Parent ID is required"),
    name: z.string().min(1, "Folder name is required"),
});
export type CreateRootFolder = z.infer<typeof CreateRootFolderSchema>;
export type CreateFolder = z.infer<typeof CreateFolderSchema>;

export const CreateFileSchema = z.object({
    projectId: z.string().min(1, "Project ID is required"),
    parentId: z.string().min(1, "Parent ID is required"),
    name: z.string().min(1, "File name is required"),
    content: z.string().default("").optional(),
    language: z.string().default("plainText").optional(),
});
export type CreateFile = z.infer<typeof CreateFileSchema>;

export const UpdateFileSchema = z.object({
    name: z.string().min(1, "File name is required"),
    content: z.string().optional(),
});
export type UpdateFile = z.infer<typeof UpdateFileSchema>;
