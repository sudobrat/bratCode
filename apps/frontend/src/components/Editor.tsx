import type { FileTreeNode } from "@bratCode/zod";
import { AnimatePresence, motion } from "motion/react";
import { getFileIcon } from "../utils/customizeIcon";
import { Check, ChevronRight, Loader2, Save, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { updateFile } from "../features/file";
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
    setOpenTabs,
    tree,
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
}) {


    useEffect(() => {
        if(activeTab){
            setCode(activeTab?.content)
        }
    }, [activeTab])
    


    const [saving, setSaving] = useState(false);
    const [justSaved, setJustSaved] = useState(false);
    const [code, setCode] = useState("");

    const nodeMap = useMemo(() => flattenTree(tree), [tree]);

    const breadcrumbPath = useMemo(() => {
        if (!activeTab) return [];
        return buildPath(activeTab, nodeMap);
    }, [activeTab, nodeMap]);

    const handleCloseTab = (id: string) => {
        setOpenTabs((prevTabs) => {
            const newTabs = prevTabs.filter((tab) => tab._id !== id);
            setActiveTab((prevActive) => {
                if (prevActive?._id === id) {
                    return newTabs.length > 0 ? newTabs[newTabs.length - 1] : null;
                }
                return prevActive;
            });
            return newTabs;
        });
    };

    const save = async () => {
        if (!activeTab) return;
        try {
            setSaving(true);
            await updateFile(activeTab._id, {
                name: activeTab.name,
                content: code,
            });
            setActiveTab({ ...activeTab, content: code });

            setOpenTabs((tabs) =>
                tabs.map((tab) =>
                    tab._id === activeTab._id
                        ? { ...tab, content: code }
                        : tab,
                ),
            );
            setJustSaved(true);
            setSaving(false);
            setTimeout(() => setJustSaved(false), 1500);
        } catch (error) {
            setSaving(false);
            console.log(error);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                save();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeTab, code, openTabs]);


    return (
        <div className="flex flex-1 flex-col bg-[#0a0a0c]">
            <div className="flex h-10 shrink-0 items-center overflow-x-auto border-b border-white/6 bg-[#111113]/90">
                <AnimatePresence initial={false}>
                    {openTabs.map((tab) => {
                        const active = activeTab?._id == tab?._id;
                        const { icon: Icon, color } = getFileIcon(tab.name);

                        return (
                            <motion.div
                                key={tab._id}
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: "auto" }}
                                exit={{ opacity: 0, width: 0 }}
                                transition={{ duration: 0.15 }}
                                onClick={() => setActiveTab(tab)}
                                className={`group relative flex h-full cursor-pointer items-center gap-2 whitespace-nowrap border-r border-white/5 px-3.5 transition-colors ${
                                    active
                                        ? "bg-[#0a0a0c] text-white"
                                        : "text-zinc-500 hover:bg-white/2 hover:text-zinc-300"
                                }`}
                            >
                                <Icon size={14} className={color} />
                                <span className="text-[13px]">{tab?.name}</span>

                                <button
                                    className="rounded p-0.5 text-zinc-500 opacity-0 hover:bg-white/10 hover:text-white group-hover:opacity-100"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleCloseTab(tab._id);
                                    }}
                                >
                                    <X size={13} />
                                </button>

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
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={save}
                        disabled={saving}
                        title={
                            saving
                                ? "Saving…"
                                : justSaved
                                  ? "Saved!"
                                  : "Save file"
                        }
                        className={`ml-2 flex shrink-0 items-center justify-center rounded-md p-1.5 transition-colors ${
                            justSaved
                                ? "text-emerald-400"
                                : "text-zinc-500 hover:bg-white/8 hover:text-zinc-200"
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
                                        size={14}
                                        className="animate-spin"
                                    />
                                </motion.div>
                            ) : justSaved ? (
                                <motion.div
                                    key="saved"
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <Check size={14} />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="save"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <Save size={14} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.button>
                </div>
            )}

            <div className='min-h-0 flex-1'>
                <MonacoEditor
                    height="100%"
                    theme="bratCode-dark"
                    language={getMonacoLanguage(activeTab?.language)}
                    value={code}
                    onChange={(value) => setCode(value || "")}
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
