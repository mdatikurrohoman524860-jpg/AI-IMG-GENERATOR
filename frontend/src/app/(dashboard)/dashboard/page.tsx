"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Sparkles, Wand2, Zap, Image, Clock, Star, TrendingUp,
  Activity, BarChart3, Download, Eye, ArrowRight, Plus,
  LayoutDashboard, FolderKanban, CreditCard, Bell, Hash,
  Flame, Palette, Layers, ChevronRight, Play, Loader2,
  Camera, Video, Music, Globe, Shield, Cpu, Lightbulb,
  Target, AlertCircle, Gift, Rocket,
} from "lucide-react";
import { Card, CardContent, Badge, SectionHeader, StatCard, PageTransition } from "@/components/ui/primitives";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } } };

const HOURS = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, "0")}:00`);
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function generateHeatmapData(): number[][] {
  return DAYS.map(() =>
    HOURS.map(() => Math.random() > 0.7 ? Math.floor(Math.random() * 8) + 1 : 0)
  );
}

function UsageHeatmap() {
  const data = useMemo(() => generateHeatmapData(), []);

  return (
    <div className="overflow-x-auto no-scrollbar">
      <div className="flex gap-0.5 min-w-[600px]">
        <div className="flex flex-col gap-0.5 mr-1">
          {DAYS.map((d) => (
            <span key={d} className="text-[8px] text-neutral-600 h-3 flex items-center justify-end pr-1">{d}</span>
          ))}
        </div>
        <div className="flex gap-0.5">
          {data.map((row, i) => (
            <div key={i} className="flex flex-col gap-0.5">
              {row.map((v, j) => (
                <div
                  key={j}
                  className={cn(
                    "w-3 h-3 rounded-sm transition-colors duration-200",
                    v === 0 ? "bg-neutral-800/30" :
                    v <= 2 ? "bg-neutral-700/40" :
                    v <= 4 ? "bg-neutral-600/50" :
                    v <= 6 ? "bg-neutral-500/60" :
                    "bg-neutral-400/70"
                  )}
                  title={`${DAYS[i]} ${HOURS[j]}: ${v} generations`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CreditForecast() {
  const daysLeft = 10;
  const dailyAvg = 15;
  const creditsLeft = 340;
  const projectedUsage = dailyAvg * daysLeft;
  const willExceed = projectedUsage > creditsLeft;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-neutral-400">Daily average</span>
        <span className="text-xs text-neutral-300 font-medium">{dailyAvg} credits/day</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-neutral-400">Days remaining</span>
        <span className="text-xs text-neutral-300 font-medium">{daysLeft} days</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-neutral-400">Projected usage</span>
        <span className={cn("text-xs font-medium", willExceed ? "text-amber-400" : "text-emerald-400")}>
          {projectedUsage} credits
        </span>
      </div>
      {willExceed && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />
          <p className="text-[10px] text-amber-300">You may run out of credits before reset</p>
        </div>
      )}
    </div>
  );
}

const SUGGESTIONS = [
  { icon: Rocket, label: "Try Video Generation", desc: "Create your first AI video", href: "/generate" },
  { icon: FolderKanban, label: "Organize Projects", desc: "Group generations into projects", href: "/projects" },
  { icon: Gift, label: "Refer a Friend", desc: "Earn 50 bonus credits", href: "/billing" },
  { icon: Lightbulb, label: "Explore Styles", desc: "Try Cyberpunk or Vaporwave", href: "/generate" },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState("all");
  const [greeting, setGreeting] = useState(() => {
    const hr = new Date().getHours();
    if (hr < 12) return "Good morning";
    if (hr < 17) return "Good afternoon";
    return "Good evening";
  });

  const { data: statsData, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => api.getDashboardStats(),
    enabled: !!user,
  });

  const { data: recentData } = useQuery({
    queryKey: ["recent-generations"],
    queryFn: () => api.getGenerations({ limit: 6 }),
    enabled: !!user,
  });

  const { data: activityData } = useQuery({
    queryKey: ["recent-activity"],
    queryFn: () => api.getRecentActivity(),
    enabled: !!user,
  });

  const { data: storageData } = useQuery({
    queryKey: ["storage-info"],
    queryFn: () => api.getStorageInfo(),
    enabled: !!user,
  });

  const stats = statsData?.data as any;
  const rawRecent = recentData?.data as any;
  const recent: any[] = Array.isArray(rawRecent) ? rawRecent : (rawRecent?.generations ?? []);
  const activityItems: any[] = Array.isArray(activityData?.data) ? activityData!.data : [];
  const storage = storageData?.data as any || {};

  const totalGen = stats?.totalGenerations ?? 0;
  const creditsLeft = stats?.credits ?? user?.credits ?? 0;
  const projectsCount = stats?.projects ?? 0;
  const storageUsed = storage.usedFormatted || "0 B";
  const storagePercent = storage.percent || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-neutral-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-neutral-500">Loading workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <PageTransition className="max-w-[1440px] mx-auto space-y-6">
      {/* Welcome Hero */}
      <motion.div variants={item} className="relative overflow-hidden rounded-2xl border border-neutral-800/30 bg-neutral-900/40 p-6 md:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.03)_0%,transparent_60%)] pointer-events-none" />
        <div className="absolute top-0 right-0 w-48 h-48 bg-neutral-800/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-neutral-800/5 rounded-full blur-2xl pointer-events-none" />
        <div className="relative">
          <div className="flex items-start justify-between mb-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500/60" />
                </span>
                <span className="text-[10px] text-neutral-500 font-medium uppercase tracking-wider">AI Platform Active</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-100">
                {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-neutral-100 to-neutral-400">{user?.name?.split(" ")[0] || "Creator"}</span>
              </h1>
              <p className="text-sm text-neutral-500 mt-1.5 max-w-xl">
                You have <span className="text-neutral-300 font-medium">{creditsLeft.toLocaleString()} credits</span> remaining.
                Ready to create something amazing?
              </p>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <Link href="/billing" className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-800/60 border border-neutral-700/30 text-xs text-neutral-300 hover:text-neutral-100 hover:bg-neutral-800 transition-all active:scale-[0.97]">
                <CreditCard className="w-3.5 h-3.5" /> Buy Credits
              </Link>
              <Link href="/generate" className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-100 text-neutral-950 text-xs font-medium hover:bg-neutral-200 transition-all active:scale-[0.97]">
                <Sparkles className="w-3.5 h-3.5" /> New Generation
              </Link>
            </div>
          </div>

          {/* Quick Templates */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { label: "Cinematic Portrait", icon: Camera, desc: "Dramatic lighting, shallow DOF" },
              { label: "Product Shot", icon: Image, desc: "Studio quality, white bg" },
              { label: "Logo Design", icon: Palette, desc: "Minimalist, vector style" },
              { label: "Landscape", icon: Globe, desc: "Golden hour, epic view" },
            ].map((t) => (
              <Link
                key={t.label}
                href={`/generate?template=${t.label.toLowerCase().replace(/\s+/g, "-")}`}
                className="group flex items-center gap-3 px-3.5 py-3 rounded-xl bg-neutral-800/30 border border-neutral-800/30 hover:bg-neutral-800/50 hover:border-neutral-700/40 transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-neutral-800/60 border border-neutral-700/30 flex items-center justify-center shrink-0 group-hover:border-neutral-600/50 transition-colors">
                  <t.icon className="w-4 h-4 text-neutral-400 group-hover:text-neutral-300 transition-colors" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-neutral-300 group-hover:text-neutral-100 transition-colors">{t.label}</p>
                  <p className="text-[10px] text-neutral-600 truncate">{t.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Generations" value={totalGen.toLocaleString()} icon={Zap} trend={{ value: "+12%", positive: true }} sublabel="This month" />
        <StatCard label="Credits Available" value={creditsLeft.toLocaleString()} icon={Sparkles} trend={{ value: `${Math.round((creditsLeft / 1000) * 100)}% used` }} sublabel="of 1,000 monthly" />
        <StatCard label="Active Projects" value={projectsCount} icon={FolderKanban} trend={{ value: "+2 new", positive: true }} sublabel="This week" />
        <StatCard label="Storage Used" value={storageUsed} icon={LayoutDashboard} trend={{ value: `${storagePercent}%` }} sublabel="of 1 GB" />
      </motion.div>

      {/* Three Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left + Middle */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Generations */}
          <motion.div variants={item}>
            <SectionHeader
              title="Recent Generations"
              action={<Link href="/generate" className="flex items-center gap-1 hover:text-neutral-300 transition-colors">View all <ArrowRight className="w-3 h-3" /></Link>}
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {recent.length > 0 ? recent.slice(0, 6).map((gen: any, i: number) => (
                <Link href={`/generate?id=${gen.id}`} key={gen.id}>
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.25 }}
                    className="group relative overflow-hidden rounded-xl border border-neutral-800/30 bg-neutral-900/40 aspect-square hover:border-neutral-700/50 transition-all"
                  >
                    {gen.outputUrls?.[0] || gen.thumbnailUrl ? (
                      <>
                        <img src={gen.thumbnailUrl || gen.outputUrls[0]} alt={gen.prompt} className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="absolute bottom-0 left-0 right-0 p-2.5 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                          <p className="text-[10px] text-neutral-300 truncate">{gen.prompt}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">{gen.type}</Badge>
                            <span className="text-[9px] text-neutral-600">{new Date(gen.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <span className="p-1 rounded-md bg-black/50 backdrop-blur-sm text-neutral-300 hover:text-neutral-100 transition-colors cursor-pointer"><Eye className="w-3 h-3" /></span>
                          <span className="p-1 rounded-md bg-black/50 backdrop-blur-sm text-neutral-300 hover:text-neutral-100 transition-colors cursor-pointer"><Download className="w-3 h-3" /></span>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 bg-neutral-900/60 p-3">
                        <Badge variant={gen.status === "COMPLETED" ? "success" : gen.status === "FAILED" ? "danger" : "warning"}>{gen.status}</Badge>
                        <p className="text-[10px] text-neutral-600 text-center line-clamp-2 mt-1">{gen.prompt}</p>
                      </div>
                    )}
                  </motion.div>
                </Link>
              )) : (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-xl border border-neutral-800/20 bg-neutral-900/30 aspect-square flex flex-col items-center justify-center gap-2">
                    <Sparkles className="w-6 h-6 text-neutral-700" />
                    <p className="text-xs text-neutral-600">No generations yet</p>
                    <Link href="/generate" className="text-[10px] text-neutral-500 hover:text-neutral-300 underline underline-offset-2">Create one</Link>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          {/* Weekly Activity + Heatmap */}
          <motion.div variants={item}>
            <SectionHeader title="Usage Heatmap" action={<span className="text-neutral-600">Past 7 days</span>} />
            <Card className="p-5">
              <UsageHeatmap />
            </Card>
          </motion.div>

          {/* Weekly Activity Chart */}
          <motion.div variants={item}>
            <SectionHeader title="Weekly Activity" action={<span className="text-emerald-400 text-[10px]">+32% vs last week</span>} />
            <Card className="p-5">
              <div className="flex items-end justify-between h-28 gap-2">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => {
                  const val = Math.floor(Math.abs(Math.sin(i * 1.5 + Date.now() / 86400000)) * 80) + 20;
                  return (
                    <div key={day} className="flex-1 flex flex-col items-center gap-1.5">
                      <span className="text-[9px] text-neutral-600">{val}</span>
                      <div className="w-full rounded-md bg-neutral-800/50 relative overflow-hidden" style={{ height: 100 }}>
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${val}%` }}
                          transition={{ delay: i * 0.05, duration: 0.5, ease: "easeOut" }}
                          className="absolute bottom-0 w-full rounded-md bg-gradient-to-t from-neutral-500/30 to-neutral-400/10"
                        />
                      </div>
                      <span className="text-[9px] text-neutral-600">{day}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </motion.div>

          {/* Trending Styles */}
          <motion.div variants={item}>
            <SectionHeader title="Trending Styles" action={<span className="text-neutral-600">Updated today</span>} />
            <div className="flex flex-wrap gap-1.5">
              {["Cinematic", "Minimalist", "Vaporwave", "Cyberpunk", "Watercolor", "3D Render", "Pixel Art", "Oil Painting"].map((style) => (
                <Link
                  key={style}
                  href={`/generate?style=${style.toLowerCase()}`}
                  className="px-3 py-1.5 rounded-lg bg-neutral-800/30 border border-neutral-800/30 text-xs text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50 hover:border-neutral-700/40 transition-all"
                >
                  {style}
                </Link>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right Panel */}
        <div className="space-y-5">
          {/* Credit Usage + Forecast */}
          <motion.div variants={item}>
            <SectionHeader title="Credit Usage" />
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-neutral-400">Used this month</span>
                <span className="text-lg font-semibold text-neutral-100">{stats?.totalCreditsUsed ?? 0}</span>
              </div>
              <div className="h-2 rounded-full bg-neutral-800/60 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, ((stats?.totalCreditsUsed ?? 0) / 1000) * 100)}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-neutral-500/30 to-neutral-400/50"
                />
              </div>
              <div className="flex items-center justify-between mt-2 text-[10px] text-neutral-600">
                <span>0</span>
                <span>500</span>
                <span>1,000</span>
              </div>
              <Divider className="my-3" />
              <CreditForecast />
            </Card>
          </motion.div>

          {/* Suggestions */}
          <motion.div variants={item}>
            <SectionHeader title="Suggestions" />
            <div className="space-y-2">
              {SUGGESTIONS.map((s) => (
                <Link
                  key={s.label}
                  href={s.href}
                  className="flex items-center gap-3 p-3 rounded-xl bg-neutral-800/20 border border-neutral-800/20 hover:bg-neutral-800/40 hover:border-neutral-700/40 transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-neutral-800/60 border border-neutral-700/30 flex items-center justify-center shrink-0 group-hover:border-neutral-600/50 transition-colors">
                    <s.icon className="w-4 h-4 text-neutral-400 group-hover:text-neutral-300 transition-colors" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-neutral-300 group-hover:text-neutral-100 transition-colors">{s.label}</p>
                    <p className="text-[10px] text-neutral-600">{s.desc}</p>
                  </div>
                  <ChevronRight className="w-3 h-3 text-neutral-600 group-hover:text-neutral-400 transition-colors" />
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Active Models */}
          <motion.div variants={item}>
            <SectionHeader title="AI Models" />
            <Card className="p-4 space-y-3">
              {[
                { name: "DALL·E 3", status: "Operational", latency: "1.2s", usage: 65 },
                { name: "Stable Diffusion XL", status: "Operational", latency: "2.4s", usage: 42 },
                { name: "Midjourney V6", status: "Degraded", latency: "4.1s", usage: 28 },
              ].map((model) => (
                <div key={model.name} className="flex items-center justify-between py-1.5 px-2.5 rounded-lg hover:bg-neutral-800/20 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-neutral-800/60 border border-neutral-700/30 flex items-center justify-center shrink-0">
                      <Cpu className="w-3 h-3 text-neutral-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-neutral-300">{model.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`w-1 h-1 rounded-full ${model.status === "Operational" ? "bg-emerald-500/70" : "bg-amber-500/70"}`} />
                        <span className="text-[9px] text-neutral-600">{model.status}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-neutral-400">{model.latency}</p>
                    <p className="text-[9px] text-neutral-600">{model.usage}% used</p>
                  </div>
                </div>
              ))}
            </Card>
          </motion.div>

          {/* Activity Timeline */}
          <motion.div variants={item}>
            <SectionHeader title="Recent Activity" />
            <Card className="p-4">
              <div className="space-y-3">
                {activityItems.length > 0 ? activityItems.slice(0, 5).map((act: any, i: number) => {
                  const IconComponent = act.type === "video" ? Video : act.type === "project" ? FolderKanban : Image;
                  return (
                    <div key={act.id || i} className="flex items-start gap-3 group">
                      <div className="relative">
                        <div className="w-7 h-7 rounded-lg bg-neutral-800/60 border border-neutral-700/30 flex items-center justify-center shrink-0">
                          <IconComponent className="w-3.5 h-3.5 text-neutral-400" />
                        </div>
                        {i < Math.min(activityItems.length, 5) - 1 && <div className="absolute top-7 left-1/2 -translate-x-1/2 w-px h-3 bg-neutral-800/60" />}
                      </div>
                      <div className="min-w-0 pt-0.5">
                        <p className="text-xs text-neutral-300">{act.type === "video" ? "Generated video" : act.type === "project" ? "Created project" : "Generated image"}</p>
                        <p className="text-[10px] text-neutral-600">{act.prompt || act.name || ""}</p>
                      </div>
                      <span className="ml-auto text-[9px] text-neutral-600 shrink-0 pt-0.5">{formatTimeAgo(act.createdAt)}</span>
                    </div>
                  );
                }) : (
                  <p className="text-xs text-neutral-600 text-center py-4">No recent activity</p>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={item}>
            <SectionHeader title="Quick Actions" />
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "New Image", icon: Image, href: "/generate" },
                { label: "New Video", icon: Video, href: "/generate" },
                { label: "New Project", icon: FolderKanban, href: "/projects" },
                { label: "Buy Credits", icon: CreditCard, href: "/billing" },
              ].map((action) => (
                <Link key={action.label} href={action.href} className="flex items-center gap-2.5 px-3 py-3 rounded-xl bg-neutral-800/20 border border-neutral-800/20 text-xs text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40 hover:border-neutral-700/40 transition-all">
                  <action.icon className="w-3.5 h-3.5" />
                  {action.label}
                </Link>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}

function formatTimeAgo(date: string | Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function Divider({ className }: { className?: string }) {
  return <div className={cn("w-full h-px bg-neutral-800/50", className)} />;
}
