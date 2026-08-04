"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Eye, Download, ArrowLeft, FolderKanban, Image, Sparkles } from "lucide-react";
import { Card, Badge, SectionHeader, Button, EmptyState, PageTransition } from "@/components/ui/primitives";

export default function ProjectDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { data: projectData, isLoading } = useQuery({
    queryKey: ["project", params.id],
    queryFn: () => api.getProject(params.id as string),
    enabled: !!user && !!params.id,
  });

  const project = projectData?.data as any;
  const generations = project?.generations ?? [];

  return (
    <PageTransition className="max-w-[1440px] mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/projects" className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800/50 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-neutral-500" />
              <span className="text-xs text-neutral-500">Loading...</span>
            </div>
          ) : project ? (
            <>
              <h1 className="text-xl font-bold tracking-tight text-neutral-100">{project.name}</h1>
              {project.description && <p className="text-xs text-neutral-500 mt-0.5">{project.description}</p>}
              <div className="flex items-center gap-2 mt-1.5">
                <Badge variant="outline">{generations.length} generations</Badge>
                <span className="text-[10px] text-neutral-600">Created {new Date(project.createdAt).toLocaleDateString()}</span>
              </div>
            </>
          ) : (
            <p className="text-sm text-neutral-500">Project not found</p>
          )}
        </div>
        {project && (
          <div className="ml-auto flex items-center gap-2">
            <Button variant="secondary" size="sm"><Download className="w-3 h-3" /> Export</Button>
            <Link href="/generate"><Button variant="primary" size="sm"><Sparkles className="w-3 h-3" /> Generate</Button></Link>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-xl bg-neutral-800/30 animate-pulse" />
          ))}
        </div>
      ) : project ? (
        generations.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {generations.map((gen: any, i: number) => (
              <motion.div
                key={gen.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.025, duration: 0.2 }}
                className="group relative overflow-hidden rounded-xl border border-neutral-800/30 bg-neutral-900/40 aspect-square hover:border-neutral-700/50 transition-all"
              >
                {gen.outputUrls?.[0] ? (
                  <>
                    <img src={gen.outputUrls[0]} alt={gen.prompt} className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                      <button onClick={() => setPreviewUrl(gen.outputUrls[0])} className="p-2 rounded-lg bg-neutral-900/80 text-neutral-200 hover:text-neutral-100 transition-colors"><Eye className="w-4 h-4" /></button>
                      <a href={gen.outputUrls[0]} download className="p-2 rounded-lg bg-neutral-900/80 text-neutral-200 hover:text-neutral-100 transition-colors"><Download className="w-4 h-4" /></a>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-2.5 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-[10px] text-neutral-300 truncate">{gen.prompt}</p>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-900/60 p-3">
                    <Badge variant={gen.status === "COMPLETED" ? "success" : gen.status === "FAILED" ? "danger" : "warning"}>{gen.status}</Badge>
                    <p className="text-[10px] text-neutral-600 text-center line-clamp-2 mt-1">{gen.prompt}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Image}
            title="No generations in this project"
            description="Add generations to organize your work"
            action={<Link href="/generate" className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-100 text-neutral-950 text-xs font-medium hover:bg-neutral-200 transition-all"><Sparkles className="w-3.5 h-3.5" /> Generate</Link>}
          />
        )
      ) : (
        <EmptyState icon={FolderKanban} title="Project not found" />
      )}

      {/* Preview Modal */}
      <AnimatePresence>
        {previewUrl && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPreviewUrl(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setPreviewUrl(null)} className="absolute -top-10 right-0 text-neutral-400 hover:text-neutral-100 text-xl">&times;</button>
              <div className="rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800 shadow-2xl">
                <img src={previewUrl} alt="" className="w-full h-auto max-h-[80vh] object-contain" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}
