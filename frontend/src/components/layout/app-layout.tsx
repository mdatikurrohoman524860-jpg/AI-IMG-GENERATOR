"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Sidebar } from "./sidebar";
import { Navbar } from "./navbar";
import { LayoutDashboard, Wand2, FolderKanban, Image, Sparkles } from "lucide-react";

const sidebarWidth = 248;
const sidebarCollapsedWidth = 64;

const BOTTOM_NAV = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/generate", label: "Create", icon: Sparkles },
  { href: "/images", label: "Images", icon: Image },
  { href: "/projects", label: "Projects", icon: FolderKanban },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 767px)");
  const pathname = usePathname();

  useEffect(() => { setMobileOpen(false); }, [pathname]);
  useEffect(() => { if (!isMobile) setMobileOpen(false); }, [isMobile]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault();
        if (isMobile) setMobileOpen((c) => !c);
        else setCollapsed((c) => !c);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isMobile]);

  const sidebarPadding = isMobile ? 0 : collapsed ? sidebarCollapsedWidth : sidebarWidth;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        isMobile={isMobile}
      />
      <Navbar
        onMenuToggle={() => setMobileOpen(!mobileOpen)}
        isMobile={isMobile}
      />
      <motion.main
        animate={{
          paddingLeft: sidebarPadding,
          paddingTop: 56,
          paddingRight: 0,
          paddingBottom: 0,
        }}
        transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
      >
        <div className={cn("p-4 sm:p-5 lg:p-6", isMobile && "pb-24")}>
          {children}
        </div>
      </motion.main>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 h-16 bg-neutral-950/90 backdrop-blur-xl border-t border-neutral-800/40 flex items-center justify-around px-2 safe-area-bottom">
          {BOTTOM_NAV.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/"));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 w-16 py-1.5 rounded-xl transition-colors",
                  isActive ? "text-neutral-100" : "text-neutral-600 hover:text-neutral-400"
                )}
              >
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center transition-colors", isActive && "bg-neutral-800/60")}>
                  <item.icon className="w-4 h-4" />
                </div>
                <span className="text-[9px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
