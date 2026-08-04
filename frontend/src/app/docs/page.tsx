"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Code, Image, Video, CreditCard, Rocket, Sparkles } from "lucide-react";

const ICON_MAP: Record<string, any> = { Rocket, Image, Video, Code, BookOpen, CreditCard };

const featured = [
  { title: "Quick Start", desc: "Create your first AI generation in 5 minutes", slug: "/docs/quick-start", icon: Rocket },
  { title: "Image Generation", desc: "Master AI image creation with DALL·E 3, SDXL, and more", slug: "/docs/image-generation/overview", icon: Image },
  { title: "API Reference", desc: "Integrate AI generation into your applications", slug: "/docs/api-reference/generation", icon: Code },
  { title: "Prompt Engineering", desc: "Write better prompts for stunning results", slug: "/docs/guides/prompt-engineering", icon: BookOpen },
];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

export default function DocsHomePage() {
  const { data: catsData } = useQuery({ queryKey: ["doc-categories"], queryFn: () => api.getDocCategories() });
  const { data: pagesData } = useQuery({ queryKey: ["doc-pages"], queryFn: () => api.getDocPages() });

  const categories: any[] = Array.isArray(catsData?.data) ? catsData!.data : [];
  const pages: any[] = Array.isArray(pagesData?.data) ? pagesData!.data : [];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-10">
      {/* Hero */}
      <motion.div variants={item}>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-100 mb-2">
          Welcome to the <span className="text-transparent bg-clip-text bg-gradient-to-r from-neutral-100 to-neutral-400">Intellix</span> Documentation
        </h1>
        <p className="text-sm text-neutral-500 max-w-xl">
          Everything you need to build with Intellix — from getting started to advanced API integration.
        </p>
      </motion.div>

      {/* Quick Links */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {featured.map((f) => (
          <Link key={f.title} href={f.slug} className="group p-4 rounded-xl border border-neutral-800/30 bg-neutral-900/40 hover:bg-neutral-800/40 hover:border-neutral-700/50 transition-all">
            <div className="w-8 h-8 rounded-lg bg-neutral-800/60 border border-neutral-700/30 flex items-center justify-center mb-3 group-hover:border-neutral-600/50">
              <f.icon className="w-4 h-4 text-neutral-400 group-hover:text-neutral-300" />
            </div>
            <p className="text-sm font-medium text-neutral-200 group-hover:text-neutral-100 mb-1">{f.title}</p>
            <p className="text-xs text-neutral-600">{f.desc}</p>
          </Link>
        ))}
      </motion.div>

      {/* Categories */}
      <motion.div variants={item} className="space-y-4">
        <h2 className="text-sm font-semibold text-neutral-200">All Topics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {categories.map((cat: any) => {
            const CatIcon = ICON_MAP[cat.icon || ""] || BookOpen;
            const catPages = pages.filter((p: any) => p.categoryId === cat.id);
            return (
              <Link key={cat.id} href={`/docs/${catPages[0]?.slug || "#"}`} className="flex items-center gap-3 p-3 rounded-xl border border-neutral-800/20 hover:bg-neutral-800/30 hover:border-neutral-700/40 transition-all group">
                <div className="w-8 h-8 rounded-lg bg-neutral-800/50 border border-neutral-700/30 flex items-center justify-center shrink-0">
                  <CatIcon className="w-4 h-4 text-neutral-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-neutral-300 group-hover:text-neutral-100">{cat.title}</p>
                  <p className="text-[10px] text-neutral-600 truncate">{cat.description}</p>
                </div>
                <span className="text-[9px] text-neutral-600 shrink-0">{catPages.length} pages</span>
              </Link>
            );
          })}
        </div>
      </motion.div>

      {/* All Pages */}
      <motion.div variants={item} className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-200">All Pages</h2>
        <div className="space-y-1">
          {pages.map((p: any) => (
            <Link key={p.id} href={`/docs/${p.slug}`} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/30 transition-all group">
              <ArrowRight className="w-3 h-3 text-neutral-600 group-hover:text-neutral-400" />
              <span>{p.title}</span>
              {p.category && <span className="text-[9px] text-neutral-700 ml-auto">{p.category.title}</span>}
            </Link>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
