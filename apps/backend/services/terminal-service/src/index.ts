import { env } from "./config/env";

import { log } from "@bratCode/logger";

import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import http from "http";
import { Server, Socket } from "socket.io";
import os from "os";
import path from "path";
import fs from "fs/promises";
import { createProxyMiddleware } from "http-proxy-middleware";
import { createPodForProject, execTerminal } from "./k8s.js";

dotenv.config();
const port = env.PORT || 8005;
const app = express();
app.use(express.json());

const fileServiceUrl = env.FILE_SERVICE || "http://localhost:8003";

// Setup Reverse Proxy for Preview URLs
// This routes requests like /preview/projectId/5173 to the Kubernetes Service
app.use(
    "/preview/:projectId/:port",
    (req, res, next) => {
        const { projectId, port } = req.params;
        // In Kubernetes, services are accessible via internal DNS: <service>.<namespace>.svc.cluster.local
        const target = `http://ide-svc-${projectId}.default.svc.cluster.local:${port}`;

        createProxyMiddleware({
            target,
            changeOrigin: true,
            ws: true, // Needed for Vite HMR (Hot Module Replacement)
            pathRewrite: (path) => {
                // Strip the /preview/projectId/port prefix so the dev server sees requests starting at /
                return path.replace(`/preview/${projectId}/${port}`, "");
            },
            on: {
                error: (err: any, req: any, res: any) => {
                    log(`Proxy error for ${projectId}:${port} - ${err.message}`);
                    if (!res.headersSent) {
                        res.writeHead(502);
                        res.end(`Bad Gateway: Could not connect to dev server on port ${port}. Is it running?`);
                    }
                }
            },
        })(req, res, next);
    }
);

// We keep this just in case we need temporary workspace storage, but
// with PVCs we might not need it locally. For now, keep it for backwards compatibility if needed.
const WORKSPACE_ROOT = path.join(os.tmpdir(), "bratCode");

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: true,
        credentials: true,
    },
});

interface Session {
    projectId: string;
    userId: string;
    podName: string;
    ws: any; // Kubernetes WebSocket connection
    inStream: any; // PassThrough stream for stdin
}

const sessions = new Map<string, Session>();

const send = (socket: Socket, data: any) => {
    if (!socket.connected) {
        return;
    }
    socket.emit("terminal:data", String(data || ""));
};

const safeName = (name: string) => {
    if (!name || name === "." || name === ".." || name.includes("/") || name.includes("\\")) {
        throw new Error(`Invalid file/folder name: ${name}`);
    }
    return name;
};

const workspace = (projectId: string) => {
    return path.join(WORKSPACE_ROOT, String(projectId));
};

const normaliseCols = (cols: any) => {
    const value = Number(cols);
    if (!Number.isFinite(value)) {
        return 80;
    }
    return Math.max(20, Math.min(Math.floor(value), 500));
};

const normaliseRows = (rows: any) => {
    const value = Number(rows);
    if (!Number.isFinite(value)) {
        return 30;
    }
    return Math.max(5, Math.min(Math.floor(value), 200));
};

const getTree = async (projectId: string, userId: string): Promise<any[]> => {
    const url = `${fileServiceUrl}/tree/${projectId}`;

    const response = await fetch(url, {
        headers: {
            "x-user-id": String(userId),
        },
    });

    const text = await response.text();
    let data: any = {};
    try {
        data = text ? JSON.parse(text) : {};
    } catch (error) {
        data = { message: text };
    }

    if (!response.ok) {
        throw new Error(data?.message || `File service returned ${response.status}`);
    }

    return Array.isArray(data) ? data : [];
};

const writeNodes = async (nodes: any[], directory: string) => {
    if (!Array.isArray(nodes)) return;

    for (const node of nodes) {
        const name = safeName(node.name);
        const target = path.join(directory, name);
        if (node.type === "folder") {
            await fs.mkdir(target, { recursive: true });
            await writeNodes(node.children || [], target);
            continue;
        }
        if (node.type === "file") {
            await fs.mkdir(path.dirname(target), { recursive: true });
            await fs.writeFile(target, node.content || "", "utf8");
        }
    }
};

