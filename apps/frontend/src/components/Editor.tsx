import type { FileTreeNode } from "@bratCode/zod";
import { AnimatePresence, motion } from "motion/react";
import { getFileIcon } from "../utils/customizeIcon";
import { Check, ChevronRight, Loader2, Save, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import MonacoEditor from "@monaco-editor/react";

const EXT_TO_LANG: Record<string, string> = {
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    py: "python",
    rb: "ruby",
    md: "markdown",
    yml: "yaml",
    sh: "shell",
};

function getMonacoLanguage(lang?: string): string {
    if (!lang) return "plaintext";
    return EXT_TO_LANG[lang] || lang;
}

function flattenTree(
    nodes: FileTreeNode[],
    map: Map<string, FileTreeNode> = new Map(),
): Map<string, FileTreeNode> {
    for (const node of nodes) {
        map.set(node._id, node);
        if (node.children?.length) flattenTree(node.children, map);
    }
    return map;
}

function buildPath(
    node: FileTreeNode,
    nodeMap: Map<string, FileTreeNode>,
): string[] {
    const segments: string[] = [];
    let current: FileTreeNode | undefined = node;
    while (current) {
        segments.unshift(current.name);
        current = current.parentId ? nodeMap.get(current.parentId) : undefined;
    }
    return segments;
}

function Editor({
    openTabs,
    activeTab,
    setActiveTab,
    tree,
    unsavedFiles,
    onContentChange,
    onSaveFile,
    closeFile,
}: {
    openTabs: FileTreeNode[];
    activeTab: FileTreeNode | null;
    setActiveTab: (
        tab: FileTreeNode | null | ((prev: FileTreeNode | null) => FileTreeNode | null),
    ) => void;
    setOpenTabs: (
        tabs: FileTreeNode[] | ((prev: FileTreeNode[]) => FileTreeNode[]),
    ) => void;
    tree: FileTreeNode[];
    unsavedFiles: Record<string, string>;
    onContentChange: (
        fileId: string,
        newContent: string,
        originalContent?: string,
    ) => void;
    onSaveFile: (fileId: string, content: string) => Promise<void>;
    closeFile: (id: string) => void;
}) {
    const [saving, setSaving] = useState(false);
    const [justSaved, setJustSaved] = useState(false);
    const [code, setCode] = useState(() => {
        if (!activeTab) return "";
        return unsavedFiles[activeTab._id] !== undefined
            ? unsavedFiles[activeTab._id]
            : activeTab.content || "";
    });

    useEffect(() => {
        if (activeTab) {
            const val =
                unsavedFiles[activeTab._id] !== undefined
                    ? unsavedFiles[activeTab._id]
                    : activeTab.content || "";
            setCode(val);
        } else {
            setCode("");
        }
    }, [activeTab?._id, activeTab?.content]);

    const handleCodeChange = (newVal: string | undefined) => {
        const val = newVal || "";
        setCode(val);
        if (activeTab) {
            onContentChange(activeTab._id, val, activeTab.content);
        }
    };

    const nodeMap = useMemo(() => flattenTree(tree), [tree]);

    const breadcrumbPath = useMemo(() => {
        if (!activeTab) return [];
        return buildPath(activeTab, nodeMap);
    }, [activeTab, nodeMap]);

    const isCurrentUnsaved = activeTab
        ? Boolean(
              unsavedFiles[activeTab._id] !== undefined &&
                  unsavedFiles[activeTab._id] !== (activeTab.content || ""),
          )
        : false;

    const save = async () => {
        if (!activeTab || saving) return;
        try {
            setSaving(true);
            await onSaveFile(activeTab._id, code);
            setJustSaved(true);
            setSaving(false);
            setTimeout(() => setJustSaved(false), 1500);
        } catch (error) {
            setSaving(false);
            console.error("Failed to save file:", error);
        }
    };

    const saveRef = useRef(save);
    saveRef.current = save;

    // Window keydown listener for Ctrl+S / Cmd+S (fallback when Monaco does not have direct focus)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
                e.preventDefault();
                e.stopPropagation();
                saveRef.current();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    return (
        <div className="flex flex-1 flex-col bg-[#0a0a0c]">
            <div className="flex h-10 shrink-0 items-center overflow-x-auto border-b border-white/6 bg-[#111113]/90">
                <AnimatePresence initial={false}>
                    {openTabs.map((tab) => {
                        const active = activeTab?._id === tab?._id;
                        const { icon: Icon, color } = getFileIcon(tab.name);
                        const isUnsaved = Boolean(
                            unsavedFiles[tab._id] !== undefined &&
                                unsavedFiles[tab._id] !== (tab.content || ""),
                        );

                        return (
                            <motion.div
                                key={tab._id}
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: "auto" }}
                                exit={{ opacity: 0, width: 0 }}
                                transition={{ duration: 0.15 }}
                                onClick={() => setActiveTab(tab)}
                                title={isUnsaved ? `${tab.name} • Unsaved` : tab.name}
                                className={`group relative flex h-full cursor-pointer items-center gap-2 whitespace-nowrap border-r border-white/5 px-3.5 transition-colors ${
                                    active
                                        ? "bg-[#0a0a0c] text-white"
                                        : "text-zinc-500 hover:bg-white/2 hover:text-zinc-300"
                                }`}
                            >
                                <Icon size={14} className={color} />
                                <span className="text-[13px]">{tab?.name}</span>

                                <div className="relative flex h-4 w-4 items-center justify-center">
                                    {isUnsaved ? (
                                        <>
                                            <span
                                                title="Unsaved changes"
                                                className="h-2 w-2 rounded-full bg-amber-400 shadow-xs shadow-amber-400/50 group-hover:hidden transition-opacity"
                                            />
                                            <button
                                                className="hidden rounded p-0.5 text-zinc-400 hover:bg-white/10 hover:text-white group-hover:flex"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    closeFile(tab._id);
                                                }}
                                                title="Close"
                                            >
                                                <X size={13} />
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            className="rounded p-0.5 text-zinc-500 opacity-0 hover:bg-white/10 hover:text-white group-hover:opacity-100 transition-opacity"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                closeFile(tab._id);
                                            }}
                                            title="Close"
                                        >
                                            <X size={13} />
                                        </button>
                                    )}
                                </div>

                                {active && (
                                    <motion.div
                                        className="absolute inset-x-0 bottom-0 h-0.5 bg-linear-to-r from-sky-400 to-violet-400"
                                        transition={{
                                            duration: 0.2,
                                            ease: "easeOut",
                                        }}
                                    />
                                )}
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {activeTab && (
                <div className="flex h-8 shrink-0 items-center border-b border-white/6 px-4">
                    <div className="flex min-w-0 items-center gap-1 overflow-hidden">
                        {breadcrumbPath.map((segment, i) => {
                            const isLast = i === breadcrumbPath.length - 1;
                            return (
                                <span
                                    key={i}
                                    className="flex shrink-0 items-center gap-1"
                                >
                                    {i > 0 && (
                                        <ChevronRight
                                            size={11}
                                            className="text-zinc-600"
                                        />
                                    )}
                                    <span
                                        className={`text-[12px] ${
                                            isLast
                                                ? "text-zinc-300"
                                                : "text-zinc-500"
                                        }`}
                                    >
                                        {segment}
                                    </span>
                                </span>
                            );
                        })}
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={save}
                        disabled={saving}
                        title={
                            saving
                                ? "Saving…"
                                : justSaved
                                  ? "Saved!"
                                  : isCurrentUnsaved
                                    ? "Unsaved changes (Ctrl+S to save)"
                                    : "Save file (Ctrl+S)"
                        }
                        className={`ml-2 flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                            justSaved
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : isCurrentUnsaved
                                  ? "bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25"
                                  : "text-zinc-500 hover:bg-white/8 hover:text-zinc-200 border border-transparent"
                        } disabled:cursor-not-allowed disabled:opacity-40`}
                    >
                        <AnimatePresence initial={false} mode="wait">
                            {saving ? (
                                <motion.div
                                    key="saving"
                                    initial={{ opacity: 0, rotate: -90 }}
                                    animate={{ opacity: 1, rotate: 0 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <Loader2
                                        size={13}
                                        className="animate-spin"
                                    />
                                </motion.div>
                            ) : justSaved ? (
                                <motion.div
                                    key="saved"
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex items-center gap-1"
                                >
                                    <Check size={13} />
                                    <span>Saved</span>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="save"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex items-center gap-1"
                                >
                                    <Save size={13} />
                                    {isCurrentUnsaved && (
                                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.button>
                </div>
            )}

            <div className="min-h-0 flex-1">
                <MonacoEditor
                    height="100%"
                    theme="bratCode-dark"
                    language={getMonacoLanguage(activeTab?.language)}
                    value={code}
                    onChange={handleCodeChange}
                    onMount={(editor, monaco) => {
                        // Register Ctrl+S / Cmd+S command when Monaco editor has focus
                        editor.addCommand(
                            monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
                            () => {
                                saveRef.current();
                            },
                        );
                        // Register in Monaco's action palette
                        editor.addAction({
                            id: "save-file",
                            label: "Save File",
                            keybindings: [
                                monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
                            ],
                            run: () => {
                                saveRef.current();
                            },
                        });
                    }}
                    beforeMount={(monaco) => {
                        monaco.editor.defineTheme("bratCode-dark", {
                            base: "vs-dark",
                            inherit: true,
                            rules: [],
                            colors: {
                                "editor.background": "#0a0a0c",
                                "editorGutter.background": "#0a0a0c",
                                "editorLineNumber.foreground": "#3a3a4a",
                                "editor.lineHighlightBackground": "#ffffff06",
                                "editor.selectionBackground": "#ffffff15",
                                "editorWidget.background": "#111113",
                                "editorSuggestWidget.background": "#111113",
                                "input.background": "#111113",
                                "dropdown.background": "#111113",
                            },
                        });
                    }}
                    options={{
                        fontSize: 14,
                        automaticLayout: true,
                        minimap: { enabled: false },
                        wordWrap: "on",
                        scrollBeyondLastLine: false,
                        padding: { top: 12 },
                    }}
                />
            </div>
        </div>
    );
}
export default Editor;
