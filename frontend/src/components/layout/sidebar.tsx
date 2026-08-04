"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import {
  Sparkles, LayoutDashboard, Wand2, FolderKanban, Image, Video,
  CreditCard, Settings, ChevronLeft, ChevronRight, Command,
  Star, Clock, Zap, ChevronDown, Bookmark, BookOpen, X, Menu,
} from "lucide-react";

const NAV_SECTIONS = [
  { label: "Workspace", items: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/generate", label: "Generate", icon: Wand2 },
    { href: "/projects", label: "Projects", icon: FolderKanban },
  ]},
  { label: "Library", items: [
    { href: "/images", label: "Images", icon: Image },
    { href: "/videos", label: "Videos", icon: Video },
    { href: "/prompts", label: "Prompts", icon: Bookmark },
  ]},
  { label: "Account", items: [
    { href: "/billing", label: "Billing", icon: CreditCard },
    { href: "/settings", label: "Settings", icon: Settings },
  ]},
  { label: "Resources", items: [
    { href: "/docs", label: "Documentation", icon: BookOpen },
  ]},
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
  isMobile: boolean;
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose, isMobile }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [showRecent, setShowRecent] = useState(true);
  const [showFavs, setShowFavs] = useState(true);

  const { data: projectsData } = useQuery({
    queryKey: ["sidebar-projects"],
    queryFn: () => api.getProjects(),
    enabled: !!user && !collapsed,
  });

  const { data: promptsData } = useQuery({
    queryKey: ["sidebar-prompts"],
    queryFn: () => api.getPrompts({ category: undefined }),
    enabled: !!user && !collapsed,
  });

  const rawProjects = projectsData?.data as any;
  const recentProjects: any[] = Array.isArray(rawProjects) ? rawProjects : (rawProjects?.projects ?? []);
  const favoritePrompts: any[] = Array.isArray(promptsData?.data) ? (promptsData!.data as any[]).filter((p: any) => p.favorite) : [];

  const credits = user?.credits ?? 0;
  const quota = user?.quota ?? 1000;
  const plan = user?.subscriptionPlan ?? "FREE";
  const storagePercent = Math.min(100, Math.round(quota > 0 ? (credits / quota) * 100 : 0));

  const initials = user?.name?.charAt(0)?.toUpperCase() || "A";

  const sidebarContent = (
    <div className="flex flex-col h-full bg-neutral-950">
      {/* Logo */}
      <div className="flex items-center h-14 px-3.5 border-b border-neutral-800/30 shrink-0">
        <div className="flex items-center gap-3 w-full">
          <div className="w-7 h-7 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-neutral-950" />
          </div>
          <div className="flex items-center gap-2 overflow-hidden flex-1">
            <span className="font-semibold text-sm tracking-tight text-neutral-100 whitespace-nowrap">Intellix</span>
            <span className="px-1.5 py-0.5 rounded-md bg-neutral-800/50 text-[9px] text-neutral-500 border border-neutral-700/30 font-medium whitespace-nowrap">v2.0</span>
          </div>
          {isMobile && (
            <button onClick={onMobileClose} className="p-1 rounded-lg text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/40 transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto no-scrollbar py-2">
        <div className="px-2 space-y-4">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-neutral-600 px-2.5 mb-1">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/"));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => isMobile && onMobileClose()}
                      className={cn(
                        "group relative flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-medium transition-all duration-150",
                        isActive ? "text-neutral-100" : "text-neutral-500 hover:text-neutral-300"
                      )}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="nav-active"
                          className="absolute inset-0 rounded-xl bg-neutral-800/70 border border-neutral-700/40"
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                      <div className="relative flex items-center gap-3 w-full">
                        <item.icon className={cn("w-4 h-4 shrink-0", isActive ? "text-neutral-100" : "text-neutral-500")} />
                        <span>{item.label}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mx-4 my-3 h-px bg-gradient-to-r from-transparent via-neutral-800/40 to-transparent" />

        {/* Recent */}
        <div className="px-2">
          <button onClick={() => setShowRecent(!showRecent)} className="flex items-center gap-2 w-full px-2.5 py-1.5 text-[9px] font-semibold uppercase tracking-[0.15em] text-neutral-600 hover:text-neutral-400 transition-colors">
            <Clock className="w-3 h-3" />
            <span>Recent</span>
            <ChevronDown className={cn("w-2.5 h-2.5 ml-auto transition-transform", showRecent && "rotate-180")} />
          </button>
          {showRecent && (
            <div className="space-y-0.5 mt-1">
              {recentProjects.length > 0 ? recentProjects.slice(0, 4).map((p: any) => (
                <Link key={p.id} href={`/projects/${p.id}`} onClick={() => isMobile && onMobileClose()} className="flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-lg text-xs text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/30 transition-colors">
                  <FolderKanban className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
                  <span className="truncate">{p.name}</span>
                </Link>
              )) : (
                <p className="text-[10px] text-neutral-600 px-2.5 py-1.5">No recent projects</p>
              )}
            </div>
          )}
        </div>

        {/* Favorites */}
        <div className="px-2 mt-2">
          <button onClick={() => setShowFavs(!showFavs)} className="flex items-center gap-2 w-full px-2.5 py-1.5 text-[9px] font-semibold uppercase tracking-[0.15em] text-neutral-600 hover:text-neutral-400 transition-colors">
            <Star className="w-3 h-3" />
            <span>Favorites</span>
            <ChevronDown className={cn("w-2.5 h-2.5 ml-auto transition-transform", showFavs && "rotate-180")} />
          </button>
          {showFavs && (
            <div className="space-y-0.5 mt-1">
              {favoritePrompts.length > 0 ? favoritePrompts.slice(0, 3).map((p: any) => (
                <Link key={p.id} href={`/generate?prompt=${encodeURIComponent(p.prompt)}`} onClick={() => isMobile && onMobileClose()} className="flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-lg text-xs text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/30 transition-colors">
                  <Sparkles className="w-3 h-3 text-neutral-600 shrink-0" />
                  <span className="truncate text-[11px]">{p.prompt}</span>
                </Link>
              )) : (
                <p className="text-[10px] text-neutral-600 px-2.5 py-1.5">No favorite prompts</p>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Bottom */}
      <div className="border-t border-neutral-800/30 shrink-0">
        <div className="px-3.5 py-2.5">
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/60 animate-pulse shrink-0" />
            <span className="text-[10px] text-neutral-500 font-medium">Flux Dev</span>
            <span className="text-[9px] text-neutral-600 ml-auto">Online</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 rounded-full bg-neutral-800/60 overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${storagePercent}%` }} className="h-full rounded-full bg-neutral-500/40" />
            </div>
            <span className="text-[9px] text-neutral-600 w-12 text-right">{credits}/{quota}</span>
          </div>
        </div>

        <div className="px-2 pb-2">
          <Link href="/billing" className="flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-medium text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/30 transition-all">
            <Zap className="w-4 h-4 shrink-0" />
            <span className="flex-1">Credits</span>
            <span className="text-neutral-100 font-semibold">{credits}</span>
          </Link>
          <div className="flex items-center gap-2.5 px-2.5 py-1.5">
            <div className="w-6 h-6 rounded-lg bg-neutral-800 border border-neutral-700/30 flex items-center justify-center text-[9px] font-semibold text-neutral-300 shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-neutral-300 truncate">{user?.name || "User"}</p>
              <p className="text-[9px] text-neutral-600">{plan}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  /* Mobile: Drawer */
  if (isMobile) {
    return (
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={onMobileClose}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 left-0 z-50 w-[260px] h-screen border-r border-neutral-800/40 overflow-hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    );
  }

  /* Desktop: Fixed sidebar */
  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 64 : 248 }}
      transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
      className="fixed top-0 left-0 z-40 h-screen border-r border-neutral-800/40 flex flex-col overflow-hidden select-none"
    >
      {/* Desktop collapsed: minimal view */}
      {collapsed ? (
        <div className="flex flex-col h-full bg-neutral-950">
          <div className="flex items-center justify-center h-14 border-b border-neutral-800/30">
            <div className="w-7 h-7 rounded-lg bg-neutral-100 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-neutral-950" />
            </div>
          </div>
          <nav className="flex-1 overflow-y-auto no-scrollbar py-2 px-2 space-y-1">
            {NAV_SECTIONS.map((s) => s.items.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link key={item.href} href={item.href} className={cn("flex items-center justify-center p-2 rounded-xl transition-colors", isActive ? "bg-neutral-800/70 text-neutral-100" : "text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/30")}>
                  <item.icon className="w-4 h-4" />
                </Link>
              );
            }))}
          </nav>
          <div className="px-2 pb-2 space-y-1">
            <Link href="/billing" className="flex items-center justify-center p-2 rounded-xl text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/30 transition-colors">
              <Zap className="w-4 h-4" />
            </Link>
            <div className="flex justify-center">
              <div className="w-7 h-7 rounded-lg bg-neutral-800 border border-neutral-700/30 flex items-center justify-center text-[10px] font-semibold text-neutral-300">{initials}</div>
            </div>
            <button onClick={onToggle} className="w-full flex items-center justify-center py-2 rounded-xl text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/30 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center justify-center py-1.5 bg-neutral-900/80 border-t border-neutral-800/20 text-[9px] text-neutral-600">
            <Command className="w-2.5 h-2.5" /><span className="ml-0.5">B</span>
          </div>
        </div>
      ) : (
        sidebarContent
      )}
    </motion.aside>
  );
}