const syncProject = async (projectId: string, userId: string) => {
    const tree = await getTree(projectId, userId);

    const root = workspace(projectId);
    await fs.mkdir(root, { recursive: true });

    if (tree.length == 1 && tree[0]?.type == "folder") {
        await writeNodes(tree[0].children || [], root);
    } else {
        await writeNodes(tree, root);
    }

    return {
        tree,
        root,
    };
};

io.on("connection", (socket: Socket) => {
    console.log("Terminal Connected", socket?.id);

    socket.on("terminal:init", async ({ projectId, userId, projectName = "project", cols = 80, rows = 30 }: any) => {
        try {
            console.log("terminal initialized");
            projectId = String(projectId);
            userId = String(userId);
            projectName = String(projectName);

            if (!projectId || !userId) {
                throw new Error("Project ID and User ID are required");
            }

            const existingSession = sessions.get(socket.id);

            if (existingSession) {
                try {
                    existingSession.ws?.close();
                } catch (error) {}
                sessions.delete(socket.id);
            }

            cols = normaliseCols(cols);
            rows = normaliseRows(rows);

            // Temporarily still sync to local for now, but we will move to PVC
            const { root } = await syncProject(projectId, userId);

            // 1. Create or get Kubernetes Pod
            const podName = await createPodForProject(projectId, projectName);

            // 2. Connect via Exec WebSocket
            const { ws, inStream } = await execTerminal(
                podName,
                cols,
                rows,
                (data: string) => {
                    send(socket, data);
                },
                (exitCode: number) => {
                    send(socket, `\r\n\x1b[90m[shell exited: ${exitCode}]\x1b[0m\r\n`);
                    const session = sessions.get(socket.id);
                    if (session?.ws === ws) {
                        sessions.delete(socket.id);
                    }
                },
            );

            sessions.set(socket.id, {
                projectId,
                userId,
                podName,
                ws,
                inStream,
            });

            socket.emit("terminal:ready", { cols, rows });
        } catch (error: any) {
            console.log("terminal:init error", error);
            send(socket, `\r\n\x1b[31m${error.message}\x1b[0m\r\n`);
        }
    });

    socket.on("terminal:write", (data: any) => {
        const session = sessions.get(socket.id);
        if (!session || !session.inStream) return;

        // Write data directly to the stream (k8s client will format it for ws)
        session.inStream.write(data);

        // Hacky but effective: if the user presses enter, they likely ran a command.
        // Tell the frontend to refresh the file tree shortly after.
        if (data === "\r" || data === "\n" || data?.includes("\r")) {
            setTimeout(() => {
                socket.emit("file:refresh");
            }, 500);
        }
    });

    socket.on("terminal:resize", ({ cols, rows }: any) => {
        const session = sessions.get(socket.id);
        if (!session || !session.ws) return;
        cols = Number(cols);
        rows = Number(rows);

        if (!Number.isFinite(cols) || !Number.isFinite(rows)) return;
        cols = normaliseCols(cols);
        rows = normaliseRows(rows);

        // Kubernetes exec uses channel 4 for resize
        const resizeMessage = JSON.stringify({
            Width: cols,
            Height: rows,
        });

        const resizeBuffer = Buffer.alloc(resizeMessage.length + 1);
        resizeBuffer.writeUInt8(4, 0);
        resizeBuffer.write(resizeMessage, 1);
        session.ws.send(resizeBuffer);
    });

    socket.on("disconnect", () => {
        console.log("terminal disconnected");
        const session = sessions.get(socket.id);
        if (session) {
            try {
                session.ws?.close();
            } catch {}
            sessions.delete(socket.id);
        }
    });
});

app.get("/health", (req: express.Request, res: express.Response) => {
    return res.json({
        success: true,
        service: "terminal",
    });
});

server.listen(port, () => {
    connectDB();
    console.log(`terminal service started at ${port}`);
});
