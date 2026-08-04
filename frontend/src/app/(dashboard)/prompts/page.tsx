"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import {
  Bookmark, Sparkles, Search, Plus, Copy, Check,
  Heart, Star, Clock, Trash2, Dices, Loader2,
} from "lucide-react";
import { Card, CardHeader, CardContent, Badge, SectionHeader, Button, EmptyState, PageTransition } from "@/components/ui/primitives";

const CATEGORIES = ["All", "Portrait", "Logo", "Landscape", "Product", "Abstract", "Illustration", "3D"];

export default function PromptsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["prompts", search, category],
    queryFn: () => api.getPrompts({
      search: search || undefined,
      category: category === "All" ? undefined : category,
    }),
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deletePrompt(id),
    onSuccess: () => {
      toast.success("Prompt deleted");
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const prompts: any[] = Array.isArray(data?.data) ? data!.data : [];
  const filtered = prompts.filter(
    (p) => !search || p.prompt.toLowerCase().includes(search.toLowerCase()),
  );

  const copyPrompt = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("Copied!");
  };

  return (
    <PageTransition className="max-w-[1440px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-100">Prompts</h1>
          <p className="text-xs text-neutral-500 mt-1">{prompts.length} saved prompts</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm"><Dices className="w-3 h-3" /> Random</Button>
          <Link href="/generate" className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-100 text-neutral-950 text-xs font-medium hover:bg-neutral-200 transition-all active:scale-[0.97]">
            <Sparkles className="w-3.5 h-3.5" /> Use Prompt
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500 pointer-events-none" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search prompts..." className="w-full bg-neutral-800/50 border border-neutral-700/30 rounded-xl pl-9 pr-3 py-2 text-xs text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-neutral-600 transition-all" />
        </div>
        <div className="flex items-center gap-1 bg-neutral-900/60 border border-neutral-800/30 rounded-xl p-0.5 flex-wrap">
          {CATEGORIES.slice(0, 5).map((c) => (
            <button key={c} onClick={() => setCategory(c)} className={cn("px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all", category === c ? "bg-neutral-800/70 text-neutral-100" : "text-neutral-500 hover:text-neutral-300")}>{c}</button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-5 h-5 text-neutral-500 animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((p: any, i: number) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.025 }}
              className="group flex items-start gap-3 p-3.5 rounded-xl border border-neutral-800/20 bg-neutral-900/30 hover:bg-neutral-800/40 hover:border-neutral-700/40 transition-all"
            >
              <div className="w-8 h-8 rounded-lg bg-neutral-800/60 border border-neutral-700/30 flex items-center justify-center shrink-0">
                <Bookmark className="w-3.5 h-3.5 text-neutral-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-neutral-300 leading-relaxed">{p.prompt}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge variant="outline">{p.category || "General"}</Badge>
                  <span className="text-[9px] text-neutral-600 flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> {timeAgo(p.createdAt)}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button onClick={() => copyPrompt(p.id, p.prompt)} className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 transition-colors">
                  {copiedId === p.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button className={cn("p-1.5 rounded-lg transition-colors", p.favorite ? "text-red-400" : "text-neutral-500 hover:text-red-400 hover:bg-neutral-800")}>
                  <Heart className="w-3.5 h-3.5" fill={p.favorite ? "currentColor" : "none"} />
                </button>
                <Link href={`/generate?prompt=${encodeURIComponent(p.prompt)}`} className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 transition-colors">
                  <Sparkles className="w-3.5 h-3.5" />
                </Link>
                <button onClick={() => deleteMutation.mutate(p.id)} className="p-1.5 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-neutral-800 transition-colors">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <EmptyState
          icon={Bookmark}
          title="No prompts found"
          description={search ? "Try a different search" : "Save your favorite prompts to reuse them later"}
        />
      )}
    </PageTransition>
  );
}

function timeAgo(date: string | Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}
