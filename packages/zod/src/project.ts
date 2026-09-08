import { z } from "zod";

export const ProjectSchema = z.object({
    _id: z.coerce.string(),
    owner: z.coerce.string(),
    name: z.string(),
    description: z.string().optional(),
    starred: z.boolean(),
    lastOpenedAt: z.coerce.string(),
    createdAt: z.coerce.string(),
    updatedAt: z.coerce.string(),
});

export const ProjectsSchema = z.array(ProjectSchema);

export type Project = z.infer<typeof ProjectSchema>;

export const CreateProjectSchema = z.object({
    name: z.string().min(1, "Project name is required"),
    description: z.string().default(""),
});
export type CreateProject = z.infer<typeof CreateProjectSchema>;

export const ProjectIdParamSchema = z.object({
    id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid project ID"),
});
export type ProjectIdParam = z.infer<typeof ProjectIdParamSchema>;
