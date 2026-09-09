import type { FileTreeNode } from "@bratCode/zod";
import {
    ChevronRight,
    FilePlus2,
    FolderClosed,
    FolderOpen,
    FolderPlus,
    Pencil,
    Trash,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import getFolderColor, { getFileIcon } from "../utils/customizeIcon";
import {
    createFile,
    createFolder,
    deleteFile,
    updateFile,
} from "../features/file";
import { createPortal } from "react-dom";

function Folder({
    projectId,
    tree,
    node,
    reloadTree,
    openFile,
    closeFile,
}: {
    projectId: string;
    tree: FileTreeNode[];
    node: FileTreeNode;
    reloadTree: () => Promise<void>;
    openFile: (file: FileTreeNode) => void;
    closeFile: (fileId: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const [folderName, setFolderName] = useState("");
    const [fileName, setFileName] = useState("");
    const [creatingFolderIn, setCreatingFolderIn] = useState<string | null>(
        null,
    );
    const [creatingFileIn, setCreatingFileIn] = useState<string | null>(null);
    const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
    const [renaming, setRenaming] = useState(false);
    const [renameValue, setRenameValue] = useState("");

    const folderColor = getFolderColor(node.name);

    const handleCreateFolder = async () => {
        await createFolder({
            projectId,
            name: folderName,
            parentId: node?._id,
        });
        await reloadTree();
        setFolderName("");
    };
    const handleCreateFile = async () => {
        const lang = fileName.split(".").pop() || "plainText"
        await createFile({ projectId, name: fileName, parentId: node?._id , language:lang});
        await reloadTree();
        setFileName("");
    };

    const handleRenameFile = async () => {
        await updateFile(node._id, {
            name: renameValue,
            content: node.content,
        });
        await reloadTree();
    };

    const handleDeleteFile = async () => {
        closeFile(node._id);
        await deleteFile(node._id);
        await reloadTree();
    };

    const handleNewFolder = (node: FileTreeNode) => {
        setCreatingFolderIn(node._id);
        setCreatingFileIn("");
    };

    const handleNewFile = (node: FileTreeNode) => {
        setCreatingFileIn(node._id);
        setCreatingFolderIn("");
    };

    if (node.type == "file") {
        const { icon: Icon, color } = getFileIcon(node.name);
        return (
            <div className="relative" onClick={() => openFile(node)}>
                <motion.div
                    whileHover={{ x: 2 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="group flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-white/5 transition-colors"
                    onContextMenu={(e) => {
                        e.preventDefault();
                        setMenu({
                            x: e.clientX,
                            y: e.clientY,
                        });
                    }}
                >
                    <div className="flex min-w-0 flex-1 cursor-pointer items-center gap-1.5">
                        <Icon size={13} className={color} />

                        <span className="truncate text-[13px] text-zinc-300 transition-colors group-hover:text-white">
                            {node.name}
                        </span>
                    </div>
                </motion.div>

                {menu &&
                    createPortal(
                        <>
                            <motion.div
                                className="fixed inset-0 z-40"
                                onClick={() => setMenu(null)}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            />

                            <motion.div
                                initial={{ opacity: 0, scale: 0.96, y: -6 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.96, y: -6 }}
                                transition={{ duration: 0.14, ease: "easeOut" }}
                                className="fixed z-50 w-52 rounded-xl border border-white/8 bg-[#17171a]/95 py-1.5 shadow-2xl shadow-black/50 backdrop-blur-xl"
                                style={{ left: menu.x, top: menu.y }}
                            >
                                <button
                                    className="mx-1 flex w-[calc(100%-8px)] items-center gap-2 rounded-md px-3 py-2 text-left text-[13px] text-zinc-300 transition-colors hover:bg-white/6 hover:text-white"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setMenu(null);
                                        setRenaming(true);
                                    }}
                                >
                                    <Pencil size={13} />
                                    Rename
                                </button>
                                <button
                                    className="mx-1 flex w-[calc(100%-8px)] items-center gap-2 rounded-md px-3 py-2 text-left text-[13px] text-zinc-300 transition-colors hover:bg-white/6 hover:text-white"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteFile();
                                        setMenu(null);
                                    }}
                                >
                                    <Trash size={13} />
                                    Delete
                                </button>
                            </motion.div>
                        </>,
                        document.body,
                    )}

                {renaming && (
                    <div className="py-1 pl-1">
                        <motion.input
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            autoFocus
                            value={renameValue}
                            placeholder={node.name}
                            className="w-full rounded-md border border-white/10 bg-white/4 px-2.5 py-1.5 text-[13px] text-white placeholder-zinc-500 outline-none transition-all focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/15"
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    handleRenameFile();
                                    setRenameValue("");
                                    setRenaming(false);
                                }
                                if (e.key === "Escape") {
                                    setRenameValue("");
                                    setRenaming(false);
                                }
                            }}
                        />
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="relative">
            <motion.div
                whileHover={{ x: 2 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="group flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-white/5 transition-colors"
                onContextMenu={(e) => {
                    e.preventDefault();
                    setMenu({
                        x: e.clientX,
                        y: e.clientY,
                    });
                }}
            >
                <div
                    className="flex min-w-0 flex-1 cursor-pointer items-center gap-1.5"
                    onClick={() => setOpen(!open)}
                >
                    <motion.div
                        animate={{ rotate: open ? 90 : 0 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="shrink-0"
                    >
                        <ChevronRight size={14} className="text-zinc-500" />
                    </motion.div>
                    {open ? (
                        <FolderOpen
                            size={16}
                            className={`shrink-0 ${folderColor}`}
                        />
                    ) : (
                        <FolderClosed
                            size={16}
                            className={`shrink-0 ${folderColor}`}
                        />
                    )}

                    <span className="truncate text-[13px] text-zinc-300 transition-colors group-hover:text-white">
                        {node.name}
                    </span>
                </div>

                <div className="hidden items-center gap-0.5 group-hover:flex">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.92 }}
                        className="rounded-md p-1 text-zinc-500 hover:bg-white/10 hover:text-white"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleNewFile(node);
                            setOpen(true);
                        }}
                    >
                        <FilePlus2 size={13} />
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.92 }}
                        className="rounded-md p-1 text-zinc-500 hover:bg-white/10 hover:text-white"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleNewFolder(node);
                            setOpen(true);
                        }}
                    >
                        <FolderPlus size={13} />
                    </motion.button>
                </div>
            </motion.div>

            {menu &&
                createPortal(
                    <>
                        <motion.div
                            className="fixed inset-0 z-40"
                            onClick={() => setMenu(null)}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: -6 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: -6 }}
                            transition={{ duration: 0.14, ease: "easeOut" }}
                            className="fixed z-50 w-52 rounded-xl border border-white/8 bg-[#17171a]/95 py-1.5 shadow-2xl shadow-black/50 backdrop-blur-xl"
                            style={{ left: menu.x, top: menu.y }}
                        >
                                <button
                                    className="mx-1 flex w-[calc(100%-8px)] items-center gap-2 rounded-md px-3 py-2 text-left text-[13px] text-zinc-300 transition-colors hover:bg-white/6 hover:text-white"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setMenu(null);
                                        handleNewFile(node);
                                    }}
                                >
                                <FilePlus2 size={13} />
                                New File
                            </button>
                                <button
                                    className="mx-1 flex w-[calc(100%-8px)] items-center gap-2 rounded-md px-3 py-2 text-left text-[13px] text-zinc-300 transition-colors hover:bg-white/6 hover:text-white"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setMenu(null);
                                        handleNewFolder(node);
                                    }}
                                >
                                <FolderPlus size={13} />
                                New Folder
                            </button>

                            <div className="my-1 h-px bg-white/8" />
                                <button
                                    className="mx-1 flex w-[calc(100%-8px)] items-center gap-2 rounded-md px-3 py-2 text-left text-[13px] text-zinc-300 transition-colors hover:bg-white/6 hover:text-white"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setMenu(null);
                                        setRenaming(true);
                                    }}
                                >
                                <Pencil size={13} />
                                Rename
                            </button>

                            {node.parentId !== null && (
                                    <button
                                        className="mx-1 flex w-[calc(100%-8px)] items-center gap-2 rounded-md px-3 py-2 text-left text-[13px] text-zinc-300 transition-colors hover:bg-white/6 hover:text-white"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteFile();
                                            setMenu(null);
                                        }}
                                    >
                                    <Trash size={13} />
                                    Delete
                                </button>
                            )}
                        </motion.div>
                    </>,
                    document.body,
                )}

            {open && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.16, ease: "easeOut" }}
                    className="ml-5 overflow-hidden border-l border-white/5 pl-1"
                >
                    {[...node.children]
                        .sort((a, b) => (a.type === b.type ? 0 : a.type === "folder" ? -1 : 1))
                        .map((child) => (
                        <Folder
                            key={child._id}
                            projectId={projectId}
                            tree={tree}
                            reloadTree={reloadTree}
                            node={child}
                            openFile={openFile}
                            closeFile={closeFile}
                        />
                    ))}
                </motion.div>
            )}

            {creatingFolderIn === node._id && (
                <div className="py-1 pl-1">
                    <motion.input
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        autoFocus
                        value={folderName}
                        placeholder="Folder Name"
                        className="w-full rounded-md border border-white/10 bg-white/4 px-2.5 py-1.5 text-[13px] text-white placeholder-zinc-500 outline-none transition-all focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/15"
                        onChange={(e) => setFolderName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                handleCreateFolder();
                                setFolderName("");
                                setCreatingFolderIn(null);
                            }
                            if (e.key === "Escape") {
                                setFolderName("");
                                setCreatingFolderIn(null);
                            }
                        }}
                    />
                </div>
            )}
            {creatingFileIn === node._id && (
                <div className="py-1 pl-1">
                    <motion.input
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        autoFocus
                        value={fileName}
                        placeholder="File Name"
                        className="w-full rounded-md border border-white/10 bg-white/4 px-2.5 py-1.5 text-[13px] text-white placeholder-zinc-500 outline-none transition-all focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/15"
                        onChange={(e) => setFileName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                handleCreateFile();
                                setFileName("");
                                setCreatingFileIn(null);
                            }
                            if (e.key === "Escape") {
                                setFileName("");
                                setCreatingFileIn(null);
                            }
                        }}
                    />
                </div>
            )}

            {renaming && (
                <div className="py-1 pl-1">
                    <motion.input
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        autoFocus
                        value={renameValue}
                        placeholder={node.name}
                        className="w-full rounded-md border border-white/10 bg-white/4 px-2.5 py-1.5 text-[13px] text-white placeholder-zinc-500 outline-none transition-all focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/15"
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                handleRenameFile();
                                setRenameValue("");
                                setRenaming(false);
                            }
                            if (e.key === "Escape") {
                                setRenameValue("");
                                setRenaming(false);
                            }
                        }}
                    />
                </div>
            )}
        </div>
    );
}
export default Folder;
