import { useState, useEffect } from "react";
import ActivityBar from "../components/ActivityBar";
import TopBar from "../components/TopBar";
import { AnimatePresence, motion } from "motion/react";
import Explorer from "../components/Explorer";
import { useParams } from "react-router-dom";
import { getProjectById } from "../features/project";
import { useDispatch } from "react-redux";
import { setCurrentProject } from "../redux/projectSlice";
import { getTree } from "../features/file";
import type { FileTreeNode } from "@bratCode/zod";
import { Bot, Code2, Eye, Files, Maximize2, Minimize2, TerminalSquare } from "lucide-react";
import Editor from "../components/Editor";
import Preview from "../components/Preview";
import Terminal from "../components/Terminal";
import AIChat from "../components/AIChat";

function ProjectPage() {
    const { id } = useParams();
    if (!id) return;

    const [tree, setTree] = useState<FileTreeNode[]>([]);
    const [showPreview, setShowPreview] = useState(false);
    const [isPreviewFullScreen, setPreviewFullScreen] = useState(false);
    const [showExplorer, setShowExplorer] = useState(false);
    const [showAIChat, setShowAIChat] = useState(false);
    const [showTerminal, setShowTerminal] = useState(false);
    const [openTabs, setOpenTabs] = useState<FileTreeNode[]>([]);
    const [activeTab, setActiveTab] = useState<FileTreeNode | null>(null);
    const [mobilePane, setMobilePane] = useState<"explorer" | "editor" | "chat">("explorer");

    const dispatch = useDispatch();

    const handleGetProject = async () => {
        const data = await getProjectById(id);
        dispatch(setCurrentProject(data));
    };

    const loadTree = async () => {
        const data = await getTree(id);
        setTree(data);
    };

    useEffect(() => {
        handleGetProject();
        loadTree();
    }, [id]);

    const openFile = (file: FileTreeNode) => {
        const exists = openTabs.find((tab) => tab._id === file._id);

        if (!exists) {
            setOpenTabs([...openTabs, file]);
        }
        setActiveTab(file);
        setShowPreview(false);
    };

    const closeFile = (fileId: string) => {
        setOpenTabs((prevTabs) => {
            const newTabs = prevTabs.filter((tab) => tab._id !== fileId);
            setActiveTab((prevActive) => {
                if (prevActive?._id === fileId) {
                    return newTabs.length > 0 ? newTabs[newTabs.length - 1] : null;
                }
                return prevActive;
            });
            return newTabs;
        });
    };

    return (
        <div className="relative flex h-screen flex-col overflow-hidden bg-[#0a0a0c]">
            <div className="pointer-events-none absolute -top-40 left-1/3 h-96 w-96 rounded-full bg-sky-500/10 blur-[140px]" />
            <div className="pointer-events-none absolute -top-20 right-1/4 h-80 w-80 rounded-full bg-violet-500/10 blur-[140px]" />

            <TopBar showPreview={showPreview} setShowPreview={setShowPreview} />

            <div className="flex flex-1 overflow-hidden">
                <div className="hidden md:flex">
                    <ActivityBar
                        showExplorer={showExplorer}
                        setShowExplorer={setShowExplorer}
                        showAIChat={showAIChat}
                        setShowAIChat={setShowAIChat}
                        showTerminal={showTerminal}
                        setShowTerminal={setShowTerminal}
                    />
                </div>
                <div className={`${mobilePane === "explorer" ? "flex" : "hidden"} w-full md:flex md:w-auto`}>
                    <AnimatePresence initial={false}>
                        {showExplorer && (
                            <Explorer
                                projectId={id}
                                tree={tree}
                                openFile={openFile}
                                closeFile={closeFile}
                                reloadTree={loadTree}
                            />
                        )}
                    </AnimatePresence>
                </div>

                <div
                    className={`${mobilePane === "editor" ? "flex" : "hidden"} relative w-full min-w-0 flex-1 flex-col overflow-hidden border-x border-white/5 md:flex`}>
                    <div className="pointer-events-none absolute right-2 top-2 z-40 flex items-center gap-1.5 sm:right-4 sm:top-3 sm:gap-2">
                        {showPreview && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                type="button"
                                onClick={() => setPreviewFullScreen((v) => !v)}
                                title={isPreviewFullScreen ? "Exit fullscreen" : "Fullscreen preview"}
                                className="pointer-events-auto flex items-center justify-center rounded-lg border border-white/10 bg-[#111113]/95 p-1.5 text-zinc-400 shadow-lg shadow-black/40 backdrop-blur-xl hover:text-white sm:p-2">
                                {isPreviewFullScreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                            </motion.button>
                        )}

                        <div className="pointer-events-auto flex items-center gap-0.5 rounded-lg border border-white/10 bg-[#111113]/95 p-1 shadow-lg shadow-black/40 backdrop-blur">
                            <button
                                onClick={() => {
                                    setShowPreview(false);
                                    setPreviewFullScreen(false);
                                }}
                                className={`relative flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold transition-colors sm:px-3 sm:py-1.5 sm:text-xs ${
                                    !showPreview ? "text-white" : "text-zinc-500 hover:text-zinc-300"
                                }`}>
                                {!showPreview && (
                                    <motion.div
                                        className="absolute inset-0 rounded-md bg-linear-to-b from-zinc-700 to-zinc-800"
                                        transition={{
                                            type: "spring",
                                            duration: 0.4,
                                            bounce: 0.15,
                                        }}
                                    />
                                )}
                                <Code2 size={13} className="relative" />
                                <span className="relative hidden sm:inline">Editor</span>
                            </button>
                            <button
                                onClick={() => setShowPreview(true)}
                                className={`relative flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold transition-colors sm:px-3 sm:py-1.5 sm:text-xs ${
                                    showPreview ? "text-white" : "text-zinc-500 hover:text-zinc-300"
                                }`}>
                                {showPreview && (
                                    <motion.div
                                        className="absolute inset-0 rounded-md bg-linear-to-b from-zinc-700 to-zinc-800"
                                        transition={{
                                            type: "spring",
                                            duration: 0.4,
                                            bounce: 0.15,
                                        }}
                                    />
                                )}
                                <Eye size={13} className="relative" />
                                <span className="relative hidden sm:inline">Preview</span>
                            </button>
                        </div>
                    </div>

                    <div className="flex min-h-0 flex-1 overflow-hidden">
                        {showPreview ? (
                            <Preview tree={tree} />
                        ) : openTabs.length > 0 ? (
                            <Editor
                                activeTab={activeTab}
                                openTabs={openTabs}
                                setActiveTab={setActiveTab}
                                setOpenTabs={setOpenTabs}
                                tree={tree}
                            />
                        ) : (
                            <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-[#0a0a0c] text-zinc-600">
                                <Code2 size={40} strokeWidth={1} />
                                <span className="text-[13px]">Open a file to start editing</span>
                            </div>
                        )}
                    </div>

                    <AnimatePresence>
                        {showPreview && isPreviewFullScreen && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ duration: 0.15, ease: "easeOut" }}
                                className="fixed inset-0 z-50 bg-white">
                                <Preview tree={tree} />
                                <motion.button
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    onClick={() => setPreviewFullScreen(false)}
                                    className="absolute right-2 top-2 z-110 flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#111113]/95 px-2.5 py-1.5 text-[11px] font-medium text-zinc-300 shadow-lg shadow-black/40 backdrop-blur hover:text-white sm:right-4 sm:top-3 sm:px-3 sm:text-xs">
                                    <Minimize2 size={13} />
                                </motion.button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence>
                        {showTerminal && (
                            <div className="max-h-[45vh] md:max-h-none">
                                <Terminal projectId={id} onClose={() => setShowTerminal(false)} />
                            </div>
                        )}
                    </AnimatePresence>
                </div>

                <div className={`${mobilePane === "chat" ? "flex" : "hidden"} w-full md:flex md:w-auto`}>
                    <AnimatePresence initial={false}>
                        {showAIChat && <AIChat projectId={id} onClose={() => setShowAIChat(false)} />}
                    </AnimatePresence>
                </div>
            </div>

            <div className="flex items-center justify-around border-t border-white/6 bg-[#0f0f12] py-2 md:hidden">
                <button
                    onClick={() => {
                        setMobilePane("explorer");
                        setShowExplorer(true);
                    }}
                    className={`flex flex-col items-center gap-1 px-4 py-1 text-[11px] font-medium transition-colors ${
                        mobilePane === "explorer" ? "text-white" : "text-zinc-500"
                    }`}>
                    <Files size={18} />
                    Files
                </button>
                <button
                    onClick={() => {
                        setMobilePane("editor");
                    }}
                    className={`flex flex-col items-center gap-1 px-4 py-1 text-[11px] font-medium transition-colors ${
                        mobilePane === "editor" ? "text-white" : "text-zinc-500"
                    }`}>
                    <Code2 size={18} />
                    Editor
                </button>
                <button
                    onClick={() => {
                        setMobilePane("chat");
                        setShowAIChat(true);
                    }}
                    className={`flex flex-col items-center gap-1 px-4 py-1 text-[11px] font-medium transition-colors ${
                        mobilePane === "chat" ? "text-white" : "text-zinc-500"
                    }`}>
                    <Bot size={18} />
                    AI Chat
                </button>
                <button
                    onClick={() => {
                        setShowTerminal((v) => !v);
                    }}
                    className={`flex flex-col items-center gap-1 px-4 py-1 text-[11px] font-medium transition-colors ${
                        showTerminal ? "text-white" : "text-zinc-500"
                    }`}>
                    <TerminalSquare size={18} />
                    Terminal
                </button>
            </div>
        </div>
    );
}
export default ProjectPage;
