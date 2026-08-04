"use client";

import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import {
  Shield, Key, Lock, CreditCard,
  Loader2, Mail, Check,
} from "lucide-react";
import { Card, CardHeader, CardContent, Badge, SectionHeader, Button, PageTransition } from "@/components/ui/primitives";

const COMING_SOON = [
  { icon: Key, title: "API Keys", desc: "Create API tokens for programmatic access" },
  { icon: Shield, title: "Sessions", desc: "Manage devices and active sessions" },
  { icon: Lock, title: "Security", desc: "Change password and 2FA (coming soon)" },
  { icon: CreditCard, title: "Billing & Subscription", desc: "Manage plans and cards" },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  const { data: usageData } = useQuery({
    queryKey: ["usage"],
    queryFn: () => api.getUsage(),
    enabled: !!user,
  });

  const usage = usageData?.data as any;
  const initials = user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U";
  const usedPercent = usage?.quota > 0 ? Math.min(100, Math.round(((usage?.usedToday ?? 0) / usage.quota) * 100)) : 0;

  return (
    <PageTransition className="max-w-[720px] mx-auto space-y-6">
      <SectionHeader title="Settings" />

      {/* Profile */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardHeader>
            <span className="text-sm font-medium text-neutral-200">Profile</span>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-neutral-800 border border-neutral-700/30 flex items-center justify-center text-lg font-bold text-neutral-200 shrink-0">
                {user?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.image} alt="avatar" className="w-full h-full rounded-2xl object-cover" />
                ) : (
                  initials
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-neutral-100 truncate">{user?.name || "User"}</p>
                <p className="text-xs text-neutral-500 flex items-center gap-1.5 mt-0.5 truncate">
                  <Mail className="w-3 h-3 shrink-0" />
                  {user?.email}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge variant={user?.role === "ADMIN" ? "success" : "outline"} className="text-[9px]">
                    {user?.role ?? "USER"}
                  </Badge>
                  <Badge variant="outline" className="text-[9px]">Free Plan</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Usage */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <span className="text-sm font-medium text-neutral-200">Usage</span>
              <Badge variant="outline">{usage?.quota ?? 0} daily quota</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {!usage ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 text-neutral-500 animate-spin" />
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-neutral-400">{usage.usedToday} of {usage.quota} used today</span>
                  <span className="text-xs text-neutral-300 font-medium">{usage.remaining} remaining</span>
                </div>
                <div className="h-1.5 rounded-full bg-neutral-800/60 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${usedPercent}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="h-full rounded-full bg-neutral-500/50"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Appearance */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardHeader>
            <span className="text-sm font-medium text-neutral-200">Appearance</span>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 max-w-xs">
              {(["dark", "light"] as const).map((t) => (
                <Button
                  key={t}
                  variant={theme === t ? "primary" : "secondary"}
                  onClick={() => setTheme(t)}
                  className="justify-center"
                >
                  {theme === t && <Check className="w-3.5 h-3.5" />}
                  {t === "dark" ? "Dark" : "Light"}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Coming soon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {COMING_SOON.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 + i * 0.04 }}
            className="p-4 rounded-xl border border-neutral-800/30 bg-neutral-900/40"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-neutral-800/60 border border-neutral-700/30 flex items-center justify-center">
                <s.icon className="w-3.5 h-3.5 text-neutral-400" />
              </div>
              <p className="text-xs font-medium text-neutral-200">{s.title}</p>
            </div>
            <p className="text-[10px] text-neutral-600 leading-relaxed">{s.desc}</p>
          </motion.div>
        ))}
      </div>
    </PageTransition>
  );
}