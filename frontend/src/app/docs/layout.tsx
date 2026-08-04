"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Sparkles, Search, ChevronDown, ChevronRight, Menu, X,
  BookOpen, Code, Image, Video, CreditCard, Rocket,
  ExternalLink, Github, MessageCircle, Sun, Moon,
  ChevronLeft, ArrowLeft, ArrowRight, List,
  Bookmark, Clock, FileText, Globe, Command, LinkIcon, Share2,
} from "lucide-react";

const ICON_MAP: Record<string, any> = { Rocket, Image, Video, Code, BookOpen, CreditCard };

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [tocItems, setTocItems] = useState<{ id: string; text: string; level: number }[]>([]);
  const [activeHeading, setActiveHeading] = useState("");
  const contentRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { data: catsData } = useQuery({ queryKey: ["doc-categories"], queryFn: () => api.getDocCategories() });
  const { data: pagesData } = useQuery({ queryKey: ["doc-pages"], queryFn: () => api.getDocPages() });
  const { data: searchData } = useQuery({
    queryKey: ["doc-search", searchQuery],
    queryFn: () => api.searchDocs(searchQuery),
    enabled: searchQuery.length >= 2,
  });

  const categories: any[] = Array.isArray(catsData?.data) ? catsData!.data : [];
  const pages: any[] = Array.isArray(pagesData?.data) ? pagesData!.data : [];
  const searchResults: any[] = Array.isArray(searchData?.data) ? searchData!.data : [];

  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setSearchOpen(true); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchInputRef.current?.focus(), 100);
  }, [searchOpen]);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    const headings = content.querySelectorAll("h1, h2, h3");
    const items: { id: string; text: string; level: number }[] = [];
    headings.forEach((h) => {
      const id = h.textContent?.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || "";
      h.id = id;
      items.push({ id, text: h.textContent || "", level: parseInt(h.tagName[1]) });
    });
    setTocItems(items);

    const observer = new IntersectionObserver(
      (entries) => { entries.forEach((e) => { if (e.isIntersecting) setActiveHeading(e.target.id); }); },
      { rootMargin: "-80px 0px -80% 0px" },
    );
    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [children]);

  const toggleCat = (id: string) => {
    setExpandedCats((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };

  const pagesByCat = (catId: string) => pages.filter((p: any) => p.categoryId === catId);

  const currentPage = pages.find((p: any) => pathname === `/docs/${p.slug}`);

  const currentIndex = currentPage ? pages.indexOf(currentPage) : -1;
  const prevPage = currentIndex > 0 ? pages[currentIndex - 1] : null;
  const nextPage = currentIndex >= 0 && currentIndex < pages.length - 1 ? pages[currentIndex + 1] : null;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* Sticky Header */}
      <header className="sticky top-0 z-30 h-14 border-b border-neutral-800/40 bg-neutral-950/80 backdrop-blur-xl">
        <div className="flex items-center h-full px-4 gap-3 max-w-[1440px] mx-auto">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-1.5 rounded-lg text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/40 transition-colors">
            <Menu className="w-4 h-4" />
          </button>
          <Link href="/docs" className="flex items-center gap-2 shrink-0">
            <div className="w-6 h-6 rounded-lg bg-neutral-100 flex items-center justify-center"><Sparkles className="w-3 h-3 text-neutral-950" /></div>
            <span className="font-semibold text-sm">Intellix</span>
            <span className="text-[9px] text-neutral-600 px-1.5 py-0.5 rounded border border-neutral-700/40 font-medium">Docs</span>
          </Link>

          {/* Search */}
          <button onClick={() => setSearchOpen(true)} className="hidden sm:flex items-center gap-2 flex-1 max-w-md ml-4 px-3 py-1.5 rounded-lg bg-neutral-800/40 border border-neutral-700/30 text-xs text-neutral-500 hover:text-neutral-400 hover:border-neutral-600/50 transition-all">
            <Search className="w-3 h-3" />
            <span>Search documentation...</span>
            <kbd className="ml-auto px-1.5 py-0.5 rounded bg-neutral-800 text-[9px] text-neutral-600 font-mono">⌘K</kbd>
          </button>

          <div className="flex items-center gap-1.5 ml-auto">
            <span className="hidden md:flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] text-neutral-500 bg-neutral-800/30 border border-neutral-700/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/60" /> All Systems
            </span>
            <button className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/40 transition-colors">
              <Github className="w-3.5 h-3.5" />
            </button>
            <button className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/40 transition-colors">
              <MessageCircle className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex max-w-[1440px] mx-auto relative">
        {/* Left Sidebar */}
        <AnimatePresence mode="wait">
          {sidebarOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
          )}
        </AnimatePresence>
        <aside className={cn(
          "fixed lg:sticky top-14 z-20 h-[calc(100vh-3.5rem)] w-64 shrink-0 border-r border-neutral-800/30 bg-neutral-950 overflow-y-auto no-scrollbar transition-transform duration-200",
          "lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}>
          <div className="p-3">
            {/* Mobile search */}
            <div className="lg:hidden relative mb-3">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500 pointer-events-none" />
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search..." className="w-full bg-neutral-800/40 border border-neutral-700/30 rounded-lg pl-8 pr-3 py-1.5 text-xs text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-neutral-600 transition-all" />
            </div>

            <div className="space-y-3">
              {categories.map((cat: any) => {
                const CatIcon = ICON_MAP[cat.icon || ""] || FileText;
                const catPages = pagesByCat(cat.id);
                const isExpanded = expandedCats.has(cat.id) || catPages.some((p: any) => pathname === `/docs/${p.slug}`);
                return (
                  <div key={cat.id}>
                    <button onClick={() => toggleCat(cat.id)} className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs font-medium text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/30 transition-all">
                      <ChevronRight className={cn("w-3 h-3 transition-transform", isExpanded && "rotate-90")} />
                      <CatIcon className="w-3.5 h-3.5" />
                      <span>{cat.title}</span>
                      <span className="ml-auto text-[9px] text-neutral-600">{catPages.length}</span>
                    </button>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="ml-4 mt-0.5 space-y-0.5 border-l border-neutral-800/40 pl-2">
                            {catPages.map((p: any) => (
                              <Link key={p.id} href={`/docs/${p.slug}`} onClick={() => setSidebarOpen(false)} className={cn(
                                "block px-2.5 py-1.5 rounded-lg text-[11px] transition-all",
                                pathname === `/docs/${p.slug}` ? "bg-neutral-800/60 text-neutral-100 font-medium" : "text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/20",
                              )}>
                                {p.title}
                              </Link>
                            ))}
                            {catPages.length === 0 && <p className="text-[10px] text-neutral-600 px-2.5 py-1.5">No pages yet</p>}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main ref={contentRef} className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-8 max-w-[720px] mx-auto lg:mx-0">
          {children}
          {/* Prev/Next Navigation */}
          {(prevPage || nextPage) && (
            <div className="flex items-center justify-between mt-12 pt-6 border-t border-neutral-800/30">
              {prevPage ? (
                <Link href={`/docs/${prevPage.slug}`} className="group flex items-center gap-2 text-xs text-neutral-500 hover:text-neutral-300 transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <div>
                    <p className="text-[9px] text-neutral-600 mb-0.5">Previous</p>
                    <p className="text-xs text-neutral-400 group-hover:text-neutral-200">{prevPage.title}</p>
                  </div>
                </Link>
              ) : <div />}
              {nextPage ? (
                <Link href={`/docs/${nextPage.slug}`} className="group flex items-center gap-2 text-xs text-neutral-500 hover:text-neutral-300 transition-colors text-right">
                  <div>
                    <p className="text-[9px] text-neutral-600 mb-0.5">Next</p>
                    <p className="text-xs text-neutral-400 group-hover:text-neutral-200">{nextPage.title}</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              ) : <div />}
            </div>
          )}
        </main>

        {/* Right TOC */}
        {tocItems.length > 0 && (
          <aside className="hidden xl:block w-56 shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto no-scrollbar p-4">
            <p className="text-[9px] font-semibold uppercase tracking-wider text-neutral-600 mb-3">On This Page</p>
            <nav className="space-y-0.5">
              {tocItems.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => { e.preventDefault(); document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth" }); }}
                  className={cn(
                    "block text-[11px] py-1 transition-all border-l-2",
                    item.level === 1 ? "pl-0" : item.level === 2 ? "pl-3" : "pl-6",
                    activeHeading === item.id ? "border-neutral-400 text-neutral-200" : "border-transparent text-neutral-600 hover:text-neutral-400 hover:border-neutral-700",
                  )}
                >
                  {item.text}
                </a>
              ))}
            </nav>
            <div className="mt-4 space-y-2 pt-3 border-t border-neutral-800/30">
              <button onClick={() => { navigator.clipboard.writeText(window.location.href); }} className="flex items-center gap-2 text-[10px] text-neutral-600 hover:text-neutral-400 transition-colors w-full">
                <LinkIcon className="w-3 h-3" /> Copy link
              </button>
              <button className="flex items-center gap-2 text-[10px] text-neutral-600 hover:text-neutral-400 transition-colors w-full">
                <Share2 className="w-3 h-3" /> Share page
              </button>
              <a href="#" className="flex items-center gap-2 text-[10px] text-neutral-600 hover:text-neutral-400 transition-colors">
                <MessageCircle className="w-3 h-3" /> Give feedback
              </a>
              <p className="flex items-center gap-2 text-[10px] text-neutral-600 mt-2">
                <Clock className="w-2.5 h-2.5" /> ~{Math.max(1, Math.ceil(tocItems.length / 3))} min read
              </p>
            </div>
          </aside>
        )}
      </div>

      {/* Search Modal */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-[15vh]" onClick={() => setSearchOpen(false)}>
            <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }} className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-800/50">
                <Search className="w-4 h-4 text-neutral-500 shrink-0" />
                <input ref={searchInputRef} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search documentation..." className="flex-1 bg-transparent text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none" />
                <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 text-[9px] text-neutral-600 font-mono">ESC</kbd>
              </div>
              <div className="max-h-80 overflow-y-auto p-2">
                {searchQuery.length < 2 ? (
                  <div className="space-y-1">
                    <p className="text-[9px] text-neutral-600 uppercase tracking-wider px-2 pt-2 pb-1">Popular</p>
                    {pages.slice(0, 5).map((p: any) => (
                      <Link key={p.id} href={`/docs/${p.slug}`} onClick={() => { setSearchOpen(false); setSearchQuery(""); }} className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50 transition-colors">
                        <FileText className="w-3.5 h-3.5 text-neutral-600" />
                        <span>{p.title}</span>
                      </Link>
                    ))}
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="space-y-0.5">
                    {searchResults.map((r: any) => (
                      <Link key={r.id} href={`/docs/${r.slug}`} onClick={() => { setSearchOpen(false); setSearchQuery(""); }} className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50 transition-colors">
                        <FileText className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-neutral-200">{r.title}</p>
                          {r.excerpt && <p className="text-[10px] text-neutral-600 truncate">{r.excerpt}</p>}
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-neutral-600 text-center py-8">No results found</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
