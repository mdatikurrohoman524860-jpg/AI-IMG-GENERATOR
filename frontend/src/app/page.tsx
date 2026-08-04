"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import { Sparkles, Image, Video, Palette, Shapes, PenTool, Monitor, Check, Star, ChevronDown, Menu, X, ArrowRight, Zap, Shield, Lock, CreditCard, HeadphonesIcon, RefreshCw, Download, Users, Sliders, Globe, Infinity, Layers, Wand2, ChevronLeft, ChevronRight, Play, Pause } from "lucide-react";

const FEATURES_LIST = [
  { icon: Sparkles, title: "Multiple AI Models", description: "GPT-4, DALL·E 3, SDXL, Midjourney V6 & more", gradient: "from-blue-500/10 to-purple-500/10" },
  { icon: Image, title: "High-Resolution Output", description: "Export up to 4K with exceptional detail", gradient: "from-emerald-500/10 to-teal-500/10" },
  { icon: Video, title: "Video Generation", description: "Create stunning AI videos in seconds", gradient: "from-orange-500/10 to-rose-500/10" },
  { icon: Palette, title: "All Creative Assets", description: "Images, logos, icons, illustrations & more", gradient: "from-violet-500/10 to-pink-500/10" },
  { icon: Check, title: "Commercial License", description: "Full commercial rights included", gradient: "from-amber-500/10 to-yellow-500/10" },
  { icon: Monitor, title: "Batch Generation", description: "Generate hundreds of variations at once", gradient: "from-cyan-500/10 to-sky-500/10" },
];

const GENERATION_TYPES = [
  "Image", "Video", "Logo", "Icon", "Illustration", "Wallpaper",
  "Banner", "Avatar", "Mockup", "Sticker", "Thumbnail", "Background",
];

const SHOWCASE_ITEMS = [
  { title: "Mountain Landscape", style: "Cinematic", model: "DALL·E 3", gradient: "from-neutral-700 to-neutral-900" },
  { title: "Urban Architecture", style: "Minimalist", model: "SDXL", gradient: "from-neutral-600 to-neutral-800" },
  { title: "Abstract Art", style: "Vaporwave", model: "Midjourney V6", gradient: "from-neutral-500 to-neutral-800" },
  { title: "Tech Brand Logo", style: "Geometric", model: "DALL·E 3", gradient: "from-neutral-700 to-neutral-950" },
  { title: "App Icon Set", style: "Flat Design", model: "SDXL", gradient: "from-neutral-600 to-neutral-900" },
  { title: "Product Mockup", style: "Studio", model: "Midjourney V6", gradient: "from-neutral-500 to-neutral-850" },
  { title: "Fantasy Landscape", style: "Epic", model: "DALL·E 3", gradient: "from-neutral-800 to-neutral-950" },
  { title: "Character Design", style: "Anime", model: "SDXL", gradient: "from-neutral-600 to-neutral-850" },
];

const PRICING_PLANS = [
  {
    name: "Free", icon: Sparkles, desc: "Get started with essential AI tools",
    monthlyPrice: "$0", yearlyPrice: "$0", credits: "50",
    features: ["10 generations/mo", "Standard quality", "Basic styles", "PNG export", "Community access"],
    gradient: "from-neutral-800/40 to-neutral-900/40",
  },
  {
    name: "Pro", icon: Zap, desc: "For professionals who need more power",
    monthlyPrice: "$29", yearlyPrice: "$23", credits: "500",
    popular: true,
    features: ["500 generations/mo", "All quality levels", "All styles", "Commercial license", "API access", "Priority support", "HD export"],
    gradient: "from-neutral-700/60 to-neutral-800/60",
  },
  {
    name: "Studio", icon: Layers, desc: "For teams scaling their creative output",
    monthlyPrice: "$99", yearlyPrice: "$79", credits: "3,000",
    features: ["3,000 generations/mo", "Ultra quality", "Custom styles", "Team workspace", "API + Analytics", "Batch processing", "Dedicated support"],
    gradient: "from-neutral-800/40 to-neutral-900/40",
  },
  {
    name: "Enterprise", icon: Shield, desc: "Custom solutions for large organizations",
    monthlyPrice: "Custom", yearlyPrice: "Custom", credits: "∞",
    features: ["Unlimited generations", "Everything in Studio", "Dedicated support", "Custom integration", "SLA guarantee", "On-premise option", "SSO & audit logs"],
    gradient: "from-neutral-800/40 to-neutral-900/40",
  },
];

