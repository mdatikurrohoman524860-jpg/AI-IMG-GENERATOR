"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Video, Search, Download, Heart, Eye, X, Trash2,
  Sparkles, Play, Clock, Film, Loader2, ArrowUpDown,
  Grid3X3, LayoutList, ChevronDown, Plus, FileVideo,
  CheckSquare, Square, ChevronLeft, ChevronRight, Music,
} from "lucide-react";
import { Card, Badge, SectionHeader, Button, EmptyState, PageTransition } from "@/components/ui/primitives";

const FILTERS = ["All", "Recent", "Completed", "Processing"];
const SORTS = ["Newest", "Oldest", "Longest", "Shortest"];

export default function VideosPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [showSort, setShowSort] = useState(false);
  const [sort, setSort] = useState("Newest");
  const [bulkMode, setBulkMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ["generations", "videos", filter, search, sort],
    queryFn: () => api.getGenerations({
      limit: 50,
      type: "video",
      status: filter === "All" ? undefined : filter.toLowerCase(),
      search: search || undefined,
    }),
    enabled: !!user,
  });

  const raw = data?.data as any;
  const generations: any[] = Array.isArray(raw) ? raw : (raw?.generations ?? []);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteGeneration(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["generations"] }),
  });

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const bulkDelete = useCallback(() => {
    if (!confirm(`Delete ${selected.size} items?`)) return;
    selected.forEach((id) => deleteMutation.mutate(id));
    setSelected(new Set());
    setBulkMode(false);
  }, [selected, deleteMutation]);

  const openLightbox = (index: number) => {
    setPreviewIndex(index);
    setPreviewUrl(generations[index]?.outputUrls?.[0] || generations[index]?.thumbnailUrl);
  };

  return (
    <PageTransition className="max-w-[1440px] mx-auto">
      {/* Hero */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-neutral-100">Videos</h1>
            {selected.size > 0 && (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="px-2 py-0.5 rounded-full bg-neutral-800 text-[10px] text-neutral-300">
                {selected.size} selected
              </motion.span>
            )}
          </div>
          <p className="text-xs text-neutral-500 mt-1">{generations.length} video{generations.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setBulkMode(!bulkMode); if (bulkMode) setSelected(new Set()); }}
            className={cn("flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all", bulkMode ? "bg-neutral-800/70 text-neutral-100 border border-neutral-700/50" : "bg-neutral-800/30 text-neutral-500 hover:text-neutral-300 border border-transparent")}
          >
            {bulkMode ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
            {bulkMode ? "Done" : "Select"}
          </button>
          <Link href="/generate" className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-100 text-neutral-950 text-xs font-medium hover:bg-neutral-200 transition-all active:scale-[0.97]">
            <Sparkles className="w-3.5 h-3.5" /> Generate Video
          </Link>
        </div>
      </div>

      {/* Bulk actions */}
      <AnimatePresence>
        {bulkMode && selected.size > 0 && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mb-4 overflow-hidden">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-neutral-800/40 border border-neutral-700/40">
              <span className="text-xs text-neutral-300">{selected.size} selected</span>
              <div className="w-px h-4 bg-neutral-700" />
              <button onClick={bulkDelete} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 text-[10px] font-medium hover:bg-rose-500/20 transition-colors">
                <Trash2 className="w-3 h-3" /> Delete
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500 pointer-events-none" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search videos..." className="w-full bg-neutral-800/50 border border-neutral-700/30 rounded-xl pl-9 pr-3 py-2 text-xs text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-neutral-600 transition-all" />
        </div>
        <div className="flex items-center gap-1 bg-neutral-900/60 border border-neutral-800/30 rounded-xl p-0.5">
          {FILTERS.map((f) => (
            <button key={f} onClick={() => { setFilter(f); setSearch(""); }} className={cn("px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all", filter === f ? "bg-neutral-800/70 text-neutral-100" : "text-neutral-500 hover:text-neutral-300")}>{f}</button>
          ))}
        </div>
        <div className="flex items-center gap-1 bg-neutral-900/60 border border-neutral-800/30 rounded-xl p-0.5">
          <button onClick={() => setView("grid")} className={cn("p-1.5 rounded-lg transition-colors", view === "grid" ? "bg-neutral-800/70 text-neutral-100" : "text-neutral-500 hover:text-neutral-300")}><Grid3X3 className="w-3.5 h-3.5" /></button>
          <button onClick={() => setView("list")} className={cn("p-1.5 rounded-lg transition-colors", view === "list" ? "bg-neutral-800/70 text-neutral-100" : "text-neutral-500 hover:text-neutral-300")}><LayoutList className="w-3.5 h-3.5" /></button>
        </div>
        <div className="relative">
          <button onClick={() => setShowSort(!showSort)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-800/30 border border-neutral-700/30 text-[10px] text-neutral-500 hover:text-neutral-300 transition-colors">
            <ArrowUpDown className="w-3 h-3" /> {sort}
          </button>
          {showSort && (
            <div className="absolute right-0 top-full mt-1 w-36 bg-neutral-900 border border-neutral-700/60 rounded-xl shadow-xl z-20 py-1">
              {SORTS.map((s) => (
                <button key={s} onClick={() => { setSort(s); setShowSort(false); }} className={cn("w-full text-left px-3 py-2 text-xs transition-colors", sort === s ? "text-neutral-100 bg-neutral-800/50" : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/30")}>{s}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[4/3] rounded-xl bg-neutral-800/30 animate-pulse" />
          ))}
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {generations.map((gen: any, i: number) => {
            const duration = gen.duration ? formatDuration(gen.duration) : "--:--";
            return (
              <motion.div
                key={gen.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.025, duration: 0.2 }}
                className={cn(
                  "group relative overflow-hidden rounded-xl border bg-neutral-900/40 aspect-[4/3] hover:border-neutral-700/50 transition-all",
                  bulkMode && selected.has(gen.id) ? "ring-2 ring-neutral-400 border-neutral-600" : "border-neutral-800/30"
                )}
              >
                {gen.outputUrls?.[0] || gen.thumbnailUrl ? (
                  <>
                    <img src={gen.thumbnailUrl || gen.outputUrls[0]} alt={gen.prompt} className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105" loading="lazy" />
                    {bulkMode ? (
                      <button onClick={() => toggleSelect(gen.id)} className={cn("absolute top-2 left-2 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors z-10", selected.has(gen.id) ? "bg-neutral-400 border-neutral-400" : "bg-black/40 border-neutral-500 hover:border-neutral-300")}>
                        {selected.has(gen.id) && <CheckSVG className="w-3 h-3 text-neutral-950" />}
                      </button>
                    ) : (
                      <>
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity group-hover:scale-110">
                            <Play className="w-5 h-5 text-neutral-100 ml-0.5" />
                          </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-2.5 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className="text-[8px]">{duration}</Badge>
                            <Badge variant="outline" className="text-[8px]">HD</Badge>
                          </div>
                        </div>
                        <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openLightbox(i)} className="p-1.5 rounded-lg bg-black/60 backdrop-blur-sm text-neutral-200 hover:text-neutral-100 transition-colors"><Eye className="w-3 h-3" /></button>
                          <a href={gen.outputUrls?.[0]} download className="p-1.5 rounded-lg bg-black/60 backdrop-blur-sm text-neutral-200 hover:text-neutral-100 transition-colors"><Download className="w-3 h-3" /></a>
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-neutral-900/60">
                    <Badge variant={gen.status === "COMPLETED" ? "success" : gen.status === "FAILED" ? "danger" : "warning"}>{gen.status || "PENDING"}</Badge>
                    <p className="text-[9px] text-neutral-600 text-center px-2 line-clamp-2">{gen.prompt}</p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* List view */
        <div className="space-y-1">
          {generations.map((gen: any, i: number) => {
            const duration = gen.duration ? formatDuration(gen.duration) : "--:--";
            return (
              <div key={gen.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-800/30 transition-colors">
                {bulkMode && (
                  <button onClick={() => toggleSelect(gen.id)} className={cn("w-4 h-4 rounded border-2 flex items-center justify-center shrink-0", selected.has(gen.id) ? "bg-neutral-400 border-neutral-400" : "border-neutral-600")}>
                    {selected.has(gen.id) && <CheckSVG className="w-2.5 h-2.5 text-neutral-950" />}
                  </button>
                )}
                <div className="w-12 h-9 rounded-lg bg-neutral-800/50 border border-neutral-700/30 overflow-hidden shrink-0 flex items-center justify-center">
                  {gen.thumbnailUrl ? <img src={gen.thumbnailUrl} alt="" className="w-full h-full object-cover" /> : <Film className="w-4 h-4 text-neutral-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-neutral-300 truncate">{gen.prompt || "Untitled video"}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-neutral-500">{duration}</span>
                    <Badge variant={gen.status === "COMPLETED" ? "success" : gen.status === "FAILED" ? "danger" : "warning"} className="text-[9px]">{gen.status}</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openLightbox(i)} className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/50 transition-colors"><Eye className="w-3.5 h-3.5" /></button>
                  <a href={gen.outputUrls?.[0]} download className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/50 transition-colors"><Download className="w-3.5 h-3.5" /></a>
                  <button onClick={() => deleteMutation.mutate(gen.id)} className="p-1.5 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-neutral-800/50 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && generations.length === 0 && (
        <EmptyState
          icon={Film}
          title="No videos yet"
          description="Generate your first AI video to see it here"
          action={<Link href="/generate" className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-100 text-neutral-950 text-xs font-medium hover:bg-neutral-200 transition-all"><Sparkles className="w-3.5 h-3.5" /> Generate Video</Link>}
        />
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {previewUrl && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center" onClick={() => setPreviewUrl(null)}>
            <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
              <button onClick={() => setPreviewUrl(null)} className="p-2 rounded-lg bg-black/40 backdrop-blur-sm text-neutral-300 hover:text-neutral-100"><X className="w-4 h-4" /></button>
              <span className="text-xs text-neutral-400 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-lg">{previewIndex + 1} / {generations.length}</span>
            </div>
            {generations.length > 1 && (
              <>
                <button onClick={(e) => { e.stopPropagation(); const n = (previewIndex - 1 + generations.length) % generations.length; setPreviewIndex(n); setPreviewUrl(generations[n]?.outputUrls?.[0] || generations[n]?.thumbnailUrl); }} className="absolute left-4 p-2 rounded-full bg-black/40 backdrop-blur-sm text-neutral-300 hover:text-neutral-100 z-10"><ChevronLeft className="w-5 h-5" /></button>
                <button onClick={(e) => { e.stopPropagation(); const n = (previewIndex + 1) % generations.length; setPreviewIndex(n); setPreviewUrl(generations[n]?.outputUrls?.[0] || generations[n]?.thumbnailUrl); }} className="absolute right-4 p-2 rounded-full bg-black/40 backdrop-blur-sm text-neutral-300 hover:text-neutral-100 z-10"><ChevronRight className="w-5 h-5" /></button>
              </>
            )}
            <motion.div initial={{ scale: 0.92 }} animate={{ scale: 1 }} className="relative max-w-5xl w-full max-h-[85vh] mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800 shadow-2xl">
                <img src={previewUrl} alt="" className="w-full h-auto max-h-[80vh] object-contain" />
              </div>
              <div className="mt-3 flex items-center justify-between text-[10px] text-neutral-500">
                <span className="truncate">{generations[previewIndex]?.prompt}</span>
                <span className="shrink-0 ml-2">{formatDuration(generations[previewIndex]?.duration)}</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}

function CheckSVG(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="20 6 9 17 4 12" /></svg>;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
