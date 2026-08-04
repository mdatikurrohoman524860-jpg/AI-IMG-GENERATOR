"use client";

import { useState, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  FolderKanban, Plus, MoreHorizontal, Archive, Trash2, Loader2,
  Search, Grid3X3, LayoutList, Columns3, Star, Clock,
  Tag, ArrowUpDown, FolderOpen, Sparkles, Image,
  GripVertical, CalendarDays, ChevronRight, Eye, Share2,
  Palette, Timer,
} from "lucide-react";
import { Card, Badge, SectionHeader, Button, EmptyState, PageTransition, Divider } from "@/components/ui/primitives";

const VIEWS = ["grid", "list", "kanban", "timeline"] as const;
const SORTS = ["Newest", "Oldest", "A-Z", "Most generations"];

const COVER_GRADIENTS = [
  "from-violet-500/10 via-transparent to-fuchsia-500/10",
  "from-blue-500/10 via-transparent to-cyan-500/10",
  "from-emerald-500/10 via-transparent to-teal-500/10",
  "from-amber-500/10 via-transparent to-orange-500/10",
  "from-rose-500/10 via-transparent to-pink-500/10",
  "from-indigo-500/10 via-transparent to-purple-500/10",
  "from-neutral-500/10 via-transparent to-stone-500/10",
  "from-red-500/10 via-transparent to-yellow-500/10",
];
const KANBAN_COLUMNS = ["Active", "Archived", "Completed"] as const;

