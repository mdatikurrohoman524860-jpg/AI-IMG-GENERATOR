"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { forwardRef, type ButtonHTMLAttributes, type HTMLAttributes } from "react";

export function Card({
  className,
  children,
  hover = false,
  ...props
}: HTMLAttributes<HTMLDivElement> & { hover?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-neutral-800/30 bg-neutral-900/40",
        hover && "transition-all duration-300 hover:bg-neutral-900/60 hover:border-neutral-700/50 hover:shadow-[0_0_30px_-12px_rgba(255,255,255,0.05)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 pt-5 pb-3", className)} {...props}>{children}</div>;
}

export function CardContent({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 py-3", className)} {...props}>{children}</div>;
}

export function CardFooter({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 pb-5 pt-3", className)} {...props}>{children}</div>;
}

export function Badge({
  className,
  variant = "default",
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "success" | "warning" | "danger" | "premium" | "outline";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium tracking-wide",
        variant === "default" && "bg-neutral-800/60 text-neutral-400 border border-neutral-700/30",
        variant === "success" && "bg-emerald-500/8 text-emerald-400 border border-emerald-500/15",
        variant === "warning" && "bg-amber-500/8 text-amber-400 border border-amber-500/15",
        variant === "danger" && "bg-red-500/8 text-red-400 border border-red-500/15",
        variant === "premium" && "bg-neutral-100 text-neutral-950",
        variant === "outline" && "bg-transparent text-neutral-500 border border-neutral-700/40",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl bg-neutral-800/40 animate-pulse",
        className
      )}
      {...props}
    />
  );
}

export function SectionHeader({
  title,
  action,
  className,
}: {
  title: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between mb-4", className)}>
      <div className="flex items-center gap-2.5">
        <div className="w-0.5 h-4 rounded-full bg-neutral-700/60" />
        <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-400">{title}</h3>
      </div>
      {action && <div className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors">{action}</div>}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-12 h-12 rounded-2xl border border-neutral-800/30 bg-neutral-900/40 flex items-center justify-center mb-4">
        <Icon className="w-5 h-5 text-neutral-600" />
      </div>
      <p className="text-sm font-medium text-neutral-400 mb-1">{title}</p>
      {description && <p className="text-xs text-neutral-600 mb-4 text-center max-w-xs">{description}</p>}
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  sublabel,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: { value: string; positive?: boolean };
  sublabel?: string;
}) {
  return (
    <Card hover className="p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="w-8 h-8 rounded-xl bg-neutral-800/60 border border-neutral-700/30 flex items-center justify-center">
          <Icon className="w-3.5 h-3.5 text-neutral-400" />
        </div>
        {trend && (
          <span className={cn(
            "text-[10px] font-medium px-1.5 py-0.5 rounded-md",
            trend.positive ? "text-emerald-400 bg-emerald-500/8" : "text-neutral-500 bg-neutral-800/40"
          )}>
            {trend.value}
          </span>
        )}
      </div>
      <p className="text-lg font-semibold tracking-tight text-neutral-100">{value}</p>
      <p className="text-xs text-neutral-500 mt-0.5">{label}</p>
      {sublabel && <p className="text-[10px] text-neutral-600 mt-1">{sublabel}</p>}
    </Card>
  );
}

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "ghost" | "danger";
    size?: "sm" | "md" | "lg";
  }
>(({ className, variant = "primary", size = "md", children, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 font-medium transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none",
        size === "sm" && "px-3 py-1.5 rounded-lg text-xs",
        size === "md" && "px-4 py-2 rounded-xl text-sm",
        size === "lg" && "px-5 py-2.5 rounded-xl text-sm",
        variant === "primary" && "bg-neutral-100 text-neutral-950 hover:bg-neutral-200 active:scale-[0.98]",
        variant === "secondary" && "bg-neutral-800/60 text-neutral-300 border border-neutral-700/40 hover:bg-neutral-800 hover:text-neutral-100",
        variant === "ghost" && "text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800/40",
        variant === "danger" && "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});
Button.displayName = "Button";

export function Divider({ className }: { className?: string }) {
  return <div className={cn("h-px bg-gradient-to-r from-transparent via-neutral-800/50 to-transparent", className)} />;
}

export function Kbd({ children }: { children: string }) {
  return (
    <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-neutral-800/80 text-[10px] text-neutral-500 border border-neutral-700/40 font-mono">
      {children}
    </kbd>
  );
}

export function PageTransition({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
