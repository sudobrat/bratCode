import { useEffect, useRef, useState } from "react";
import { TerminalSquare, X, Eraser, ExternalLink } from "lucide-react";
import { motion } from "motion/react";
import { Terminal as XTerminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { io } from "socket.io-client";
import { useSelector } from "react-redux";

export default function Terminal({ projectId: _projectId, onClose, onFileChange }: { projectId?: string; onClose: () => void; onFileChange?: () => void }) {
    const { currentProject } = useSelector((state: any) => state.project || {});
    const projectId = currentProject?._id || _projectId;
    const userId = currentProject?.owner || "guest";
    const projectName = currentProject?.name || currentProject?.title || "project";

    const containerRef = useRef<HTMLDivElement>(null);
    const terminalRef = useRef<XTerminal | null>(null);
    const [connected, setConnected] = useState(false);
    const [port, setPort] = useState("5173");

    const handleOpenPreview = () => {
        const terminalUrl = import.meta.env.VITE_TERMINAL_SERVICE_URL || "http://localhost:8005";
        const previewUrl = `${terminalUrl}/preview/${projectId}/${port}`;
        window.open(previewUrl, "_blank");
    };

    useEffect(() => {
        if (!projectId || !userId || !containerRef.current) return;

        const terminal = new XTerminal({
            cursorBlink: true,
            cursorStyle: "block",
            fontSize: 13,
            fontFamily: "Menlo, Monaco, Consolas, monospace",
            scrollback: 5000,
            theme: {
                background: "#0d0d0f",
                foreground: "#d4d4d4",
                cursor: "#ffffff",
                selectionBackground: "#264f78",
            },
        });

        const fitAddon = new FitAddon();
        terminal.loadAddon(fitAddon);
        terminal.open(containerRef.current);
        terminalRef.current = terminal;

        const fitTerminal = () => {
            try {
                fitAddon.fit();
            } catch (error) {
                console.log(error);
            }
        };
        fitTerminal();

        const terminal_url = import.meta.env.VITE_TERMINAL_SERVICE_URL || "http://localhost:8005";

        const socket = io(terminal_url, {
            transports: ["websocket"],
            withCredentials: true,
        });

        socket.on("connect", () => {
            setConnected(true);
            fitTerminal();
            socket.emit("terminal:init", { projectId, userId, projectName, rows: terminal.rows, cols: terminal.cols });
        });

        socket.on("file:refresh", () => {
            if (onFileChange) {
                onFileChange();
            }
        });

        socket.on("terminal:data", (data) => {
            terminal.write(String(data || ""));
        });

        socket.on("terminal:ready", () => {
            fitTerminal();
            socket.emit("terminal:resize", { rows: terminal.rows, cols: terminal.cols });
            terminal.focus();
        });

        const input = terminal.onData((data) => {
            if (!socket.connected) return;
            socket.emit("terminal:write", data);
        });

        const resizeTerminal = () => {
            fitTerminal();
            if (!socket.connected) return;
            socket.emit("terminal:resize", { cols: terminal.cols, rows: terminal.rows });
        };

        window.addEventListener("resize", resizeTerminal);

        const resizeObserver = new ResizeObserver(() => resizeTerminal());
        resizeObserver.observe(containerRef.current);

        const focusTerminal = () => {
            terminal.focus();
        };

        containerRef.current.addEventListener("click", focusTerminal);

        socket.on("connect_error", (error) => {
            setConnected(false);
            terminal.write(`\r\n\x1b[31m${error.message}\x1b[0m\r\n`);
        });

        socket.on("disconnect", () => {
            setConnected(false);
        });

        return () => {
            window.removeEventListener("resize", resizeTerminal);
            resizeObserver.disconnect();
            if (containerRef.current) {
                containerRef.current.removeEventListener("click", focusTerminal);
            }
            input.dispose();
            socket.disconnect();
            terminal.dispose();
        };
    }, [projectId, userId]);

    const clearTerminal = () => {
        const terminal = terminalRef.current;
        if (!terminal) return;
        terminal.clear();
        terminal.write("\x1b[2J\x1b[H");
        terminal.focus();
    };

    return (
        <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 256, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex shrink-0 flex-col overflow-hidden border-t border-white/6 bg-[#111113]">
            <div className="flex h-9 shrink-0 items-center justify-between border-b border-white/6 px-3">
                <div className="flex items-center gap-1">
                    <h2 className="relative flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-semibold tracking-wide transition-colors text-white">
                        <TerminalSquare size={13} className="relative" />
                        <span className="relative uppercase">Terminal</span>
                    </h2>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 mr-2">
                        <input
                            type="text"
                            value={port}
                            onChange={(e) => setPort(e.target.value)}
                            placeholder="Port"
                            className="w-16 rounded border border-white/10 bg-[#1e1e20] px-1.5 py-0.5 text-[11px] text-zinc-300 outline-none focus:border-sky-500/50"
                        />
                        <button
                            onClick={handleOpenPreview}
                            title="Open Preview in New Tab"
                            className="flex items-center gap-1 rounded bg-sky-500/10 px-2 py-0.5 text-[11px] font-medium text-sky-400 transition-colors hover:bg-sky-500/20">
                            <ExternalLink size={12} />
                            Preview
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <span
                            className={`h-1.5 w-1.5 rounded-full ${
                                connected ? "bg-emerald-400" : "bg-zinc-600"
                            }`}
                        />
                        <span className="text-[11px] text-zinc-500">
                            {connected ? "connected" : "disconnected"}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={clearTerminal}
                            title="Clear terminal"
                            className="rounded p-1 text-zinc-500 transition-colors hover:bg-white/10 hover:text-white">
                            <Eraser size={12} />
                        </button>
                        <button
                            onClick={onClose}
                            title="Close panel"
                            className="rounded-md p-1 text-zinc-500 hover:bg-white/10 hover:text-white">
                            <X size={14} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="min-h-0 flex-1 bg-[#0d0d0f]">
                <div ref={containerRef} className="h-full w-full cursor-text overflow-hidden pl-3 pt-2" />
            </div>
        </motion.div>
    );
}