const TRUST_FEATURES = [
  { icon: Lock, title: "Enterprise Security", desc: "SOC 2 Type II certified with end-to-end encryption" },
  { icon: RefreshCw, title: "Lightning Fast", desc: "Generate in seconds with distributed GPU clusters" },
  { icon: CreditCard, title: "Secure Payments", desc: "PCI-compliant, encrypted billing via Stripe" },
  { icon: HeadphonesIcon, title: "24/7 Premium Support", desc: "Dedicated account managers & priority queue" },
];

const TESTIMONIALS_DATA = [
  { name: "Sarah Chen", role: "Creative Director", content: "This platform has completely transformed our creative workflow. The quality is outstanding.", rating: 5, initials: "SC" },
  { name: "Marcus Johnson", role: "Founder & CEO", content: "The best AI generation platform we have used. Unmatched control over styles and quality.", rating: 5, initials: "MJ" },
  { name: "Emily Rodriguez", role: "Marketing Lead", content: "We generate all our marketing assets here. The commercial license is worth every penny.", rating: 5, initials: "ER" },
  { name: "David Kim", role: "Product Designer", content: "Incredible speed and quality. Our design team's productivity has tripled.", rating: 5, initials: "DK" },
];

const FAQ_DATA = [
  { q: "What types of assets can I generate?", a: "Images, videos, logos, icons, illustrations, avatars, wallpapers, thumbnails, mockups, and more — all powered by cutting-edge AI models." },
  { q: "How does the credit system work?", a: "Each generation consumes credits based on quality level. Draft uses 1, Standard uses 2, High uses 4, and Ultra uses 8 credits per generation." },
  { q: "Can I use generated assets commercially?", a: "Absolutely! All paid plans include full commercial rights to all assets you generate. Free plan assets are for personal use only." },
  { q: "Which AI models are available?", a: "We support GPT-4 Turbo, DALL·E 3, Stable Diffusion XL, Midjourney V6, and Claude 3. New models are added regularly." },
  { q: "How long does generation take?", a: "Most image generations complete in 2-10 seconds. Video generations typically take 30-60 seconds depending on complexity." },
];

const TECH_LOGOS = ["GPT-4 Turbo", "DALL·E 3", "SDXL", "Midjourney V6", "Claude 3", "Stability AI", "OpenAI", "Replicate"];

function useMousePosition() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, [x, y]);

  return { x, y };
}

function ParallaxCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { x, y } = useMousePosition();
  const [center, setCenter] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setCenter({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
  }, []);

  const rotateX = useTransform(y, [center.y - 300, center.y + 300], [3, -3]);
  const rotateY = useTransform(x, [center.x - 300, center.x + 300], [-3, 3]);
  const springX = useSpring(rotateX, { stiffness: 100, damping: 30 });
  const springY = useSpring(rotateY, { stiffness: 100, damping: 30 });

  return (
    <motion.div
      ref={ref}
      style={{ perspective: 800, rotateX: springX, rotateY: springY }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function ShowcaseCarousel() {
  const [current, setCurrent] = useState(0);
  const [autoplay, setAutoplay] = useState(true);

  useEffect(() => {
    if (!autoplay) return;
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % SHOWCASE_ITEMS.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [autoplay]);

  const next = useCallback(() => setCurrent((c) => (c + 1) % SHOWCASE_ITEMS.length), []);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + SHOWCASE_ITEMS.length) % SHOWCASE_ITEMS.length), []);

  return (
    <div className="relative group">
      <div className="overflow-hidden rounded-2xl border border-neutral-800/50 bg-neutral-900/80 backdrop-blur-xl">
        <div className="relative aspect-[16/9] md:aspect-[21/9]">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
              className={`absolute inset-0 bg-gradient-to-br ${SHOWCASE_ITEMS[current].gradient} flex items-center justify-center`}
            >
              <div className="text-center p-8">
                <div className="w-16 h-16 rounded-2xl bg-neutral-900/40 backdrop-blur-sm border border-neutral-700/30 flex items-center justify-center mx-auto mb-4">
                  <Image className="w-7 h-7 text-neutral-300" />
                </div>
                <p className="text-xl md:text-2xl font-semibold text-neutral-100 mb-2">{SHOWCASE_ITEMS[current].title}</p>
                <div className="flex items-center justify-center gap-3">
                  <span className="px-3 py-1 rounded-full bg-neutral-800/60 text-[11px] text-neutral-400 border border-neutral-700/30">{SHOWCASE_ITEMS[current].style}</span>
                  <span className="px-3 py-1 rounded-full bg-neutral-800/60 text-[11px] text-neutral-400 border border-neutral-700/30">{SHOWCASE_ITEMS[current].model}</span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/60 via-transparent to-transparent pointer-events-none" />

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
            {SHOWCASE_ITEMS.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)} className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === current ? "bg-neutral-100 w-4" : "bg-neutral-700 hover:bg-neutral-500"}`} />
            ))}
          </div>

          <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => setAutoplay(!autoplay)} className="p-1.5 rounded-lg bg-black/50 backdrop-blur-sm text-neutral-300 hover:text-neutral-100 transition-colors">
              {autoplay ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-800/30">
          <div className="flex items-center gap-2">
            <button onClick={prev} className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-neutral-500">{current + 1} / {SHOWCASE_ITEMS.length}</span>
            <button onClick={next} className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-neutral-600">
            <span className="hidden sm:inline">Use arrow keys to navigate</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function FloatingOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-1/4 -left-32 w-64 h-64 bg-neutral-800/10 rounded-full blur-[100px] animate-float" />
      <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-neutral-700/10 rounded-full blur-[120px] animate-float" style={{ animationDelay: "-3s" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-neutral-800/5 rounded-full blur-[150px] animate-pulse-glow" />
    </div>
  );
}

function InteractiveDemo() {
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setResult(prompt);
    }, 2000);
  };

  return (
    <div className="rounded-2xl border border-neutral-800/30 bg-neutral-900/40 backdrop-blur-xl overflow-hidden">
      <div className="p-4 md:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-neutral-400" />
          <span className="text-xs font-medium text-neutral-400">Try it yourself</span>
        </div>
        <div className="flex gap-2">
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe what you want to create..."
            className="flex-1 bg-neutral-800/50 border border-neutral-700/40 rounded-xl px-4 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-neutral-600 transition-all"
            onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
          />
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || generating}
            className="px-4 py-2.5 rounded-xl bg-neutral-100 text-neutral-950 text-sm font-medium hover:bg-neutral-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {generating ? (
              <><div className="w-3.5 h-3.5 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" /> Go</>
            ) : (
              <><Sparkles className="w-3.5 h-3.5" /> Go</>
            )}
          </button>
        </div>
        {generating && (
          <div className="h-24 rounded-xl bg-neutral-800/30 border border-neutral-800/30 flex items-center justify-center">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-neutral-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-neutral-500">Creating your masterpiece...</span>
            </div>
          </div>
        )}
        {result && !generating && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-24 rounded-xl bg-gradient-to-br from-neutral-800/50 to-neutral-900/50 border border-neutral-800/30 flex items-center justify-center"
          >
            <div className="text-center">
              <div className="w-10 h-10 rounded-xl bg-neutral-800/60 border border-neutral-700/30 flex items-center justify-center mx-auto mb-1.5">
                <Image className="w-5 h-5 text-neutral-400" />
              </div>
              <p className="text-xs text-neutral-500">&ldquo;{result.slice(0, 40)}{result.length > 40 ? "..." : ""}&rdquo;</p>
              <p className="text-[10px] text-neutral-600 mt-0.5">Generated with DALL·E 3</p>
            </div>
          </motion.div>
        )}
        {!result && !generating && (
          <div className="h-24 rounded-xl bg-neutral-800/20 border border-dashed border-neutral-800/30 flex items-center justify-center">
            <p className="text-xs text-neutral-600">Your generated preview will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ScrollReveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </motion.div>
  );
}

export default function LandingPage() {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [annual, setAnnual] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "Showcase", href: "#showcase" },
    { label: "FAQ", href: "#faq" },
  ];

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial((c) => (c + 1) % TESTIMONIALS_DATA.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 selection:bg-neutral-700/40">
      {/* Grain overlay */}
      <div className="fixed inset-0 z-50 pointer-events-none opacity-[0.03]">
        <div className="w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJmIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iLjc0IiBudW1PY3RhdmVzPSIzIiAvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNmKSIgb3BhY2l0eT0iMCIgLz48L3N2Zz4=')] bg-repeat animate-grain" />
      </div>

      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-800/50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-neutral-100 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4 text-neutral-950" />
            </div>
            <span className="font-semibold text-lg tracking-tight">Intellix</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="text-sm text-neutral-400 hover:text-neutral-100 transition-colors relative group/link">
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-neutral-400 group-hover/link:w-full transition-all duration-300" />
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <Link href="/dashboard" className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-100 text-neutral-950 rounded-xl text-sm font-medium hover:bg-neutral-200 transition-all active:scale-[0.97]">
                Dashboard <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link href="/auth/login" className="text-sm text-neutral-400 hover:text-neutral-100 transition-colors px-3 py-2">Sign In</Link>
                <Link href="/auth/register" className="inline-flex items-center px-5 py-2.5 bg-neutral-100 text-neutral-950 rounded-xl text-sm font-medium hover:bg-neutral-200 transition-all active:scale-[0.97]">
                  Get Started
                </Link>
              </>
            )}
          </div>

          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-neutral-400 hover:text-neutral-100 transition-colors">
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </nav>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-neutral-800/50 bg-neutral-950/95 backdrop-blur-xl overflow-hidden"
            >
              <div className="px-4 py-6 space-y-4">
                {navLinks.map((link) => (
                  <a key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)} className="block text-sm text-neutral-400 hover:text-neutral-100 py-2 transition-colors">{link.label}</a>
                ))}
                {user ? (
                  <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="block text-center py-2.5 bg-neutral-100 text-neutral-950 rounded-xl text-sm font-medium">Dashboard</Link>
                ) : (
                  <div className="flex flex-col gap-3 pt-4 border-t border-neutral-800/50">
                    <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)} className="text-center text-sm text-neutral-400 hover:text-neutral-100 py-2">Sign In</Link>
                    <Link href="/auth/register" onClick={() => setMobileMenuOpen(false)} className="text-center py-2.5 bg-neutral-100 text-neutral-950 rounded-xl text-sm font-medium">Get Started</Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main>
        {/* Hero */}
        <section className="relative min-h-screen flex items-center pt-24 pb-16 overflow-hidden">
          <FloatingOrbs />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
            <div className="text-center max-w-4xl mx-auto mb-12 space-y-8">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neutral-800/40 border border-neutral-700/30"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
                <span className="text-xs font-medium text-neutral-300">Next-Gen AI Creation Platform</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] text-balance"
              >
                <span className="text-neutral-100">Create stunning</span><br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-neutral-200 to-neutral-500">AI assets</span>{' '}
                <span className="text-neutral-100">in seconds</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto leading-relaxed"
              >
                Generate premium images, videos, logos, icons, and more with the world&apos;s most advanced AI platform.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex items-center justify-center gap-4 pt-2"
              >
                {user ? (
                  <Link href="/generate" className="group inline-flex items-center gap-2 px-7 py-3.5 bg-neutral-100 text-neutral-950 rounded-xl font-medium hover:bg-neutral-200 transition-all active:scale-[0.97]">
                    Start Creating <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                ) : (
                  <>
                    <Link href="/auth/register" className="group inline-flex items-center gap-2 px-7 py-3.5 bg-neutral-100 text-neutral-950 rounded-xl font-medium hover:bg-neutral-200 transition-all active:scale-[0.97]">
                      Start Free <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                    <a href="#showcase" className="inline-flex items-center gap-2 px-7 py-3.5 border border-neutral-700 text-neutral-300 rounded-xl font-medium hover:bg-neutral-800/50 transition-all active:scale-[0.97]">
                      See Examples
                    </a>
                  </>
                )}
              </motion.div>
            </div>

            {/* Type badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-wrap justify-center gap-2 max-w-3xl mx-auto"
            >
              {GENERATION_TYPES.map((type, i) => (
                <motion.span
                  key={type}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.03 }}
                  className="px-3 py-1.5 rounded-lg bg-neutral-800/30 border border-neutral-800/30 text-xs font-medium text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-300 hover:border-neutral-700/40 transition-all cursor-default"
                >
                  {type}
                </motion.span>
              ))}
            </motion.div>

            {/* Tech marquee */}
            <div className="mt-12 overflow-hidden">
              <div className="flex gap-8 animate-marquee" style={{ width: `${TECH_LOGOS.length * 2 * 120}px` }}>
                {[...TECH_LOGOS, ...TECH_LOGOS].map((logo, i) => (
                  <span key={i} className="text-xs text-neutral-600 font-mono hover:text-neutral-400 transition-colors shrink-0">{logo}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Demo */}
        <section className="py-16 md:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <InteractiveDemo />
            </ScrollReveal>
          </div>
        </section>

        {/* Showcase Carousel */}
        <section id="showcase" className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <div className="text-center mb-12">
                <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500 mb-4">Showcase</p>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">See what&apos;s possible</h2>
                <p className="text-lg text-neutral-400 max-w-2xl mx-auto mt-4">Explore stunning creations generated by our community.</p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <ShowcaseCarousel />
            </ScrollReveal>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-16 md:py-24 bg-neutral-900/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <div className="text-center mb-14">
                <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500 mb-4">Features</p>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">Everything you need</h2>
                <p className="text-lg text-neutral-400 max-w-2xl mx-auto mt-4">A comprehensive creative suite powered by cutting-edge AI.</p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {FEATURES_LIST.map((feature, i) => (
                <ScrollReveal key={i} delay={i * 0.05}>
                  <ParallaxCard>
                    <div className={`p-5 rounded-2xl border border-neutral-800/50 bg-gradient-to-br ${feature.gradient} backdrop-blur-xl transition-all duration-300 hover:bg-neutral-800/70 hover:border-neutral-700/80 group h-full`}>
                      <div className="w-10 h-10 rounded-xl bg-neutral-800/60 border border-neutral-700/30 flex items-center justify-center text-neutral-400 mb-4 group-hover:text-neutral-100 group-hover:border-neutral-600 transition-all">
                        <feature.icon className="w-5 h-5" />
                      </div>
                      <h3 className="text-sm font-semibold text-neutral-200 mb-1.5">{feature.title}</h3>
                      <p className="text-xs text-neutral-500 leading-relaxed">{feature.description}</p>
                    </div>
                  </ParallaxCard>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials - Compact Rotating */}
        <section className="py-16 md:py-24">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <div className="text-center mb-12">
                <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500 mb-4">Testimonials</p>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">Loved by creators</h2>
                <p className="text-lg text-neutral-400 max-w-2xl mx-auto mt-4">Join thousands of happy users worldwide.</p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.1}>
              <div className="relative h-48">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTestimonial}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <div className="text-center max-w-lg mx-auto">
                      <div className="flex items-center justify-center gap-0.5 mb-4">
                        {Array.from({ length: TESTIMONIALS_DATA[activeTestimonial].rating }).map((_, j) => (
                          <Star key={j} className="w-4 h-4 fill-neutral-400 text-neutral-400" />
                        ))}
                      </div>
                      <p className="text-base text-neutral-300 leading-relaxed">&ldquo;{TESTIMONIALS_DATA[activeTestimonial].content}&rdquo;</p>
                      <div className="flex items-center justify-center gap-3 mt-5">
                        <div className="w-9 h-9 rounded-full bg-neutral-700 flex items-center justify-center text-xs font-medium text-neutral-200">
                          {TESTIMONIALS_DATA[activeTestimonial].initials}
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-neutral-200">{TESTIMONIALS_DATA[activeTestimonial].name}</p>
                          <p className="text-xs text-neutral-500">{TESTIMONIALS_DATA[activeTestimonial].role}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>

                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                  {TESTIMONIALS_DATA.map((_, i) => (
                    <button key={i} onClick={() => setActiveTestimonial(i)} className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === activeTestimonial ? "bg-neutral-100 w-4" : "bg-neutral-700 hover:bg-neutral-500"}`} />
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="relative py-16 md:py-24 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.03)_0%,transparent_60%)] pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(255,255,255,0.015)_0%,transparent_50%)] pointer-events-none" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <div className="text-center mb-12">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500 mb-4">Pricing</p>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-neutral-100">Simple, transparent pricing</h2>
                <p className="text-base text-neutral-400 max-w-2xl mx-auto mt-4 leading-relaxed">Choose the plan that fits your needs. Upgrade or cancel anytime.</p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.1}>
              <div className="flex items-center justify-center gap-4 mb-12">
                <div className="inline-flex items-center bg-neutral-900/80 border border-neutral-800/60 rounded-xl p-1 backdrop-blur-sm">
                  <button onClick={() => setAnnual(false)} className={`relative px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${!annual ? 'bg-neutral-100 text-neutral-950 shadow-sm' : 'text-neutral-400 hover:text-neutral-200'}`}>Monthly</button>
                  <button onClick={() => setAnnual(true)} className={`relative px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${annual ? 'bg-neutral-100 text-neutral-950 shadow-sm' : 'text-neutral-400 hover:text-neutral-200'}`}>Yearly</button>
                </div>
                <AnimatePresence>
                  {annual && (
                    <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                      </span>
                      Save 20%
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
              {PRICING_PLANS.map((plan, i) => (
                <ScrollReveal key={i} delay={i * 0.08}>
                  <motion.div
                    whileHover={{ y: -6 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className={`relative flex flex-col rounded-2xl border transition-all duration-300 group ${
                      plan.popular
                        ? 'border-neutral-600/60 bg-neutral-900/80 shadow-[0_0_40px_-12px_rgba(255,255,255,0.1)] scale-[1.02] z-10'
                        : 'border-neutral-800/50 bg-neutral-900/60 shadow-sm'
                    } backdrop-blur-xl hover:shadow-lg h-full`}
                  >
                    {plan.popular && (
                      <>
                        <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.06)_0%,transparent_60%)] pointer-events-none" />
                        <motion.span
                          initial={{ y: -10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-neutral-100 text-neutral-950 rounded-lg text-xs font-semibold tracking-wide shadow-sm"
                        >
                          Most Popular
                        </motion.span>
                      </>
                    )}
                    <div className="flex flex-col h-full p-7">
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                          plan.popular ? 'bg-neutral-100 text-neutral-950' : 'bg-neutral-800/60 border border-neutral-700/30 text-neutral-400 group-hover:text-neutral-200 group-hover:border-neutral-600'
                        }`}>
                          <plan.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-neutral-100">{plan.name}</h3>
                          <p className="text-xs text-neutral-500 mt-0.5">{plan.desc}</p>
                        </div>
                      </div>

                      <div className="mb-5">
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-bold tracking-tight text-neutral-100">{annual && plan.yearlyPrice !== "Custom" ? plan.yearlyPrice : plan.monthlyPrice}</span>
                          {plan.monthlyPrice !== "Custom" && (
                            <span className="text-sm text-neutral-500 font-medium">/mo</span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-500 mt-1.5"><span className="text-neutral-400 font-medium">{plan.credits}</span> credits per month</p>
                      </div>

                      <div className="w-full h-px bg-gradient-to-r from-transparent via-neutral-700/50 to-transparent mb-5" />

                      <ul className="space-y-3 flex-1 mb-6">
                        {plan.features.map((f, j) => (
                          <motion.li
                            key={j}
                            initial={{ opacity: 0, x: -10 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ delay: j * 0.05 }}
                            className="flex items-start gap-3 text-sm text-neutral-400 leading-snug"
                          >
                            <Check className="w-4 h-4 text-neutral-500 mt-0.5 shrink-0 group-hover:text-neutral-400 transition-colors duration-200" />
                            <span>{f}</span>
                          </motion.li>
                        ))}
                      </ul>

                      <div className="mt-auto">
                        {plan.name === "Enterprise" ? (
                          <Link href={user ? "/billing" : "/auth/register"} className="group/btn relative w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-medium border border-neutral-700/60 text-neutral-300 bg-neutral-800/30 hover:bg-neutral-800/60 hover:text-neutral-100 hover:border-neutral-600 transition-all duration-200 active:scale-[0.98] overflow-hidden">
                            <span className="relative z-10">Contact Sales</span>
                          </Link>
                        ) : plan.name === "Free" ? (
                          <Link href={user ? "/dashboard" : "/auth/register"} className="group/btn relative w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-medium border border-neutral-700/40 text-neutral-300 bg-transparent hover:bg-neutral-800/40 hover:text-neutral-100 hover:border-neutral-600 transition-all duration-200 active:scale-[0.98] overflow-hidden">
                            <span className="relative z-10">Get Started Free</span>
                          </Link>
                        ) : (
                          <Link href={user ? "/billing" : "/auth/register"} className="group/btn relative w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-medium bg-neutral-100 text-neutral-950 hover:bg-neutral-200 transition-all duration-200 active:scale-[0.98] shadow-sm hover:shadow-md overflow-hidden">
                            <span className="relative z-10">Subscribe</span>
                            <ArrowRight className="w-3.5 h-3.5 relative z-10 transition-transform duration-200 group-hover/btn:translate-x-0.5" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </ScrollReveal>
              ))}
            </div>

            {/* Trust Section */}
            <ScrollReveal delay={0.3}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-6xl mx-auto mt-12">
                {TRUST_FEATURES.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 rounded-xl border border-neutral-800/30 bg-neutral-900/40 backdrop-blur-sm transition-all duration-200 hover:bg-neutral-900/60 hover:border-neutral-700/50 group">
                    <div className="w-9 h-9 rounded-lg bg-neutral-800/50 border border-neutral-700/30 flex items-center justify-center shrink-0 text-neutral-400 group-hover:text-neutral-200 transition-colors">
                      <item.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-200">{item.title}</p>
                      <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-16 md:py-24 bg-neutral-900/20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <div className="text-center mb-14">
                <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500 mb-4">FAQ</p>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">Frequently asked questions</h2>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.1}>
              <div className="divide-y divide-neutral-800/50 border border-neutral-800/50 rounded-2xl overflow-hidden">
                {FAQ_DATA.map((item, i) => (
                  <div key={i} className="group">
                    <button onClick={() => setFaqOpen(faqOpen === i ? null : i)} className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-neutral-800/30">
                      <span className="text-sm font-medium text-neutral-200">{item.q}</span>
                      <motion.div animate={{ rotate: faqOpen === i ? 180 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronDown className="w-4 h-4 text-neutral-500 shrink-0" />
                      </motion.div>
                    </button>
                    <AnimatePresence>
                      {faqOpen === i && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <p className="px-6 pb-5 text-sm text-neutral-400 leading-relaxed">{item.a}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 md:py-28">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <ScrollReveal>
              <div className="relative rounded-3xl border border-neutral-800/50 bg-gradient-to-b from-neutral-900/80 to-neutral-950/80 backdrop-blur-xl p-10 md:p-16 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.03)_0%,transparent_60%)] pointer-events-none" />
                <div className="relative">
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">Ready to create?</h2>
                  <p className="text-lg text-neutral-400 max-w-xl mx-auto mb-8">Join thousands of creators already using Intellix to bring their ideas to life.</p>
                  {user ? (
                    <Link href="/generate" className="inline-flex items-center gap-2 px-8 py-3.5 bg-neutral-100 text-neutral-950 rounded-xl font-medium hover:bg-neutral-200 transition-all active:scale-[0.97] text-lg">
                      Start Creating <ArrowRight className="w-5 h-5" />
                    </Link>
                  ) : (
                    <Link href="/auth/register" className="inline-flex items-center gap-2 px-8 py-3.5 bg-neutral-100 text-neutral-950 rounded-xl font-medium hover:bg-neutral-200 transition-all active:scale-[0.97] text-lg">
                      Get Started Free <ArrowRight className="w-5 h-5" />
                    </Link>
                  )}
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-12">
            <div className="col-span-2">
              <Link href="/" className="flex items-center gap-2.5 mb-4 group">
                <div className="w-8 h-8 rounded-xl bg-neutral-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Sparkles className="w-4 h-4 text-neutral-950" />
                </div>
                <span className="font-semibold text-lg tracking-tight text-neutral-100">Intellix</span>
              </Link>
              <p className="text-sm text-neutral-500 max-w-xs leading-relaxed">Premium AI generation platform for creators, designers, and teams.</p>
            </div>
            {[
              { title: "Product", links: ["Features", "Pricing", "API", "Documentation", "Changelog"] },
              { title: "Company", links: ["Blog", "Careers", "Community", "Contact"] },
              { title: "Legal", links: ["Privacy Policy", "Terms of Service"] },
            ].map((group) => (
              <div key={group.title}>
                <h4 className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-4">{group.title}</h4>
                <ul className="space-y-3">
                  {group.links.map((link) => (
                    <li key={link}><a href="#" className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors">{link}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-16 pt-8 border-t border-neutral-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-neutral-600">&copy; {new Date().getFullYear()} Intellix. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors">Privacy</a>
              <a href="#" className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
