"use client";

import { Suspense, useState, useCallback, useMemo, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type ClientModel } from "@/services/api";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Sparkles, Loader2, Download, Trash2, Heart, Eye, X,
  Image, Video, Wand2, SlidersHorizontal, Plus, Copy,
  Check, ChevronDown, Settings2, Upload, Mic, Bookmark,
  RefreshCw, Share2, FolderKanban, Maximize2, Minimize2,
  Cpu, Clock, Layers, Grid3X3, Zap, FileImage, Dices,
  Hash, Lock, Palette, Expand, PanelLeftClose, PanelLeftOpen,
  ZoomIn, ZoomOut, Sidebar,
} from "lucide-react";
import {
  Card, CardHeader, CardContent, Badge, SectionHeader,
  Button, Divider, Skeleton, Kbd, PageTransition,
} from "@/components/ui/primitives";

const GENERATION_TYPES = [
  { id: "IMAGE", label: "Image", icon: Image },
  { id: "VIDEO", label: "Video", icon: Video },
  { id: "LOGO", label: "Logo", icon: Palette },
  { id: "ICON", label: "Icon", icon: Grid3X3 },
  { id: "ILLUSTRATION", label: "Illustration", icon: Layers },
  { id: "WALLPAPER", label: "Wallpaper", icon: Image },
];

const MODELS = [
  { id: "flux", label: "Flux Dev", badge: "Recommended", color: "from-emerald-500/10 to-emerald-500/5" },
  { id: "turbo", label: "Flux Schnell", badge: "Fast", color: "from-blue-500/10 to-blue-500/5" },
];

const MODEL_FALLBACKS: Record<string, string> = {
  flux: "Flux Dev",
  turbo: "Flux Schnell",
  image: "Flux Dev",
  video: "Video",
  text: "Text",
};

const ASPECT_RATIOS = ["1:1", "4:3", "3:4", "16:9", "9:16", "21:9"];
const STYLES = ["Cinematic", "Minimalist", "Cyberpunk", "Vaporwave", "Watercolor", "3D Render", "Pixel Art", "Oil Painting", "Sketch", "Anime"];

const PROMPT_TEMPLATES = [
  "Cinematic portrait of...",
  "Minimalist logo for...",
  "Product photo of...",
  "Futuristic cityscape...",
  "Abstract fluid art...",
];

function GenerateContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const [prompt, setPrompt] = useState(searchParams.get("prompt") || "");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [type, setType] = useState("IMAGE");
  const [model, setModel] = useState("flux");
  const [style, setStyle] = useState("Cinematic");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [batchCount, setBatchCount] = useState(1);
  const [quality, setQuality] = useState("Standard");
  const [steps, setSteps] = useState(30);
  const [cfg, setCfg] = useState(7);
  const [seed, setSeed] = useState<number | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [privateMode, setPrivateMode] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"preview" | "history">("history");
  const [fullscreen, setFullscreen] = useState(false);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  const { data: clientModelsData, isLoading: clientModelsLoading } = useQuery({
    queryKey: ["client-models"],
    queryFn: () => api.fetchClientModels(),
    staleTime: 60_000,
  });

  const clientModels: ClientModel[] = clientModelsData?.data ?? [];

  const liveModels = useMemo(() => {
    const list: typeof MODELS = [];
    for (const cm of clientModels) {
      const cap = cm.capability === "image"
        ? (type === "VIDEO" ? "video" : "image")
        : cm.capability;
      if (cap === "image" || cap === "video") {
        list.push({
          id: cm.id,
          label: cm.name,
          badge: cm.provider,
          color: "from-emerald-500/10 to-emerald-500/5",
        });
      }
    }
    return list;
  }, [clientModels, type]);

  const visibleModels = liveModels.length ? liveModels : MODELS;
  const currentModelLabel =
    visibleModels.find((m) => m.id === model)?.label ??
    MODEL_FALLBACKS[model] ??
    visibleModels[0]?.label ??
    "Flux Dev";

  const { data: generationsData, isLoading: historyLoading } = useQuery({
    queryKey: ["generations"],
    queryFn: () => api.getGenerations({ limit: 50 }),
    enabled: !!user,
  });

  const generateMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.createGeneration(body),
    onSuccess: () => {
      toast.success("Generation started!");
      queryClient.invalidateQueries({ queryKey: ["generations"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteGeneration(id),
    onSuccess: () => { toast.success("Deleted"); queryClient.invalidateQueries({ queryKey: ["generations"] }); },
    onError: (error: Error) => toast.error(error.message),
  });

  const favoriteMutation = useMutation({
    mutationFn: (id: string) => api.toggleFavorite(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["generations"] }),
  });

  const handleGenerate = useCallback(() => {
    if (!prompt.trim()) { toast.error("Please enter a prompt"); return; }
    generateMutation.mutate({
      prompt: prompt.trim(),
      negativePrompt: negativePrompt.trim() || undefined,
      type: type.toLowerCase(),
      model,
      style: style.toLowerCase(),
      quality: quality.toLowerCase(),
      aspectRatio,
      batchCount,
      steps,
      cfgScale: cfg,
      seed: seed ?? undefined,
      private: privateMode,
    });
  }, [prompt, negativePrompt, type, model, style, quality, aspectRatio, batchCount, steps, cfg, seed, privateMode, generateMutation]);

  const rawGen = generationsData?.data as any;
  const generations: any[] = Array.isArray(rawGen) ? rawGen : (rawGen?.generations ?? []);
  const isGenerating = generateMutation.isPending;

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  const aspectRatioClass = aspectRatio === "1:1" ? "aspect-square" : aspectRatio === "16:9" ? "aspect-video" : aspectRatio === "4:3" ? "aspect-[4/3]" : aspectRatio === "3:4" ? "aspect-[3/4]" : aspectRatio === "9:16" ? "aspect-[9/16]" : aspectRatio === "21:9" ? "aspect-[21/9]" : "aspect-square";

  return (
    <PageTransition className={cn("mx-auto", fullscreen ? "max-w-full" : "max-w-[1600px]")}>
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPanelCollapsed(!panelCollapsed)}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/40 transition-colors hidden lg:flex"
            title={panelCollapsed ? "Show panel" : "Hide panel"}
          >
            {panelCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
          <h1 className="text-lg font-semibold text-neutral-100 hidden sm:block">Create</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden md:flex"><Kbd>⌘G Generate</Kbd></span>
          <button onClick={handleFullscreen} className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/40 transition-colors" title={fullscreen ? "Exit fullscreen" : "Fullscreen"}>
            {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className={cn("grid gap-5", fullscreen ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-5")}>
        {/* Left Panel - Controls */}
        <div className={cn(
          "space-y-4 transition-all duration-300",
          fullscreen ? "hidden" : "",
          panelCollapsed ? "lg:hidden" : "lg:col-span-2"
        )}>
          {/* Type Selector */}
          <Card>
            <CardContent className="py-3.5">
              <div className="flex flex-wrap gap-1.5">
                {GENERATION_TYPES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setType(t.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                      type === t.id
                        ? "bg-neutral-100 text-neutral-950 shadow-sm"
                        : "bg-neutral-800/30 text-neutral-500 border border-neutral-800/30 hover:bg-neutral-800/50 hover:text-neutral-300"
                    )}
                  >
                    <t.icon className="w-3.5 h-3.5" />
                    {t.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Prompt */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-neutral-400 font-medium">Prompt</label>
                <div className="flex items-center gap-1.5">
                  <button className="p-1 rounded text-neutral-600 hover:text-neutral-400 transition-colors" title="Random prompt">
                    <Dices className="w-3 h-3" />
                  </button>
                  <button className="p-1 rounded text-neutral-600 hover:text-neutral-400 transition-colors" title="Use template">
                    <Bookmark className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-1">
              <textarea
                ref={promptRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe what you want to create in detail..."
                rows={4}
                className="w-full bg-neutral-800/50 border border-neutral-700/40 rounded-xl px-3.5 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-500 resize-none focus:outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600/20 transition-all"
              />
              <div className="mt-2">
                <button
                  onClick={() => setNegativePrompt(negativePrompt ? "" : " ")}
                  className="text-[10px] text-neutral-600 hover:text-neutral-400 transition-colors"
                >
                  {negativePrompt ? "– Remove negative prompt" : "+ Add negative prompt"}
                </button>
                {negativePrompt && (
                  <textarea
                    value={negativePrompt}
                    onChange={(e) => setNegativePrompt(e.target.value)}
                    placeholder="What to avoid..."
                    rows={2}
                    className="mt-1.5 w-full bg-neutral-800/30 border border-neutral-700/30 rounded-xl px-3 py-2 text-xs text-neutral-100 placeholder:text-neutral-500 resize-none focus:outline-none focus:border-neutral-600 transition-all"
                  />
                )}
              </div>
              <div className="flex flex-wrap gap-1 mt-2.5">
                {PROMPT_TEMPLATES.map((t) => (
                  <button
                    key={t}
                    onClick={() => { setPrompt(t); promptRef.current?.focus(); }}
                    className="px-2 py-1 rounded-md bg-neutral-800/30 border border-neutral-800/30 text-[10px] text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/50 transition-colors"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Model & Settings */}
          <Card>
            <CardContent className="py-3.5 space-y-4">
              {/* Model */}
              <div>
                <label className="block text-[11px] text-neutral-500 font-medium mb-1.5">Model</label>
                <div className="flex gap-1.5">
                  {visibleModels.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setModel(m.id)}
                      className={cn(
                        "flex-1 relative px-3 py-2.5 rounded-xl text-xs font-medium transition-all border overflow-hidden",
                        model === m.id
                          ? `bg-gradient-to-br ${m.color} border-neutral-600/50 text-neutral-100`
                          : "bg-neutral-800/30 border-neutral-800/40 text-neutral-500 hover:bg-neutral-800/50 hover:text-neutral-300"
                      )}
                    >
                      {m.label}
                      <span className={cn(
                        "block text-[9px] font-normal mt-0.5",
                        model === m.id ? "text-neutral-500" : "text-neutral-600"
                      )}>{m.badge}</span>
                    </button>
                  ))}
                  {clientModelsLoading && (
                    <div className="flex-1 px-3 py-2.5 rounded-xl text-xs text-neutral-500 border border-neutral-800/40 bg-neutral-800/30 animate-pulse">
                      Loading models…
                    </div>
                  )}
                </div>
              </div>

              {/* Basic params */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-neutral-500 font-medium mb-1">Aspect Ratio</label>
                  <div className="flex flex-wrap gap-1">
                    {ASPECT_RATIOS.map((r) => (
                      <button
                        key={r}
                        onClick={() => setAspectRatio(r)}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all",
                          aspectRatio === r ? "bg-neutral-800/70 border border-neutral-600/50 text-neutral-100" : "bg-neutral-800/30 text-neutral-500 hover:bg-neutral-800/50 hover:text-neutral-300"
                        )}
                      >{r}<span className="block text-[8px] text-neutral-600">{r.replace(":", "/")}</span></button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] text-neutral-500 font-medium mb-1">Style</label>
                  <select value={style} onChange={(e) => setStyle(e.target.value)} className="w-full bg-neutral-800/50 border border-neutral-700/40 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-neutral-600">
                    {STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Quality + Count */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-neutral-500 font-medium mb-1">Quality</label>
                  <div className="grid grid-cols-4 gap-1">
                    {[["Draft", 1], ["Std", 2], ["High", 4], ["Ultra", 8]].map(([q, c]) => (
                      <button
                        key={q as string}
                        onClick={() => setQuality(q as string)}
                        className={cn(
                          "py-1.5 rounded-lg text-[10px] font-medium transition-all relative",
                          quality === q ? "bg-neutral-800/70 border border-neutral-600/50 text-neutral-100" : "bg-neutral-800/30 text-neutral-500 hover:bg-neutral-800/50"
                        )}
                      >
                        {q as string}
                        <span className="block text-[8px] text-neutral-600">{c as number}cr</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] text-neutral-500 font-medium mb-1">Output Count</label>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setBatchCount(Math.max(1, batchCount - 1))} className="p-1.5 rounded-lg bg-neutral-800/50 border border-neutral-700/40 text-neutral-400 hover:text-neutral-200 transition-colors">−</button>
                    <input type="number" min={1} max={10} value={batchCount} onChange={(e) => setBatchCount(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))} className="flex-1 bg-neutral-800/50 border border-neutral-700/40 rounded-xl px-3 py-2 text-xs text-neutral-100 text-center focus:outline-none focus:border-neutral-600" />
                    <button onClick={() => setBatchCount(Math.min(10, batchCount + 1))} className="p-1.5 rounded-lg bg-neutral-800/50 border border-neutral-700/40 text-neutral-400 hover:text-neutral-200 transition-colors">+</button>
                  </div>
                </div>
              </div>

              {/* Advanced */}
              <div>
                <button onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-300 transition-colors w-full">
                  <Settings2 className="w-3.5 h-3.5" />
                  Advanced Settings
                  <ChevronDown className={cn("w-3 h-3 transition-transform ml-auto", showAdvanced && "rotate-180")} />
                </button>
                <AnimatePresence>
                  {showAdvanced && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="space-y-3 mt-3 pt-3 border-t border-neutral-800/30">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] text-neutral-500 mb-1">Steps: {steps}</label>
                            <input type="range" min={10} max={100} value={steps} onChange={(e) => setSteps(Number(e.target.value))} className="w-full accent-neutral-100" />
                          </div>
                          <div>
                            <label className="block text-[10px] text-neutral-500 mb-1">CFG Scale: {cfg}</label>
                            <input type="range" min={1} max={20} step={0.5} value={cfg} onChange={(e) => setCfg(Number(e.target.value))} className="w-full accent-neutral-100" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] text-neutral-500 mb-1">Seed</label>
                            <div className="flex gap-1">
                              <input type="number" value={seed ?? ""} onChange={(e) => setSeed(e.target.value ? Number(e.target.value) : null)} placeholder="Random" className="flex-1 bg-neutral-800/50 border border-neutral-700/40 rounded-lg px-2.5 py-1.5 text-xs text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-neutral-600" />
                              <button onClick={() => setSeed(Math.floor(Math.random() * 1000000))} className="px-2 rounded-lg bg-neutral-800/50 border border-neutral-700/40 text-neutral-500 hover:text-neutral-300 transition-colors"><RefreshCw className="w-3 h-3" /></button>
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] text-neutral-500 mb-1">Scheduler</label>
                            <select className="w-full bg-neutral-800/50 border border-neutral-700/40 rounded-lg px-2.5 py-1.5 text-xs text-neutral-100 focus:outline-none focus:border-neutral-600">
                              <option>DPM++ 2M Karras</option>
                              <option>Euler A</option>
                              <option>DDIM</option>
                              <option>LMS</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex items-center justify-between py-1.5">
                          <div className="flex items-center gap-2">
                            <Lock className="w-3 h-3 text-neutral-600" />
                            <span className="text-xs text-neutral-500">Private Mode</span>
                          </div>
                          <button
                            onClick={() => setPrivateMode(!privateMode)}
                            className={cn(
                              "w-8 h-4 rounded-full transition-colors relative",
                              privateMode ? "bg-neutral-500" : "bg-neutral-800"
                            )}
                          >
                            <motion.div
                              animate={{ x: privateMode ? 16 : 2 }}
                              className="w-3 h-3 rounded-full bg-neutral-100 absolute top-0.5"
                            />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>

          {/* Generate Button */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="w-full py-3 bg-neutral-100 text-neutral-950 rounded-xl text-sm font-medium hover:bg-neutral-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Generate</>
            )}
          </motion.button>

          {/* Generation progress */}
          {isGenerating && (
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-neutral-800/60 border border-neutral-700/30 flex items-center justify-center">
                  <Cpu className="w-4 h-4 text-neutral-400 animate-pulse" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-neutral-300">Processing with {currentModelLabel}</p>
                    <span className="text-[10px] text-neutral-600">~30s</span>
                  </div>
                  <p className="text-[10px] text-neutral-600 mt-0.5">Enhancing quality, applying style...</p>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                <motion.div
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                  className="h-full w-1/2 rounded-full bg-gradient-to-r from-transparent via-neutral-500/40 to-transparent"
                />
              </div>
            </Card>
          )}
        </div>

        {/* Right Panel - Preview / Gallery */}
        <div className={cn(
          "space-y-4",
          fullscreen ? "col-span-1" : "",
          !panelCollapsed ? "lg:col-span-3" : "lg:col-span-full"
        )}>
          {/* Tabs + Zoom Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 bg-neutral-900/60 border border-neutral-800/30 rounded-xl p-0.5">
              {["preview", "history"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedTab(tab as any)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all capitalize",
                    selectedTab === tab ? "bg-neutral-800/70 text-neutral-100" : "text-neutral-500 hover:text-neutral-300"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
            {selectedTab === "preview" && previewUrl && (
              <div className="flex items-center gap-1">
                <button onClick={() => setZoomLevel(z => Math.max(0.5, z - 0.25))} className="p-1 rounded text-neutral-500 hover:text-neutral-300 transition-colors">
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] text-neutral-500 w-8 text-center">{Math.round(zoomLevel * 100)}%</span>
                <button onClick={() => setZoomLevel(z => Math.min(3, z + 0.25))} className="p-1 rounded text-neutral-500 hover:text-neutral-300 transition-colors">
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Preview Area */}
          {selectedTab === "preview" ? (
            <div
              ref={previewRef}
              className={cn(
                "rounded-2xl border border-neutral-800/30 bg-neutral-900/40 overflow-hidden relative flex items-center justify-center transition-all duration-300",
                fullscreen ? "h-[calc(100vh-120px)]" : "h-[calc(100vh-200px)] min-h-[400px]",
                aspectRatioClass
              )}
              style={previewUrl ? { transform: `scale(${zoomLevel})` } : {}}
            >
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="max-w-full max-h-full object-contain transition-all duration-300" />
              ) : (
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-neutral-800/40 border border-neutral-800/30 flex items-center justify-center mx-auto mb-4">
                    <Wand2 className="w-7 h-7 text-neutral-700" />
                  </div>
                  <p className="text-sm text-neutral-500 mb-1">No preview yet</p>
                  <p className="text-xs text-neutral-600">Your generated images will appear here</p>
                  <div className="flex items-center justify-center gap-1.5 mt-3">
                    {["1:1", "16:9", "4:3", "3:4", "9:16", "21:9"].map((r) => (
                      <span key={r} className={cn("px-2 py-0.5 rounded text-[9px] font-mono transition-colors", aspectRatio === r ? "text-neutral-400 bg-neutral-800/50" : "text-neutral-700")}>{r}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* History Gallery */
            <div className="space-y-3">
              {historyLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="aspect-square rounded-xl" />
                  ))}
                </div>
              ) : generations.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {generations.map((gen: any, i: number) => (
                    <motion.div
                      key={gen.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.025, duration: 0.2 }}
                      className="group relative overflow-hidden rounded-xl border border-neutral-800/30 bg-neutral-900/40 aspect-square hover:border-neutral-700/50 transition-all"
                    >
                      {gen.outputUrls?.[0] || gen.thumbnailUrl ? (
                        <>
                          <img src={gen.thumbnailUrl || gen.outputUrls[0]} alt={gen.prompt} className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="absolute bottom-0 left-0 right-0 p-2.5 translate-y-2 group-hover:translate-y-0 transition-transform duration-200">
                            <p className="text-[10px] text-neutral-300 truncate">{gen.prompt}</p>
                          </div>
                          <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setPreviewUrl(gen.outputUrls[0]); setSelectedTab("preview"); }} className="p-1.5 rounded-lg bg-black/50 backdrop-blur-sm text-neutral-300 hover:text-neutral-100 transition-colors"><Eye className="w-3 h-3" /></button>
                            <a href={gen.outputUrls[0]} download className="p-1.5 rounded-lg bg-black/50 backdrop-blur-sm text-neutral-300 hover:text-neutral-100 transition-colors"><Download className="w-3 h-3" /></a>
                          </div>
                          {/* Type badge */}
                          <div className="absolute top-1.5 left-1.5">
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-medium bg-black/40 backdrop-blur-sm text-neutral-300 border border-neutral-700/30">
                              {gen.type}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 bg-neutral-900/60 p-3">
                          <Badge variant={gen.status === "COMPLETED" ? "success" : gen.status === "FAILED" ? "danger" : "warning"}>{gen.status || "PENDING"}</Badge>
                          <p className="text-[10px] text-neutral-600 text-center line-clamp-2">{gen.prompt}</p>
                        </div>
                      )}
                      <div className="absolute bottom-1.5 left-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => favoriteMutation.mutate(gen.id)} className={cn("p-1 rounded-lg bg-black/50 backdrop-blur-sm transition-colors", gen.favorite ? "text-red-400" : "text-neutral-300 hover:text-red-400")}>
                          <Heart className="w-2.5 h-2.5" fill={gen.favorite ? "currentColor" : "none"} />
                        </button>
                        <button onClick={() => deleteMutation.mutate(gen.id)} className="p-1 rounded-lg bg-black/50 backdrop-blur-sm text-neutral-300 hover:text-red-400 transition-colors">
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-neutral-800/20 bg-neutral-900/20 flex flex-col items-center justify-center py-20">
                  <Image className="w-10 h-10 text-neutral-700 mb-3" />
                  <p className="text-sm text-neutral-500 mb-1">No generations yet</p>
                  <p className="text-xs text-neutral-600">Your creations will appear here</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setPreviewUrl(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-5xl w-full max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setPreviewUrl(null)}><X className="w-3.5 h-3.5" /></Button>
                  <span className="text-xs text-neutral-400">Preview</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button variant="ghost" size="sm"><Heart className="w-3 h-3" /></Button>
                  <Button variant="secondary" size="sm"><Download className="w-3 h-3" /> Download</Button>
                  <Button variant="ghost" size="sm" onClick={() => setFullscreen(!fullscreen)}>
                    {fullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </div>
              <div className="rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800 shadow-2xl">
                <img src={previewUrl} alt="Preview" className="w-full h-auto max-h-[75vh] object-contain" />
              </div>
              <div className="flex items-center justify-between mt-2 text-[10px] text-neutral-600">
                <span>DALL·E 3 · HD · 1:1</span>
                <span>Click outside to close</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}

export default function GeneratePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-[80vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
          <p className="text-xs text-neutral-500">Loading workspace...</p>
        </div>
      </div>
    }>
      <GenerateContent />
    </Suspense>
  );
}
