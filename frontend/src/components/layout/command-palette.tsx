"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, LayoutDashboard, Wand2, FolderKanban, CreditCard, Settings, Image, Video, Sparkles, Command } from "lucide-react";

const PAGES = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, section: "Navigation" },
  { href: "/generate", label: "Generate", icon: Sparkles, section: "Navigation" },
  { href: "/projects", label: "Projects", icon: FolderKanban, section: "Navigation" },
  { href: "/billing", label: "Billing", icon: CreditCard, section: "Navigation" },
  { href: "/settings", label: "Settings", icon: Settings, section: "Navigation" },
];

const ACTIONS = [
  { label: "New Image Generation", icon: Image, action: "navigate", href: "/generate" },
  { label: "New Video Generation", icon: Video, action: "navigate", href: "/generate" },
];

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const items = [...PAGES, ...ACTIONS].filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (open) { setQuery(""); setSelectedIndex(0); setTimeout(() => inputRef.current?.focus(), 50); }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleSelect = useCallback((item: (typeof items)[0]) => {
    if ("href" in item) {
      router.push(item.href);
      onClose();
    }
  }, [router, onClose]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex((i) => Math.min(i + 1, items.length - 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex((i) => Math.max(i - 1, 0)); }
      if (e.key === "Enter" && items[selectedIndex]) { handleSelect(items[selectedIndex]); }
      if (e.key === "Escape") { onClose(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, items, selectedIndex, handleSelect, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[15vh]"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -12 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="w-full max-w-lg bg-neutral-900 border border-neutral-700/60 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-800">
              <Search className="w-4 h-4 text-neutral-500 shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search pages and actions..."
                className="flex-1 bg-transparent text-sm text-neutral-100 placeholder:text-neutral-500 outline-none"
              />
              <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-neutral-800 text-[10px] font-medium text-neutral-500 border border-neutral-700">
                <Command className="w-2.5 h-2.5" />K
              </kbd>
            </div>
            <div className="max-h-72 overflow-y-auto p-2 space-y-0.5">
              {items.length === 0 && (
                <p className="text-sm text-neutral-500 text-center py-6">No results found</p>
              )}
              {items.map((item, i) => (
                <button
                  key={item.label}
                  onClick={() => handleSelect(item)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors text-left ${
                    i === selectedIndex ? "bg-neutral-800 text-neutral-100" : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50"
                  }`}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-4 px-4 py-2 border-t border-neutral-800 text-[10px] text-neutral-600">
              <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 rounded bg-neutral-800 border border-neutral-700">↑↓</kbd> Navigate</span>
              <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 rounded bg-neutral-800 border border-neutral-700">↵</kbd> Open</span>
              <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 rounded bg-neutral-800 border border-neutral-700">Esc</kbd> Close</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
