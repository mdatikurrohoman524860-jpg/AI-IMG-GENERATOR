"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Image, Search, Download, Heart, Eye, X, Trash2,
  Sparkles, SlidersHorizontal, Grid3X3, LayoutList,
  ChevronDown, Plus, Clock, ArrowUpDown, Loader2,
  CheckSquare, Square, Share2, ChevronLeft, ChevronRight,
  ZoomIn, ZoomOut, Maximize2,
} from "lucide-react";
import { Card, Badge, SectionHeader, Button, EmptyState, PageTransition } from "@/components/ui/primitives";

const FILTERS = ["All", "Images", "Logos", "Icons", "Illustrations", "Wallpapers"];
const SORTS = ["Newest", "Oldest", "Most liked", "Most downloaded"];

export default function ImagesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState("Newest");
  const [search, setSearch] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [bulkMode, setBulkMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showSort, setShowSort] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["generations", "images", filter, sort, search],
    queryFn: () => api.getGenerations({
      limit: 100,
      type: filter === "All" ? undefined : filter.toLowerCase(),
      search: search || undefined,
    }),
    enabled: !!user,
  });

  const raw = data?.data as any;
  const generations: any[] = Array.isArray(raw) ? raw : (raw?.generations ?? []);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteGeneration(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["generations"] }); },
  });

  const favoriteMutation = useMutation({
    mutationFn: (id: string) => api.toggleFavorite(id),
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

  const selectAll = () => {
    if (selected.size === generations.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(generations.map((g: any) => g.id)));
    }
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

  const masonryHeights = ["h-48", "h-56", "h-64", "h-52", "h-60", "h-44"];

  return (
    <PageTransition className="max-w-[1440px] mx-auto">
      {/* Hero */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-neutral-100">Images</h1>
            {selected.size > 0 && (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="px-2 py-0.5 rounded-full bg-neutral-800 text-[10px] text-neutral-300">
                {selected.size} selected
              </motion.span>
            )}
          </div>
          <p className="text-xs text-neutral-500 mt-1">{generations.length} total assets</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setBulkMode(!bulkMode); if (bulkMode) setSelected(new Set()); }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all",
              bulkMode ? "bg-neutral-800/70 text-neutral-100 border border-neutral-700/50" : "bg-neutral-800/30 text-neutral-500 hover:text-neutral-300 border border-transparent"
            )}
          >
            {bulkMode ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
            {bulkMode ? "Done" : "Select"}
          </button>
          <Link href="/generate" className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-100 text-neutral-950 text-xs font-medium hover:bg-neutral-200 transition-all active:scale-[0.97]">
            <Sparkles className="w-3.5 h-3.5" /> Generate
          </Link>
        </div>
      </div>

      {/* Bulk actions bar */}
      <AnimatePresence>
        {bulkMode && selected.size > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-4 overflow-hidden"
          >
            <div className="flex items-center gap-2 p-3 rounded-xl bg-neutral-800/40 border border-neutral-700/40">
              <span className="text-xs text-neutral-300">{selected.size} selected</span>
              <div className="w-px h-4 bg-neutral-700" />
              <button onClick={bulkDelete} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 text-[10px] font-medium hover:bg-rose-500/20 transition-colors">
                <Trash2 className="w-3 h-3" /> Delete
              </button>
              <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neutral-800/60 text-neutral-400 text-[10px] font-medium hover:text-neutral-200 transition-colors">
                <Download className="w-3 h-3" /> Download
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search images..."
            className="w-full bg-neutral-800/50 border border-neutral-700/30 rounded-xl pl-9 pr-3 py-2 text-xs text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-neutral-600 transition-all"
          />
        </div>
        <div className="flex items-center gap-1 bg-neutral-900/60 border border-neutral-800/30 rounded-xl p-0.5">
          {FILTERS.slice(0, 4).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={cn("px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all", filter === f ? "bg-neutral-800/70 text-neutral-100" : "text-neutral-500 hover:text-neutral-300")}>{f}</button>
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

      {/* Gallery */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className={cn("rounded-xl bg-neutral-800/30 animate-pulse", masonryHeights[i % masonryHeights.length])} />
          ))}
        </div>
      ) : view === "grid" ? (
        <div className="columns-2 sm:columns-3 md:columns-4 xl:columns-5 gap-3 [&>*]:break-inside-avoid">
          {generations.map((gen: any, i: number) => (
            <motion.div
              key={gen.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.015, duration: 0.2 }}
              className={cn(
                "group relative overflow-hidden rounded-xl border border-neutral-800/30 bg-neutral-900/40 mb-3 hover:border-neutral-700/50 transition-all",
                bulkMode && selected.has(gen.id) && "ring-2 ring-neutral-400"
              )}
            >
              {gen.outputUrls?.[0] || gen.thumbnailUrl ? (
                <>
                  <img
                    src={gen.thumbnailUrl || gen.outputUrls[0]}
                    alt={gen.prompt}
                    className="w-full h-auto object-cover transition-all duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  {bulkMode ? (
                    <button
                      onClick={() => toggleSelect(gen.id)}
                      className={cn(
                        "absolute top-2 left-2 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors z-10",
                        selected.has(gen.id) ? "bg-neutral-400 border-neutral-400" : "bg-black/40 border-neutral-500 hover:border-neutral-300"
                      )}
                    >
                      {selected.has(gen.id) && <Check className="w-3 h-3 text-neutral-950" />}
                    </button>
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300" />
                      <div className="absolute bottom-0 left-0 right-0 p-2 translate-y-2 group-hover:translate-y-0 transition-transform duration-200">
                        <p className="text-[9px] text-neutral-300 truncate">{gen.prompt}</p>
                      </div>
                      <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openLightbox(i)} className="p-1.5 rounded-lg bg-black/60 backdrop-blur-sm text-neutral-200 hover:text-neutral-100 transition-colors"><Eye className="w-3 h-3" /></button>
                        <a href={gen.outputUrls[0]} download className="p-1.5 rounded-lg bg-black/60 backdrop-blur-sm text-neutral-200 hover:text-neutral-100 transition-colors"><Download className="w-3 h-3" /></a>
                      </div>
                      <div className="absolute top-1.5 left-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); favoriteMutation.mutate(gen.id); }} className={cn("p-1.5 rounded-lg bg-black/60 backdrop-blur-sm transition-colors", gen.favorite ? "text-red-400" : "text-neutral-200 hover:text-red-400")}>
                          <Heart className="w-3 h-3" fill={gen.favorite ? "currentColor" : "none"} />
                        </button>
                      </div>
                      <div className="absolute bottom-1.5 left-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Badge variant="outline" className="text-[8px]">{gen.type}</Badge>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-32 flex items-center justify-center bg-neutral-900/60">
                  <Badge variant={gen.status === "COMPLETED" ? "success" : "danger"}>{gen.status}</Badge>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      ) : (
        /* List view */
        <div className="space-y-1">
          {generations.map((gen: any) => (
            <div key={gen.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-800/30 transition-colors">
              {bulkMode && (
                <button onClick={() => toggleSelect(gen.id)} className={cn("w-4 h-4 rounded border-2 flex items-center justify-center shrink-0", selected.has(gen.id) ? "bg-neutral-400 border-neutral-400" : "border-neutral-600")}>
                  {selected.has(gen.id) && <Check className="w-2.5 h-2.5 text-neutral-950" />}
                </button>
              )}
              <div className="w-10 h-10 rounded-lg bg-neutral-800/50 border border-neutral-700/30 overflow-hidden shrink-0">
                {gen.outputUrls?.[0] ? <img src={gen.outputUrls[0]} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-neutral-800" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-neutral-300 truncate">{gen.prompt}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline">{gen.type}</Badge>
                  <span className="text-[9px] text-neutral-600">{new Date(gen.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => openLightbox(generations.indexOf(gen))} className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/50 transition-colors"><Eye className="w-3.5 h-3.5" /></button>
                <a href={gen.outputUrls?.[0]} download className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/50 transition-colors"><Download className="w-3.5 h-3.5" /></a>
                <button onClick={() => deleteMutation.mutate(gen.id)} className="p-1.5 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-neutral-800/50 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && generations.length === 0 && (
        <EmptyState
          icon={Image}
          title="No images yet"
          description="Generate your first image to see it here"
          action={<Link href="/generate" className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-100 text-neutral-950 text-xs font-medium hover:bg-neutral-200 transition-all"><Sparkles className="w-3.5 h-3.5" /> Generate</Link>}
        />
      )}

      {/* Lightbox Gallery */}
      <AnimatePresence>
        {previewUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center"
            onClick={() => setPreviewUrl(null)}
          >
            <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
              <button onClick={() => setPreviewUrl(null)} className="p-2 rounded-lg bg-black/40 backdrop-blur-sm text-neutral-300 hover:text-neutral-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
              <span className="text-xs text-neutral-400 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                {previewIndex + 1} / {generations.length}
              </span>
            </div>
            <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
              <a href={previewUrl} download className="p-2 rounded-lg bg-black/40 backdrop-blur-sm text-neutral-300 hover:text-neutral-100 transition-colors">
                <Download className="w-4 h-4" />
              </a>
            </div>

            {generations.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); const next = (previewIndex - 1 + generations.length) % generations.length; setPreviewIndex(next); setPreviewUrl(generations[next]?.outputUrls?.[0] || generations[next]?.thumbnailUrl); }}
                  className="absolute left-4 p-2 rounded-full bg-black/40 backdrop-blur-sm text-neutral-300 hover:text-neutral-100 transition-colors z-10"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); const next = (previewIndex + 1) % generations.length; setPreviewIndex(next); setPreviewUrl(generations[next]?.outputUrls?.[0] || generations[next]?.thumbnailUrl); }}
                  className="absolute right-4 p-2 rounded-full bg-black/40 backdrop-blur-sm text-neutral-300 hover:text-neutral-100 transition-colors z-10"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="relative max-w-5xl w-full max-h-[85vh] mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800 shadow-2xl">
                <img src={previewUrl} alt="" className="w-full h-auto max-h-[80vh] object-contain" />
              </div>
              <div className="mt-3 flex items-center justify-between text-[10px] text-neutral-500">
                <span>{generations[previewIndex]?.prompt}</span>
                <span>{generations[previewIndex]?.type} · {new Date(generations[previewIndex]?.createdAt).toLocaleDateString()}</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}

function Check(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
