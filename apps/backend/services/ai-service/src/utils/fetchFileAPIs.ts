import { env } from "../config/env";
import { type UpdateFile, type CreateFile, type CreateFolder, ProjectIdParam } from "@bratCode/zod";
import { log } from "@bratCode/logger";
import axios from "axios";

const FILE_SERVICE_URL = env.FILE_SERVICE;

export const createFolder = async ({ userId, projectId, parentId, name }: CreateFolder & { userId: string }) => {
    try {
        const { data } = await axios.post(
            `${FILE_SERVICE_URL}/create-folder`,
            {
                projectId,
                parentId,
                name,
            },
            {
                headers: {
                    "x-user-id": userId,
                },
            },
        );
        return data;
    } catch (error) {
        log(error, "Error creating folder");
        throw error;
    }
};

export const createFile = async ({
    projectId,
    parentId,
    content = "",
    name,
    language = "plainText",
    userId,
}: CreateFile & { userId: string }) => {
    try {
        const { data } = await axios.post(
            `${FILE_SERVICE_URL}/create-file`,
            {
                projectId,
                parentId,
                content,
                name,
                language,
            },
            {
                headers: {
                    "x-user-id": userId,
                },
            },
        );
        return data;
    } catch (error) {
        log(error, "Error creating file");
        throw error;
    }
};

export const updateFile = async ({
    name,
    content,
    userId,
    fileId,
}: UpdateFile & { userId: string; fileId: string }) => {
    try {
        const { data } = await axios.post(
            `${FILE_SERVICE_URL}/update/${fileId}`,
            {
                name,
                content,
            },
            {
                headers: {
                    "x-user-id": userId,
                },
            },
        );
        return data;
    } catch (error) {
        log(error, "Error updating file");
        throw error;
    }
};

export const deleteFile = async ({ id, userId }: ProjectIdParam & { userId: string }) => {
    try {
        const { data } = await axios.delete(`${FILE_SERVICE_URL}/${id}`, {
            headers: {
                "x-user-id": userId,
            },
        });
        return data;
    } catch (error) {
        log(error, "Error deleting file");
        throw error;
    }
};

export const getFile = async ({ id, userId }: ProjectIdParam & { userId: string }) => {
    try {
        const { data } = await axios.get(`${FILE_SERVICE_URL}/${id}`, {
            headers: {
                "x-user-id": userId,
            },
        });
        return data;
    } catch (error) {
        log(error, "Error getting file");
        throw error;
    }
};

export const getTree = async ({ id, userId }: ProjectIdParam & { userId: string }) => {
    try {
        const { data } = await axios.get(`${FILE_SERVICE_URL}/tree/${id}`, {
            headers: {
                "x-user-id": userId,
            },
        });
        return data;
    } catch (error) {
        log(error, "Error getting tree");
        throw error;
    }
};
