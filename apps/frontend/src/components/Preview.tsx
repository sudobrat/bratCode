import type { FileTreeNode } from "@bratCode/zod";
import { useEffect, useState } from "react";
import { RefreshCw, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { getFile } from "../features/file";

function Preview({ tree }: { tree: FileTreeNode[] }) {
    const [refreshKey, setRefreshKey] = useState(0);

    const [srcDoc, setSrcDoc] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        
        const buildPreview = async () => {
            setLoading(true);
            let html = "";
            let css = "";
            let js = "";

            const fetchPromises: Promise<void>[] = [];

            const processNode = async (item: FileTreeNode) => {
                if (item.type === "file") {
                    const isHtml = item.name === "index.html";
                    const isCss = item.name.endsWith(".css");
                    const isJs = item.name.endsWith(".js") || item.name.endsWith(".jsx");
                    
                    if (isHtml || isCss || isJs) {
                        let content = item.content;
                        if (!content) {
                            const fetched = await getFile(item._id);
                            if (fetched) content = fetched.content;
                        }
                        
                        if (content) {
                            if (isHtml) html = content;
                            if (isCss) css += "\n" + content;
                            if (isJs) js += "\n" + content;
                        }
                    }
                }
            };

            const walk = (nodes: FileTreeNode[]) => {
                for (const item of nodes) {
                    fetchPromises.push(processNode(item));
                    if (item.children?.length) {
                        walk(item.children);
                    }
                }
            };

            walk(tree);
            await Promise.all(fetchPromises);

            if (!isMounted) return;

            if (!html) {
                setSrcDoc(`
        <!DOCTYPE html>
        <html>
          <body style="
            margin:0;
            background:#0a0a0c;
            color:#999;
            font-family:Arial,sans-serif;
            display:flex;
            align-items:center;
            justify-content:center;
            height:100vh;
          ">
            <div style="text-align:center;">
              <h3 style="margin:0 0 6px;">No index.html found</h3>
              <p style="margin:0;font-size:13px;color:#666;">Create an HTML project to see the preview</p>
            </div>
          </body>
        </html>
      `);
                setLoading(false);
                return;
            }

            if (css) {
                html = html.includes("</head>")
                    ? html.replace("</head>", `<style>${css}</style></head>`)
                    : `<style>${css}</style>${html}`;
            }

            if (js) {
                const script = `<script type="module">\n${js}\n</script>`;
                html = html.includes("</body>") ? html.replace("</body>", `${script}</body>`) : html + script;
            }

            setSrcDoc(html);
            setLoading(false);
        };

        buildPreview();

        return () => {
            isMounted = false;
        };
    }, [tree, refreshKey]);

    return (
        <div className="flex h-full w-full flex-col bg-white">
            <div className="flex h-10 shrink-0 items-center justify-between bg-[#111113] px-4 border-b border-white/6">
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-400" />
                    <span className="text-xs text-zinc-300">Preview</span>
                </div>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setRefreshKey((k) => k + 1)}
                    className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
                    title="Reload Preview"
                >
                    <RefreshCw size={12} />
                    <span className="hidden sm:inline text-[11px]">Reload</span>
                </motion.button>
            </div>

            <div className="relative min-h-0 flex-1 bg-white">
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-[2px] z-10">
                        <Loader2 className="animate-spin text-zinc-400" size={24} />
                    </div>
                )}
                <iframe
                    key={refreshKey}
                    title="Project Preview"
                    srcDoc={srcDoc}
                    sandbox="allow-scripts allow-forms allow-modals"
                    className="h-full w-full border-0"
                />
            </div>
        </div>
    );
}
export default Preview;
