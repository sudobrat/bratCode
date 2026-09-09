import api from "../utils/axios.ts";
import {
    FileSchema,
    type CreateRootFolder,
    type CreateFolder,
    type CreateFile,
    type UpdateFile,
} from "@bratCode/zod";

export const createRootFolder = async (input: CreateRootFolder) => {
    try {
        const { data } = await api.post("/api/file/create-root-folder", input);
        return FileSchema.parse(data);
    } catch (err) {
        console.log(err);
        return null;
    }
};

export const createFolder = async (input: CreateFolder) => {
    try {
        const { data } = await api.post("/api/file/create-folder", input);
        return FileSchema.parse(data);
    } catch (err) {
        console.log(err);
        return null;
    }
};

export const createFile = async (input: CreateFile) => {
    try {
        const { data } = await api.post("/api/file/create-file", input);
        return FileSchema.parse(data);
    } catch (err) {
        console.log(err);
        return null;
    }
};

export const updateFile = async (id: string, input: UpdateFile) => {
    try {
        const { data } = await api.post(`/api/file/update/${id}`, input);
        return FileSchema.parse(data);
    } catch (err) {
        console.log(err);
        return null;
    }
};

export const deleteFile = async (id: string) => {
    try {
        const { data } = await api.delete(`/api/file/${id}`);
        return FileSchema.parse(data);
    } catch (err) {
        console.log(err);
        return null;
    }
};

export const getFile = async (id: string) => {
    try {
        const { data } = await api.get(`/api/file/${id}`);
        return FileSchema.parse(data);
    } catch (err) {
        console.log(err);
        return null;
    }
};

export const getTree = async (projectId: string) => {
    try {
        const { data } = await api.get(`/api/file/tree/${projectId}`);
        return data;
    } catch (err) {
        console.log(err);
        return null;
    }
};
