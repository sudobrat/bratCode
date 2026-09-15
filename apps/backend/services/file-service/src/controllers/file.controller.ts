import type { Request, Response } from "express";
import {
    CreateRootFolderSchema,
    CreateFolderSchema,
    CreateFileSchema,
    UpdateFileSchema,
    FileSchema,
    ProjectIdParamSchema,
} from "@bratCode/zod";
import { buildTree } from "../utils/buildTree";
import { execCommandInPod, getProjectPod } from "../k8s";
import path from "path";

// Helper to encode and decode IDs that contain both project info and file paths
const encodeId = (projectId: string, filePath: string) => `${projectId}:${filePath}`;

const parseId = (id: string) => {
    const splitIndex = id.indexOf(":");
    if (splitIndex === -1) return { projectId: "", filePath: id };
    return { projectId: id.substring(0, splitIndex), filePath: id.substring(splitIndex + 1) };
};

const createMockFile = (
    projectId: string,
    filePath: string,
    name: string,
    type: "file" | "folder",
    parentPath: string | null,
    content = ""
) => {
    return {
        _id: encodeId(projectId, filePath),
        owner: "system",
        projectId,
        parentId: parentPath ? encodeId(projectId, parentPath) : null,
        name,
        type,
        extension: name.includes(".") ? name.split(".").pop() || "" : "",
        language: "plainText",
        content,
        size: content.length,
        isDeleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
};

export const createRootFolder = async (req: Request, res: Response) => {
    try {
        const parsed = CreateRootFolderSchema.safeParse(req.body);
        if (!parsed.success) return res.status(400).json({ message: "Project ID and Name are required" });
        const { projectId, projectName } = parsed.data;

        // Ensure pod is spun up for this project
        await getProjectPod(projectId, projectName);

        // Root folder is just "." conceptually
        const rootFolder = createMockFile(projectId, ".", projectName, "folder", null);
        return res.status(201).json(FileSchema.parse(rootFolder));
    } catch (error) {
        return res.status(500).json({ message: `Internal Server Error: ${error}` });
    }
};

export const createFolder = async (req: Request, res: Response) => {
    try {
        const parsed = CreateFolderSchema.safeParse(req.body);
        if (!parsed.success) return res.status(400).json({ message: "Invalid payload" });
        
        const { projectId, parentId, name } = parsed.data;
        const podName = await getProjectPod(projectId);
        
        const { filePath: parentPath } = parentId ? parseId(parentId) : { filePath: "." };
        const dirPath = parentPath !== "." ? `${parentPath}/${name}` : `./${name}`;
        
        const { exitCode, stderr } = await execCommandInPod(podName, ["mkdir", "-p", dirPath]);
        if (exitCode !== 0) return res.status(500).json({ message: `Failed to create folder: ${stderr}` });

        const folder = createMockFile(projectId, dirPath, name.split("/").pop() || name, "folder", parentPath);
        return res.status(201).json(FileSchema.parse(folder));
    } catch (error) {
        return res.status(500).json({ message: `Internal Server Error: ${error}` });
    }
};

export const createFile = async (req: Request, res: Response) => {
    try {
        const parsed = CreateFileSchema.safeParse(req.body);
        if (!parsed.success) return res.status(400).json({ message: "Invalid payload" });
        
        const { projectId, parentId, name, content = "" } = parsed.data;
        const podName = await getProjectPod(projectId);
        
        const { filePath: parentPath } = parseId(parentId);
        const filePath = parentPath !== "." ? `${parentPath}/${name}` : `./${name}`;
        
        const dirPath = path.posix.dirname(filePath);
        if (dirPath !== ".") {
            await execCommandInPod(podName, ["mkdir", "-p", dirPath]);
        }

        const script = `require('fs').writeFileSync(${JSON.stringify(filePath)}, Buffer.from("${Buffer.from(content).toString('base64')}", "base64"))`;
        const { exitCode, stderr } = await execCommandInPod(podName, ["node", "-e", script]);
        if (exitCode !== 0) return res.status(500).json({ message: `Failed to create file: ${stderr}` });

        const file = createMockFile(projectId, filePath, name.split("/").pop() || name, "file", parentPath, content);
        return res.status(201).json(FileSchema.parse(file));
    } catch (error) {
        return res.status(500).json({ message: `Internal Server Error: ${error}` });
    }
};

export const updateFile = async (req: Request, res: Response) => {
    try {
        const fileId = req.params.id;
        if (!fileId) return res.status(400).json({ message: "Invalid file ID" });
        
        const parsed = UpdateFileSchema.safeParse(req.body);
        if (!parsed.success) return res.status(400).json({ message: "Invalid payload" });
        
        const { projectId, filePath } = parseId(fileId);
        const { name, content } = parsed.data;
        const podName = await getProjectPod(projectId);

        // If the name changed, we need to move it
        const currentName = path.posix.basename(filePath);
        let targetFilePath = filePath;
        
        if (name && name !== currentName) {
            const dirPath = path.posix.dirname(filePath);
            targetFilePath = dirPath !== "." ? `${dirPath}/${name}` : `./${name}`;
            await execCommandInPod(podName, ["mv", filePath, targetFilePath]);
        }

        if (content !== undefined) {
            const script = `require('fs').writeFileSync(${JSON.stringify(targetFilePath)}, Buffer.from("${Buffer.from(content).toString('base64')}", "base64"))`;
            await execCommandInPod(podName, ["node", "-e", script]);
        }

        const file = createMockFile(
            projectId, 
            targetFilePath, 
            name || currentName, 
            "file", 
            path.posix.dirname(targetFilePath), 
            content
        );
        return res.status(201).json(FileSchema.parse(file));
    } catch (error) {
        return res.status(500).json({ message: `Internal Server Error: ${error}` });
    }
};

export const deleteFile = async (req: Request, res: Response) => {
    try {
        const fileId = req.params.id;
        if (!fileId) return res.status(400).json({ message: "Invalid file ID" });
        
        const { projectId, filePath } = parseId(fileId);
        const podName = await getProjectPod(projectId);

        await execCommandInPod(podName, ["rm", "-rf", filePath]);

        const file = createMockFile(projectId, filePath, path.posix.basename(filePath), "file", path.posix.dirname(filePath));
        file.isDeleted = true;
        
        return res.status(201).json(FileSchema.parse(file));
    } catch (error) {
        return res.status(500).json({ message: `Internal Server Error: ${error}` });
    }
};

export const getFile = async (req: Request, res: Response) => {
    try {
        const fileId = req.params.id;
        if (!fileId) return res.status(400).json({ message: "Invalid file ID" });
        
        const { projectId, filePath } = parseId(fileId);
        const podName = await getProjectPod(projectId);

        const { stdout: content, exitCode } = await execCommandInPod(podName, ["cat", filePath]);
        if (exitCode !== 0) return res.status(404).json({ message: "File not found" });

        const file = createMockFile(projectId, filePath, path.posix.basename(filePath), "file", path.posix.dirname(filePath), content);
        return res.status(200).json(FileSchema.parse(file));
    } catch (error) {
        return res.status(500).json({ message: `Internal Server Error: ${error}` });
    }
};

export const getTree = async (req: Request, res: Response) => {
    try {
        const paramsParsed = ProjectIdParamSchema.safeParse(req.params);
        if (!paramsParsed.success) return res.status(400).json({ message: "Invalid project ID" });
        
        const projectId = paramsParsed.data.id;
        const podName = await getProjectPod(projectId);

        // A tiny Node.js script executed inside the pod to walk the directory
        // and return a JSON array of all files formatted like our mocked files!
        const script = `
        const fs = require('fs');
        const path = require('path');
        const crypto = require('crypto');

        function walk(dir, parentPath) {
            let results = [];
            let files = [];
            try {
                files = fs.readdirSync(dir);
            } catch (e) {
                return results; // Directory might not exist yet
            }
            
            for (const file of files) {
                if (file === 'node_modules' || file === '.git' || file === '.npm') continue;
                const filePath = dir === '.' ? './' + file : dir + '/' + file;
                
                let stats;
                try {
                    stats = fs.statSync(filePath);
                } catch(e) {
                    continue;
                }
                
                const isDir = stats.isDirectory();
                
                results.push({
                    _id: "${projectId}:" + filePath,
                    owner: "system",
                    projectId: "${projectId}",
                    parentId: parentPath === null ? null : "${projectId}:" + parentPath,
                    name: file,
                    type: isDir ? 'folder' : 'file',
                    extension: isDir ? '' : path.extname(file).replace('.', ''),
                    language: 'plainText',
                    content: '',
                    size: stats.size,
                    isDeleted: false,
                    createdAt: stats.birthtime,
                    updatedAt: stats.mtime,
                });
                
                if (isDir) {
                    results = results.concat(walk(filePath, filePath));
                }
            }
            return results;
        }
        
        const root = {
            _id: "${projectId}:.",
            owner: "system",
            projectId: "${projectId}",
            parentId: null,
            name: "project",
            type: "folder",
            extension: "",
            language: "plainText",
            content: "",
            size: 0,
            isDeleted: false,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        console.log(JSON.stringify([root, ...walk('.', '.')]));
        `;

        const { stdout, stderr, exitCode } = await execCommandInPod(podName, ["node", "-e", script]);
        if (exitCode !== 0) return res.status(500).json({ message: `Tree fetch failed: ${stderr}` });

        let files = [];
        try {
            files = JSON.parse(stdout);
        } catch (e) {
            return res.status(500).json({ message: "Failed to parse tree JSON" });
        }

        const tree = buildTree(FileSchema.array().parse(files));
        return res.status(200).json(tree);
    } catch (error) {
        return res.status(500).json({ message: `Internal Server Error: ${error}` });
    }
};
