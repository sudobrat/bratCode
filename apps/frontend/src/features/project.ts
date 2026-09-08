import api from "../utils/axios.ts";
import { CreateProject, ProjectSchema, ProjectsSchema } from "@bratCode/zod";

export const createProject = async (input: CreateProject) => {
    try {
        const { data } = await api.post("/api/project", input);
        return ProjectSchema.parse(data);
    } catch (err) {
        console.log(err);
        return null;
    }
};

export const getProjects = async () => {
    try {
        const { data } = await api.get("/api/project");
        return ProjectsSchema.parse(data);
    } catch (err) {
        console.log(err);
        return [];
    }
};

export const getProjectById = async (id: string) => {
    try {
        const { data } = await api.get(`/api/project/${id}`);
        return ProjectSchema.parse(data);
    } catch (err) {
        console.log(err);
        return null;
    }
};

export const getStarredProjects = async () => {
    try {
        const { data } = await api.get("/api/project/starred");
        return ProjectsSchema.parse(data);
    } catch (err) {
        console.log(err);
        return [];
    }
};

export const toggleStar = async (id: string) => {
    try {
        const { data } = await api.patch(`/api/project/${id}`);
        return ProjectSchema.parse(data);
    } catch (err) {
        console.log(err);
        return null;
    }
};

export const deleteProject = async (id: string) => {
    try {
        const { data } = await api.delete(`/api/project/${id}`);
        return data;
    } catch (err) {
        console.log(err);
        return null;
    }
};
