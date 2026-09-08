import type { Request, Response } from "express";
import File from "../models/file.model";
import {
    CreateRootFolderSchema,
    CreateFolderSchema,
    CreateFileSchema,
    UpdateFileSchema,
    FileSchema,
    ProjectIdParamSchema,
} from "@bratCode/zod";
import { buildTree } from "../utils/buildTree";

export const createRootFolder = async (req: Request, res: Response) => {
    try {
        const userId = req.headers["x-user-id"] as string;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const parsed = CreateRootFolderSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                message: "Project ID and Name are required",
            });
        }
        const { projectId, projectName } = parsed.data;

        const existingRootFolder = await File.findOne({
            projectId,
            parentId: null,
            type: "folder",
            isDeleted: false,
        });
        if (existingRootFolder) {
            return res
                .status(400)
                .json({ message: "Root folder already exists" });
        }

        const rootFolder = await File.create({
            owner: userId,
            projectId,
            name: projectName,
            type: "folder",
            parentId: null,
        });

        return res.status(201).json(FileSchema.parse(rootFolder));
    } catch (error) {
        return res.status(500).json({
            message: `Internal Server Error: ${error}`,
        });
    }
};

export const createFolder = async (req: Request, res: Response) => {
    try {
        const userId = req.headers["x-user-id"] as string;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const parsed = CreateFolderSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                message: "Project ID and folder Name are required",
            });
        }
        const { projectId, parentId, name } = parsed.data;

        const exist = await File.findOne({
            projectId,
            parentId,
            name,
            isDeleted: false,
            type: "folder",
        });

        if (exist) {
            return res.status(400).json({
                message: "Folder with this name already exists",
            });
        }

        const folder = await File.create({
            owner: userId,
            projectId,
            name,
            type: "folder",
            parentId,
        });

        return res.status(201).json(FileSchema.parse(folder));
    } catch (error) {
        return res.status(500).json({
            message: `Internal Server Error: ${error}`,
        });
    }
};

export const createFile = async (req: Request, res: Response) => {
    try {
        const userId = req.headers["x-user-id"] as string;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const parsed = CreateFileSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                message: "Project ID and File Name are required",
            });
        }
        const { projectId, parentId, name, content, language } = parsed.data;

        const exist = await File.findOne({
            projectId,
            parentId,
            name,
            isDeleted: false,
            type: "file",
        });

        if (exist) {
            return res.status(400).json({
                message: "File with this name already exists",
            });
        }

        const extension = name?.includes(".") ? name?.split(".").pop() : "";

        const file = await File.create({
            owner: userId,
            projectId,
            name,
            type: "file",
            parentId: parentId || null,
            language,
            content,
            extension,
            size: content.length,
        });

        return res.status(201).json(FileSchema.parse(file));
    } catch (error) {
        return res.status(500).json({
            message: `Internal Server Error: ${error}`,
        });
    }
};

export const updateFile = async (req: Request, res: Response) => {
    try {
        const userId = req.headers["x-user-id"] as string;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const paramsParsed = ProjectIdParamSchema.safeParse(req.params);
        if (!paramsParsed.success) {
            return res.status(400).json({ message: "Invalid file ID" });
        }

        const parsed = UpdateFileSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                message: "File name and content are required",
            });
        }
        const { name, content } = parsed.data;

        const file = await File.findOne({
            _id: paramsParsed.data.id,
            isDeleted: false,
            owner: userId,
        });

        if (!file) {
            return res.status(404).json({
                message: "File not found",
            });
        }

        const extension = name?.includes(".")
            ? (name?.split(".").pop() ?? "")
            : "";
        file.name = name;
        file.extension = extension;
        file.content = content;
        file.size = content.length;

        await file.save();

        return res.status(201).json(FileSchema.parse(file));
    } catch (error) {
        return res.status(500).json({
            message: `Internal Server Error: ${error}`,
        });
    }
};

export const deleteFile = async (req: Request, res: Response) => {
    try {
        const userId = req.headers["x-user-id"] as string;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const paramsParsed = ProjectIdParamSchema.safeParse(req.params);
        if (!paramsParsed.success) {
            return res.status(400).json({ message: "Invalid file ID" });
        }

        const file = await File.findByIdAndUpdate(
            paramsParsed.data.id,
            { isDeleted: true },
            { new: true },
        );

        if (!file) {
            return res.status(404).json({
                message: "File not found",
            });
        }

        return res.status(201).json(FileSchema.parse(file));
    } catch (error) {
        return res.status(500).json({
            message: `Internal Server Error: ${error}`,
        });
    }
};

export const getFile = async (req: Request, res: Response) => {
    try {
        const userId = req.headers["x-user-id"] as string;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const paramsParsed = ProjectIdParamSchema.safeParse(req.params);
        if (!paramsParsed.success) {
            return res.status(400).json({ message: "Invalid file ID" });
        }

        const file = await File.findOne({
            _id: paramsParsed.data.id,
            isDeleted: false,
            owner: userId,
        });

        if (!file) {
            return res.status(404).json({
                message: "File not found",
            });
        }

        return res.status(200).json(FileSchema.parse(file));
    } catch (error) {
        return res.status(500).json({
            message: `Internal Server Error: ${error}`,
        });
    }
};

export const getTree = async (req: Request, res: Response) => {
    try {
        const userId = req.headers["x-user-id"] as string;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const paramsParsed = ProjectIdParamSchema.safeParse(req.params);
        if (!paramsParsed.success) {
            return res.status(400).json({ message: "Invalid file ID" });
        }

        const projectId = paramsParsed.data.id;

        const files = await File.find({
            projectId,
            isDeleted: false,
            owner: userId,
        }).sort({
            name: 1,
            type: -1,
        });

        if (!files) {
            return res.status(404).json({
                message: "Files not found",
            });
        }

        const tree = buildTree(FileSchema.array().parse(files));

        return res.status(200).json(tree);
    } catch (error) {
        return res.status(500).json({
            message: `Internal Server Error: ${error}`,
        });
    }
};
