"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { CommandPalette } from "./command-palette";
import {
  Search, Bell, LogOut, User, CreditCard, Settings,
  Command, ChevronDown, Sparkles, Plus, Zap,
  Activity, ChevronRight, Keyboard, Menu,
} from "lucide-react";

interface NavbarProps {
  onMenuToggle: () => void;
  isMobile: boolean;
}

export function Navbar({ onMenuToggle, isMobile }: NavbarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [cmdOpen, setCmdOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLButtonElement>(null);
  const createRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (createRef.current && !createRef.current.contains(e.target as Node)) setCreateOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const { data: notifData } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.getNotifications(),
    enabled: !!user,
    refetchInterval: 30000,
  });

  const notifications = (notifData?.data as any)?.notifications ?? notifData?.data ?? [];
  const unreadCount = (notifData?.data as any)?.unreadCount ?? notifications.filter((n: any) => !n.read).length ?? 0;

  const initials = user?.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || "A";

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-30 h-14">
        <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-800/30" />
        <div className="relative flex items-center justify-between h-full px-3 sm:px-4">
          {/* Left */}
          <div className="flex items-center gap-1">
            {/* Mobile: hamburger */}
            {isMobile && (
              <button onClick={onMenuToggle} className="p-2 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40 transition-colors">
                <Menu className="w-5 h-5" />
              </button>
            )}

            {/* Desktop: Create button */}
            {!isMobile && (
              <div ref={createRef as any} className="relative">
                <button
                  onClick={() => setCreateOpen(!createOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-100 text-neutral-950 text-xs font-medium hover:bg-neutral-200 transition-all active:scale-[0.97]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Create</span>
                </button>
                <AnimatePresence>
                  {createOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.96 }}
                      className="absolute top-full mt-1 left-0 w-48 bg-neutral-900 border border-neutral-700/60 rounded-xl shadow-2xl overflow-hidden z-50"
                    >
                      <div className="p-1.5 space-y-0.5">
                        {[
                          { label: "New Image", icon: Sparkles, href: "/generate", desc: "Generate with AI" },
                          { label: "New Video", icon: Activity, href: "/generate", desc: "AI video generation" },
                          { label: "New Project", icon: Plus, href: "/projects", desc: "Organize generations" },
                        ].map((item) => (
                          <Link key={item.label} href={item.href} onClick={() => setCreateOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-neutral-800/60 transition-colors">
                            <div className="w-7 h-7 rounded-lg bg-neutral-800/60 border border-neutral-700/30 flex items-center justify-center">
                              <item.icon className="w-3.5 h-3.5 text-neutral-400" />
                            </div>
                            <div>
                              <p className="text-xs font-medium text-neutral-200">{item.label}</p>
                              <p className="text-[9px] text-neutral-500">{item.desc}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Desktop: Breadcrumb nav */}
            {!isMobile && (
              <div className="hidden md:flex items-center gap-0.5 ml-2">
                {[
                  { label: "Dashboard", href: "/dashboard" },
                  { label: "Generate", href: "/generate" },
                  { label: "Projects", href: "/projects" },
                ].map((item, i) => (
                  <div key={item.href} className="flex items-center">
                    {i > 0 && <ChevronRight className="w-3 h-3 text-neutral-700" />}
                    <Link href={item.href} className="px-2 py-1.5 rounded-lg text-xs text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/30 transition-colors">{item.label}</Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            {/* Search: full on desktop, icon on mobile */}
            <button
              onClick={() => setCmdOpen(true)}
              className={cn(
                "flex items-center gap-2 rounded-lg transition-colors",
                isMobile
                  ? "p-2 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40"
                  : "px-3 py-1.5 bg-neutral-900/80 border border-neutral-800/50 text-xs text-neutral-500 hover:text-neutral-300 hover:border-neutral-700 w-40 lg:w-52"
              )}
            >
              <Search className="w-3.5 h-3.5 shrink-0" />
              {!isMobile && <span className="hidden sm:inline">Search anything...</span>}
              {!isMobile && (
                <span className="hidden lg:flex items-center gap-0.5 ml-auto">
                  <kbd className="flex items-center gap-0.5 px-1 py-0.5 rounded bg-neutral-800 text-[9px] text-neutral-500 border border-neutral-700/40 font-mono">
                    <Command className="w-2 h-2" />K
                  </kbd>
                </span>
              )}
            </button>

            {/* Desktop: AI status */}
            {!isMobile && (
              <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-neutral-500">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/60 animate-pulse" />
                <span>All systems</span>
              </div>
            )}

            {/* Desktop: Credit Balance */}
            {!isMobile && (
              <Link href="/billing" className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40 transition-colors">
                <Zap className="w-3.5 h-3.5" />
                <span className="font-medium text-neutral-100">{user?.credits ?? 0}</span>
              </Link>
            )}

            {/* Notifications */}
            <div className="relative">
              <button
                ref={notifRef}
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40 transition-colors"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-neutral-100 text-neutral-950 text-[9px] font-bold flex items-center justify-center"
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </motion.span>
                )}
              </button>
              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.96 }}
                    className={cn(
                      "absolute top-full mt-1 z-50 w-80 bg-neutral-900 border border-neutral-700/60 rounded-xl shadow-2xl overflow-hidden",
                      isMobile ? "right-0" : "right-0"
                    )}
                  >
                    <div className="p-3 border-b border-neutral-800 flex items-center justify-between">
                      <span className="text-xs font-semibold text-neutral-200">Notifications</span>
                      <span className="text-[10px] text-neutral-500">{unreadCount} unread</span>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.length > 0 ? notifications.slice(0, 5).map((n: any, i: number) => (
                        <div key={n.id || i} className={cn("px-3 py-2.5 border-b border-neutral-800/30 last:border-0 hover:bg-neutral-800/30 transition-colors", !n.read && "bg-neutral-800/20")}>
                          <p className="text-xs text-neutral-300">{n.message || n.title}</p>
                          <p className="text-[10px] text-neutral-600 mt-0.5">{n.createdAt ? new Date(n.createdAt).toLocaleDateString() : "Today"}</p>
                        </div>
                      )) : (
                        <div className="px-3 py-6 text-center text-xs text-neutral-500">No notifications</div>
                      )}
                    </div>
                    <Link href="/settings" onClick={() => setNotifOpen(false)} className="block px-3 py-2.5 text-xs text-center text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/30 transition-colors border-t border-neutral-800">
                      View all notifications
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-lg hover:bg-neutral-800/40 transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-neutral-800 border border-neutral-700/30 flex items-center justify-center text-[10px] font-semibold text-neutral-300">
                  {initials}
                </div>
                {!isMobile && <span className="hidden lg:inline text-xs text-neutral-300 max-w-[100px] truncate">{user?.name || user?.email}</span>}
                {!isMobile && <ChevronDown className="w-3 h-3 text-neutral-600" />}
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.96 }}
                    className={cn(
                      "absolute top-full mt-1 z-50 w-56 bg-neutral-900 border border-neutral-700/60 rounded-xl shadow-2xl overflow-hidden",
                      isMobile ? "right-0" : "right-0"
                    )}
                  >
                    <div className="p-3.5 border-b border-neutral-800/60">
                      <p className="text-sm font-medium text-neutral-200 truncate">{user?.name || "User"}</p>
                      <p className="text-xs text-neutral-500 truncate mt-0.5">{user?.email}</p>
                    </div>
                    <div className="p-1.5 space-y-0.5">
                      <Link href="/settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50 transition-colors">
                        <Settings className="w-3.5 h-3.5" /> Settings
                      </Link>
                      <Link href="/billing" onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50 transition-colors">
                        <CreditCard className="w-3.5 h-3.5" /> Billing
                      </Link>
                      <button className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50 transition-colors w-full">
                        <Keyboard className="w-3.5 h-3.5" /> Keyboard Shortcuts
                      </button>
                    </div>
                    <div className="p-1.5 border-t border-neutral-800/60">
                      <button onClick={() => { setProfileOpen(false); logout(); }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-neutral-400 hover:text-red-400 hover:bg-neutral-800/50 transition-colors">
                        <LogOut className="w-3.5 h-3.5" /> Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
      <GlobalCommandListener onOpen={() => setCmdOpen(true)} />
    </>
  );
}

function GlobalCommandListener({ onOpen }: { onOpen: () => void }) {
  useEffect(() => {
    (window as any).__openCommandPalette = onOpen;
  }, [onOpen]);
  return null;
}
