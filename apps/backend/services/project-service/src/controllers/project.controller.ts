import type { Request, Response } from "express";
import Project from "../models/project.model";
import redis from "@bratCode/redis";
import {
    CreateProjectSchema,
    ProjectIdParamSchema,
    ProjectSchema,
    ProjectsSchema,
} from "@bratCode/zod";

export const createProject = async (req: Request, res: Response) => {
    try {
        const userId = req.headers["x-user-id"] as string;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const parsed = CreateProjectSchema.safeParse(req.body);
        if (!parsed.success) {
            return res
                .status(400)
                .json({ message: "Project name is required" });
        }
        const { name, description } = parsed.data;

        const project = await Project.create({
            owner: userId,
            name,
            description,
        });

        await redis.del(`projects:${userId}`);

        return res.status(201).json(ProjectSchema.parse(project));
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

export const getProjects = async (req: Request, res: Response) => {
    try {
        const userId = req.headers["x-user-id"] as string;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const key = `projects:${userId}`;

        const cachedProjects = await redis.get(key);
        if (cachedProjects) {
            return res
                .status(200)
                .json(ProjectsSchema.parse(JSON.parse(cachedProjects)));
        }

        const projects = await Project.find({ owner: userId }).sort({
            updatedAt: -1,
        });
        await redis.set(key, JSON.stringify(projects), "EX", 24 * 60 * 60);

        return res.status(200).json(ProjectsSchema.parse(projects));
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

export const getProjectById = async (req: Request, res: Response) => {
    try {
        const userId = req.headers["x-user-id"] as string;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const paramsParsed = ProjectIdParamSchema.safeParse(req.params);
        if (!paramsParsed.success) {
            return res.status(400).json({ message: "Project id is required" });
        }
        const { id } = paramsParsed.data;

        const project = await Project.findById(id);
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        if (project.owner.toString() !== userId) {
            return res.status(403).json({ message: "Forbidden" });
        }

        // since this api is called when we open the project
        project.lastOpenedAt = new Date();
        await project.save();

        return res.status(200).json(ProjectSchema.parse(project));
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

export const getStarredProjects = async (req: Request, res: Response) => {
    try {
        const userId = req.headers["x-user-id"] as string;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const key = `projects:${userId}:starred`;

        const cachedProjects = await redis.get(key);
        if (cachedProjects) {
            return res
                .status(200)
                .json(ProjectsSchema.parse(JSON.parse(cachedProjects)));
        }

        const projects = await Project.find({
            owner: userId,
            starred: true,
        }).sort({
            updatedAt: -1,
        });

        await redis.set(key, JSON.stringify(projects), "EX", 24 * 60 * 60);

        return res.status(200).json(ProjectsSchema.parse(projects));
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

export const toggleStar = async (req: Request, res: Response) => {
    try {
        const userId = req.headers["x-user-id"] as string;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const paramsParsed = ProjectIdParamSchema.safeParse(req.params);
        if (!paramsParsed.success) {
            return res.status(400).json({ message: "Project id is required" });
        }
        const { id } = paramsParsed.data;

        const project = await Project.findById(id);
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        if (project.owner.toString() !== userId) {
            return res.status(403).json({ message: "Forbidden" });
        }

        project.starred = !project.starred;
        await project.save();
        await redis.del(`projects:${userId}:starred`);
        await redis.del(`projects:${userId}`);

        return res.status(200).json(ProjectSchema.parse(project));
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

export const deleteProject = async (req: Request, res: Response) => {
    try {
        const userId = req.headers["x-user-id"] as string;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const paramsParsed = ProjectIdParamSchema.safeParse(req.params);
        if (!paramsParsed.success) {
            return res.status(400).json({ message: "Project id is required" });
        }
        const { id } = paramsParsed.data;

        const project = await Project.findById(id);
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        if (project.owner.toString() !== userId) {
            return res.status(403).json({ message: "Forbidden" });
        }

        await project.deleteOne();
        await redis.del(`projects:${userId}`);
        await redis.del(`projects:${userId}:starred`);

        return res
            .status(200)
            .json({ message: "Project deleted successfully" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};
