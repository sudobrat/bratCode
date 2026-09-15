import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { graph } from "../graph/graph.js";
import { Request, Response } from "express";
import { log } from "@bratCode/logger";
import type { HistoryMessage } from "@bratCode/zod";
import { deductCredits } from "../utils/deductCredits.js";

const buildHistory = (history?: HistoryMessage[] | unknown) => {
    if (!Array.isArray(history)) {
        return [];
    }
    const recents = history.slice(-6);
    return recents
        .filter((recent): recent is { role: "user" | "assistant"; content: string } =>
            Boolean(recent?.content && (recent.role === "user" || recent.role === "assistant")),
        )
        .map((msg) => {
            if (msg.role === "user") {
                return new HumanMessage(msg.content);
            }
            return new AIMessage(msg.content);
        });
};

const sendEvent = (res: Response, type: string, data: any) => {
    if (res.writableEnded || res.destroyed) {
        return false;
    }

    try {
        res.write(`event:${type}\n`);
        res.write(`data:${JSON.stringify(data || {})}\n\n`);
        return true;
    } catch (error) {
        console.error(`SSE error: ${error}`);
        return false;
    }
};

export const chat = async (req: Request, res: Response) => {
    let disconnected = false;
    let keepAlive: NodeJS.Timeout | undefined;
    try {
        const { projectId, message, history = [] } = req.body;
        const userId = req.headers["x-user-id"] as string;
        if (!userId) {
            return res.status(401).json({
                message: "Unauthorized",
            });
        }
        if (!projectId) {
            return res.status(400).json({
                message: "project is id not found",
            });
        }

        if (!message) {
            return res.status(400).json({
                message: "message not found",
            });
        }

        res.setHeader("Content-Type", "text/event-stream; charset=utf-8");

        res.setHeader("Cache-Control", "no-cache, no-transform");

        res.setHeader("Connection", "keep-alive");

        res.setHeader("X-Accel-Buffering", "no");

        res.flushHeaders?.();

        res.write(":ok\n\n");

        res.once("close", () => {
            disconnected = true;
            log("AI CLIENT DISCONNECTED");
        });

        sendEvent(res, "start", {
            success: true,
            message: "AI Started",
        });

        const graphData = graph({ projectId, userId });
        const messages = buildHistory(history);
        messages.push(new HumanMessage(message.trim()));

        const creditResult = await deductCredits({ userId, amount: 10 });
        if (!creditResult.success) {
            sendEvent(res, "error", {
                success: false,
                message: creditResult.error || "insufficient credits",
            });
            res.end();
            return;
        }

        keepAlive = setInterval(() => {
            if (!res.writableEnded) {
                res.write(":\n\n"); // SSE comment to keep connection alive
                (res as any).flush?.();
            }
        }, 15000);

        res.once("close", () => {
            clearInterval(keepAlive);
        });

        const stream = await graphData.stream(
            {
                messages,
            },
            {
                streamMode: "updates",
                recursionLimit: 40,
            },
        );

        let finalMessage = "";

        for await (const chunk of stream) {
            if (disconnected || res.writableEnded) break;

            if (chunk?.agent) {
                const agentMessages = chunk.agent?.messages;
                const last = agentMessages[agentMessages.length - 1];
                if (!last) {
                    continue;
                }

                if (Array.isArray(last.tool_calls) && last.tool_calls?.length) {
                    for (const call of last.tool_calls) {
                        sendEvent(res, "tool_start", {
                            tool: call.name,
                            args: call.args || {},
                        });
                    }
                    continue;
                }

                let content = "";
                if (typeof last.content == "string") {
                    content = last.content;
                } else if (Array.isArray(last.content)) {
                    content = last.content
                        .filter((item) => item.type == "text")
                        .map((item) => item.text)
                        .join("");
                }

                if (content) {
                    finalMessage = content;
                    sendEvent(res, "message", { content });
                }
            }

            if (chunk.tools) {
                const toolMessages = chunk.tools?.messages || [];
                for (const toolMessage of toolMessages) {
                    let result = toolMessage.content;
                    try {
                        result = typeof result == "string" ? JSON.parse(result) : result;
                    } catch (error) {
                        continue;
                    }
                    if (result?.operation) {
                        sendEvent(res, result.operation, result);
                    }
                }
            }
        }

        if (!disconnected && !res.writableEnded) {
            clearInterval(keepAlive);
            sendEvent(res, "done", {
                success: true,
                message: finalMessage || "done",
            });
            res.end();
        }
    } catch (error: any) {
        clearInterval(keepAlive);
        log("AI STREAM ERROR:", error);
        if (disconnected) {
            return;
        }
        const errorMessage = error?.message || "AI request failed.";
        if (res.headersSent) {
            sendEvent(res, "error", {
                success: false,
                message: errorMessage,
            });

            if (!res.writableEnded) {
                res.end();
            }
            return;
        }

        return res.status(500).json({
            success: false,
            message: errorMessage,
        });
    }
};