export default function ProjectsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [view, setView] = useState<"grid" | "list" | "kanban" | "timeline">("grid");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("Newest");
  const [showSort, setShowSort] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [dragCol, setDragCol] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["projects", search, sort],
    queryFn: () => api.getProjects(),
    enabled: !!user,
  });

  const projects = (data?.data as any[]) ?? [];

  const createMutation = useMutation({
    mutationFn: (d: { name: string; description?: string }) => api.createProject(d),
    onSuccess: () => {
      toast.success("Project created");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setShowCreate(false);
      setNewName("");
      setNewDesc("");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteProject(id),
    onSuccess: () => { toast.success("Deleted"); queryClient.invalidateQueries({ queryKey: ["projects"] }); },
    onError: (error: Error) => toast.error(error.message),
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => api.updateProject(id, { archived: true }),
    onSuccess: () => { toast.success("Archived"); queryClient.invalidateQueries({ queryKey: ["projects"] }); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data: d }: { id: string; data: any }) => api.updateProject(id, d),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
  });

  const filtered = projects.filter((p: any) =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a: any, b: any) => {
    if (sort === "Newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sort === "Oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (sort === "A-Z") return a.name?.localeCompare(b.name);
    const cA = a._count?.generations ?? a.generations?.length ?? 0;
    const cB = b._count?.generations ?? b.generations?.length ?? 0;
    return cB - cA;
  });

  const getCoverGradient = (id: string) =>
    COVER_GRADIENTS[id.charCodeAt(id.length - 1) % COVER_GRADIENTS.length];

  const getCoverColor = (id: string) => {
    const colors = ["#1e1e2a", "#1a1a2e", "#16213e", "#1f1f2e", "#2a1a2e", "#1e2a1e", "#2a2a1e", "#1e2a2a"];
    return colors[id.charCodeAt(id.length - 1) % colors.length];
  };

  const genCount = (p: any) => p._count?.generations ?? p.generations?.length ?? 0;

  /* Drag-and-drop handlers */
  const handleDragStart = (e: React.DragEvent, id: string, col: string) => {
    e.dataTransfer.setData("text/plain", JSON.stringify({ id, col }));
    setDragCol(col);
  };
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (e: React.DragEvent, targetCol: string) => {
    e.preventDefault();
    setDragCol(null);
    try {
      const { id, col } = JSON.parse(e.dataTransfer.getData("text/plain"));
      if (col === targetCol) return;
      if (targetCol === "Archived") {
        archiveMutation.mutate(id);
      } else if (col === "Archived" && targetCol === "Active") {
        updateMutation.mutate({ id, data: { archived: false } });
      }
    } catch {}
  };

  return (
    <PageTransition className="max-w-[1440px] mx-auto">
      {/* Hero */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-100">Projects</h1>
          <p className="text-xs text-neutral-500 mt-1">{projects.length} project{projects.length !== 1 ? "s" : ""} total</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-100 text-neutral-950 text-xs font-medium hover:bg-neutral-200 transition-all active:scale-[0.97]">
          <Plus className="w-3.5 h-3.5" /> New Project
        </button>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500 pointer-events-none" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search projects..." className="w-full bg-neutral-800/50 border border-neutral-700/30 rounded-xl pl-9 pr-3 py-2 text-xs text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-neutral-600 transition-all" />
        </div>
        <div className="flex items-center gap-1 bg-neutral-900/60 border border-neutral-800/30 rounded-xl p-0.5">
          {VIEWS.map((v) => (
            <button key={v} onClick={() => setView(v)} className={cn("p-1.5 rounded-lg transition-colors", view === v ? "bg-neutral-800/70 text-neutral-100" : "text-neutral-500 hover:text-neutral-300")}>
              {v === "grid" ? <Grid3X3 className="w-3.5 h-3.5" /> : v === "list" ? <LayoutList className="w-3.5 h-3.5" /> : v === "kanban" ? <Columns3 className="w-3.5 h-3.5" /> : <CalendarDays className="w-3.5 h-3.5" />}
            </button>
          ))}
        </div>
        <div className="relative">
          <button onClick={() => setShowSort(!showSort)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-800/30 border border-neutral-700/30 text-[10px] text-neutral-500 hover:text-neutral-300 transition-colors">
            <ArrowUpDown className="w-3 h-3" /> {sort}
          </button>
          {showSort && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-neutral-900 border border-neutral-700/60 rounded-xl shadow-xl z-20 py-1">
              {SORTS.map((s) => (
                <button key={s} onClick={() => { setSort(s); setShowSort(false); }} className={cn("w-full text-left px-3 py-2 text-xs transition-colors", sort === s ? "text-neutral-100 bg-neutral-800/50" : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/30")}>{s}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mb-5 p-5 rounded-2xl border border-neutral-700/50 bg-neutral-800/30">
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Project name" className="w-full bg-neutral-800/60 border border-neutral-700/40 rounded-xl px-3.5 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-neutral-600 mb-2.5" />
            <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Description (optional)" className="w-full bg-neutral-800/60 border border-neutral-700/40 rounded-xl px-3.5 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-neutral-600 mb-3" />
            <div className="flex items-center gap-2.5">
              <button onClick={() => createMutation.mutate({ name: newName, description: newDesc })} disabled={!newName.trim() || createMutation.isPending} className="px-4 py-2 rounded-xl bg-neutral-100 text-neutral-950 text-xs font-medium hover:bg-neutral-200 transition-colors disabled:opacity-50 flex items-center gap-1.5">
                {createMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />} Create
              </button>
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-xs text-neutral-500 hover:text-neutral-300 transition-colors">Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      {isLoading ? (
        <div className={cn("gap-4", view === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : view === "list" ? "space-y-2" : view === "timeline" ? "space-y-3 max-w-2xl" : "grid grid-cols-1 md:grid-cols-3")}>
          {Array.from({ length: view === "timeline" ? 4 : 6 }).map((_, i) => (
            <div key={i} className={cn("rounded-2xl bg-neutral-800/30 animate-pulse", view === "list" ? "h-14" : "h-36")} />
          ))}
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((project: any, i: number) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.025, duration: 0.2 }}
              className="group relative overflow-hidden rounded-2xl border border-neutral-800/30 bg-neutral-900/40 hover:border-neutral-700/50 transition-all"
            >
              {/* Cover */}
              <Link href={`/projects/${project.id}`}>
                <div className={cn("h-24 bg-gradient-to-br flex items-center justify-center transition-all", getCoverGradient(project.id))} style={{ backgroundColor: getCoverColor(project.id) }}>
                  <FolderKanban className="w-7 h-7 text-neutral-500/40" />
                </div>
              </Link>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <Link href={`/projects/${project.id}`} className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-neutral-200 hover:text-neutral-100 transition-colors truncate">{project.name}</h3>
                  </Link>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button onClick={() => archiveMutation.mutate(project.id)} className="p-1 rounded-lg text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 transition-colors"><Archive className="w-3 h-3" /></button>
                    <button onClick={() => deleteMutation.mutate(project.id)} className="p-1 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-neutral-800 transition-colors"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
                {project.description && <p className="text-[11px] text-neutral-500 mb-3 line-clamp-2 leading-relaxed">{project.description}</p>}
                <div className="flex items-center justify-between text-[10px] text-neutral-500 pt-3 border-t border-neutral-800/20">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1"><Image className="w-3 h-3" /> {genCount(project)}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(project.updatedAt).toLocaleDateString()}</span>
                  </div>
                  <ChevronRight className="w-3 h-3 text-neutral-600 group-hover:text-neutral-400 transition-colors" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : view === "list" ? (
        <div className="space-y-1">
          {sorted.map((project: any) => (
            <div key={project.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-800/30 transition-colors group">
              <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br shrink-0 flex items-center justify-center", getCoverGradient(project.id))} style={{ backgroundColor: getCoverColor(project.id) }}>
                <FolderKanban className="w-4 h-4 text-neutral-500/60" />
              </div>
              <Link href={`/projects/${project.id}`} className="flex-1 min-w-0">
                <p className="text-xs font-medium text-neutral-300 hover:text-neutral-100 transition-colors">{project.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-neutral-600">{genCount(project)} generations</span>
                  <span className="text-[10px] text-neutral-600">·</span>
                  <span className="text-[10px] text-neutral-600">{new Date(project.updatedAt).toLocaleDateString()}</span>
                  {project.archived && <Badge variant="outline" className="text-[8px]">Archived</Badge>}
                </div>
              </Link>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => archiveMutation.mutate(project.id)} className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 transition-colors"><Archive className="w-3 h-3" /></button>
                <button onClick={() => deleteMutation.mutate(project.id)} className="p-1.5 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-neutral-800 transition-colors"><Trash2 className="w-3 h-3" /></button>
              </div>
            </div>
          ))}
        </div>
      ) : view === "timeline" ? (
        <div className="max-w-2xl">
          {sorted.length > 0 && (
            <div className="relative pl-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-gradient-to-b before:from-neutral-700/40 before:to-neutral-800/10">
              {sorted.map((project: any, i: number) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.25 }}
                  className="relative pb-6 last:pb-0"
                >
                  <div className="absolute left-[-20px] top-1.5 w-[18px] h-[18px] rounded-full border-2 border-neutral-700 bg-neutral-900 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-neutral-600" />
                  </div>
                  <div className="p-4 rounded-xl border border-neutral-800/30 bg-neutral-900/40 hover:bg-neutral-800/40 transition-colors group">
                    <div className="flex items-start justify-between">
                      <Link href={`/projects/${project.id}`} className="flex-1 min-w-0">
                        <h3 className="text-xs font-semibold text-neutral-300 hover:text-neutral-100 transition-colors">{project.name}</h3>
                      </Link>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => archiveMutation.mutate(project.id)} className="p-1 rounded text-neutral-500 hover:text-neutral-300"><Archive className="w-3 h-3" /></button>
                        <button onClick={() => deleteMutation.mutate(project.id)} className="p-1 rounded text-neutral-500 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    </div>
                    {project.description && <p className="text-[10px] text-neutral-500 mt-1 line-clamp-1">{project.description}</p>}
                    <div className="flex items-center gap-3 mt-2 text-[9px] text-neutral-600">
                      <span className="flex items-center gap-1"><Image className="w-2.5 h-2.5" />{genCount(project)} gen</span>
                      <span className="flex items-center gap-1"><CalendarDays className="w-2.5 h-2.5" />{new Date(project.createdAt).toLocaleDateString()}</span>
                      {project.archived && <Badge variant="outline" className="text-[7px]">Archived</Badge>}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Kanban with drag-and-drop */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {KANBAN_COLUMNS.map((status) => {
            const items = status === "Active" ? sorted.filter((p: any) => !p.archived) :
              status === "Archived" ? sorted.filter((p: any) => p.archived) :
              sorted.filter((p: any) => !p.archived).slice(0, 4);
            return (
              <div
                key={status}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, status)}
                className={cn("rounded-2xl border border-dashed p-3 transition-colors", dragCol === status ? "border-neutral-500/50 bg-neutral-800/20" : "border-neutral-800/20 bg-neutral-900/20")}
              >
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className={cn("w-2 h-2 rounded-full", status === "Active" ? "bg-emerald-500/60" : status === "Archived" ? "bg-neutral-600" : "bg-blue-500/60")} />
                  <span className="text-xs font-medium text-neutral-400">{status}</span>
                  <span className="text-[10px] text-neutral-600 ml-auto">{items.length}</span>
                </div>
                <div className="space-y-2 min-h-[120px]">
                  {items.map((project: any) => (
                    <div
                      key={project.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, project.id, status)}
                      className={cn(
                        "p-3 rounded-xl border transition-all cursor-grab active:cursor-grabbing",
                        dragCol ? "border-neutral-700/30 bg-neutral-800/40" : "border-neutral-800/30 bg-neutral-900/40 hover:bg-neutral-800/50"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <GripVertical className="w-3 h-3 text-neutral-600 shrink-0" />
                        <FolderKanban className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                        <Link href={`/projects/${project.id}`} className="text-xs font-medium text-neutral-300 hover:text-neutral-100 truncate">{project.name}</Link>
                      </div>
                      <p className="text-[10px] text-neutral-600 flex items-center gap-2 ml-7">
                        <span className="flex items-center gap-1"><Image className="w-2.5 h-2.5" />{genCount(project)}</span>
                        <Timer className="w-2.5 h-2.5" />{new Date(project.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                  {items.length === 0 && (
                    <div className="text-[10px] text-neutral-600 text-center py-6">Drop projects here</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && sorted.length === 0 && (
        <EmptyState
          icon={FolderOpen}
          title={search ? "No matching projects" : "No projects yet"}
          description={search ? "Try a different search" : "Create your first project to organize generations"}
          action={!search ? <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-100 text-neutral-950 text-xs font-medium hover:bg-neutral-200 transition-all"><Plus className="w-3.5 h-3.5" /> Create Project</button> : undefined}
        />
      )}
    </PageTransition>
  );
}
