"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { notFound, usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Calendar, User, Tag, Clock, Loader2, Link as LinkIcon, Bookmark, Share2, MessageCircle, FileText } from "lucide-react";
import { Badge } from "@/components/ui/primitives";
import { MarkdownRenderer } from "@/components/docs/markdown";

export default function DocPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const pathname = usePathname();
  const [readingProgress, setReadingProgress] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["doc-page", slug],
    queryFn: () => api.getDocPage(slug),
  });

  const { data: allPagesData } = useQuery({
    queryKey: ["doc-pages"],
    queryFn: () => api.getDocPages(),
  });

  const pages: any[] = Array.isArray(allPagesData?.data) ? allPagesData!.data : [];
  const page = data?.data as any;

  const currentIndex = page ? pages.indexOf(pages.find((p: any) => p.slug === slug)) : -1;
  const prevPage = currentIndex > 0 ? pages[currentIndex - 1] : null;
  const nextPage = currentIndex >= 0 && currentIndex < pages.length - 1 ? pages[currentIndex + 1] : null;

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setReadingProgress(docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-5 h-5 text-neutral-500 animate-spin" />
          <p className="text-xs text-neutral-600">Loading documentation...</p>
        </div>
      </div>
    );
  }

  if (!page) return notFound();

  return (
    <>
      {/* Reading Progress Bar */}
      <div className="fixed top-14 left-0 right-0 z-20 h-0.5 bg-neutral-800/50">
        <motion.div
          className="h-full bg-neutral-500/40"
          style={{ width: `${readingProgress}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-[10px] text-neutral-600 mb-4 flex-wrap">
          <Link href="/docs" className="hover:text-neutral-400 transition-colors">Docs</Link>
          {page.category && (
            <><span className="text-neutral-700">/</span><Link href={`/docs?category=${page.category.slug}`} className="hover:text-neutral-400 transition-colors">{page.category.title}</Link></>
          )}
          <span className="text-neutral-700">/</span>
          <span className="text-neutral-400 truncate max-w-[200px]">{page.title}</span>
        </nav>

        {/* Title */}
        <h1 className="text-2xl font-bold tracking-tight text-neutral-100 mb-2">{page.title}</h1>
        {page.excerpt && <p className="text-sm text-neutral-500 mb-6">{page.excerpt}</p>}

        {/* Meta Bar */}
        <div className="flex items-center gap-3 text-[10px] text-neutral-600 mb-6 pb-4 border-b border-neutral-800/30 flex-wrap">
          {page.author && (
            <span className="flex items-center gap-1"><User className="w-3 h-3" /> {page.author}</span>
          )}
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(page.updatedAt || page.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
          <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> v{page.version || "1.0"}</span>
          <Badge variant={page.status === "PUBLISHED" ? "success" : "warning"} className="text-[9px]">{page.status}</Badge>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> ~{Math.max(1, Math.ceil((page.content?.length || 0) / 3000))} min read</span>
        </div>

        {/* Content */}
        <div className="doc-content">
          <MarkdownRenderer content={page.content || ""} />
        </div>

        {/* Feedback */}
        <div className="flex items-center justify-between mt-8 p-3 rounded-xl border border-neutral-800/30 bg-neutral-900/40">
          <p className="text-xs text-neutral-500">Was this page helpful?</p>
          <div className="flex items-center gap-2">
            <button className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/50 transition-colors">
              <MessageCircle className="w-3.5 h-3.5" />
            </button>
            <button onClick={copyLink} className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/50 transition-colors">
              {copiedLink ? <LinkIcon className="w-3.5 h-3.5 text-emerald-400" /> : <LinkIcon className="w-3.5 h-3.5" />}
            </button>
            <button className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/50 transition-colors">
              <Bookmark className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Pages in this category */}
        {page.category && (() => {
          const catPages = pages.filter((p: any) => p.categoryId === page.categoryId);
          if (catPages.length <= 1) return null;
          return (
            <div className="mt-6 p-3 rounded-xl border border-neutral-800/30 bg-neutral-900/40">
              <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">{page.category.title}</p>
              <div className="space-y-0.5">
                {catPages.map((p: any) => (
                  <Link key={p.id} href={`/docs/${p.slug}`} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] transition-all ${p.slug === slug ? "bg-neutral-800/50 text-neutral-100 font-medium" : "text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/20"}`}>
                    <FileText className="w-3 h-3" />
                    {p.title}
                  </Link>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Prev/Next */}
        {(prevPage || nextPage) && (
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-neutral-800/30">
            {prevPage ? (
              <Link href={`/docs/${prevPage.slug}`} className="group flex items-center gap-2 text-xs text-neutral-500 hover:text-neutral-300 transition-colors max-w-[45%]">
                <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[9px] text-neutral-600 mb-0.5">Previous</p>
                  <p className="text-xs text-neutral-400 group-hover:text-neutral-200 truncate">{prevPage.title}</p>
                </div>
              </Link>
            ) : <div />}
            {nextPage ? (
              <Link href={`/docs/${nextPage.slug}`} className="group flex items-center gap-2 text-xs text-neutral-500 hover:text-neutral-300 transition-colors text-right max-w-[45%]">
                <div className="min-w-0">
                  <p className="text-[9px] text-neutral-600 mb-0.5">Next</p>
                  <p className="text-xs text-neutral-400 group-hover:text-neutral-200 truncate">{nextPage.title}</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 shrink-0" />
              </Link>
            ) : <div />}
          </div>
        )}
      </motion.div>
    </>
  );
}
