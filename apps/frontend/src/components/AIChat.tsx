import { ArrowUp, Send, Sparkles } from "lucide-react";
import { useState } from "react";
import { motion } from "motion/react";

function AIChat({ projectId, onClose }: { projectId: string; onClose: () => void }) {
    const [messages, setMessages] = useState([]);

    return (
        <div className="flex w-80 shrink-0 flex-col border-l border-white/6 bg-[#111113]/90 backdrop-blur-xl">
            <div className="flex h-10 shrink-0 items-center gap-2 border-b border-white/6 px-3">
                <span className="text-xs font-semibold tracking-wider text-zinc-300">bratCode AI Chat</span>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-3">
                {messages.length == 0 && (
                    <div className="mt-10 text-center">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/6 bg-white/2">
                            <Sparkles size={22} className="text-zinc-600" />
                        </div>
                        <p className="text-sm font-medium text-zinc-400">What do you want to build?</p>
                        <p className="mt-1.5 text-xs text-zinc-600">Ask me to create or modify files.</p>
                    </div>
                )}
            </div>

            <div className="border-t border-white/6 p-3">
                <div className="flex items-end gap-2 rounded-lg border border-white/8 bg-white/3 p-2 transition-colors focus-within:border-sky-400/40">
                    <textarea
                        placeholder="Ask AI to build something..."
                        rows={2}
                        className="flex-1 resize-none bg-transparent text-[13px] text-zinc-200 outline-none placeholder:text-zinc-600"
                    />
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/10 bg-zinc-800 text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white cursor-pointer">
                        <ArrowUp size={14} strokeWidth={2.5} />
                    </motion.button>
                </div>
            </div>
        </div>
    );
}
export default AIChat;
