"use client";

import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { motion } from "framer-motion";
import { Sparkles, Check, Clock, CreditCard, Loader2 } from "lucide-react";
import { Card, CardHeader, CardContent, Badge, SectionHeader, Button, PageTransition } from "@/components/ui/primitives";

const PLAN_FEATURES = [
  "Daily generation quota",
  "Flux Dev & Flux Schnell models",
  "Full generation history",
  "Projects & prompt library",
];

export default function BillingPage() {
  const { user } = useAuth();

  const { data: usageData, isLoading } = useQuery({
    queryKey: ["usage"],
    queryFn: () => api.getUsage(),
    enabled: !!user,
  });

  const usage = usageData?.data as any;
  const usedToday = usage?.usedToday ?? 0;
  const quota = usage?.quota ?? 0;
  const remaining = usage?.remaining ?? 0;
  const usedPercent = quota > 0 ? Math.min(100, Math.round((usedToday / quota) * 100)) : 0;

  return (
    <PageTransition className="max-w-[720px] mx-auto space-y-6">
      <SectionHeader title="Billing" />

      {/* Current Plan */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <span className="text-sm font-medium text-neutral-200">Free Plan</span>
              <Badge variant="success">Active</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-3xl font-bold text-neutral-100">
                $0
                <span className="text-sm font-normal text-neutral-500 ml-1.5">/ forever</span>
              </p>
              <p className="text-xs text-neutral-500 mt-1">
                Start generating images with Intellix instantly. No credit card required.
              </p>
            </div>

            <div className="space-y-2">
              {PLAN_FEATURES.map((f) => (
                <div key={f} className="flex items-center gap-2 text-xs text-neutral-400">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  {f}
                </div>
              ))}
            </div>

            <Button variant="secondary" disabled>
              <CreditCard className="w-3.5 h-3.5" />
              Paid plans coming soon
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Daily Usage */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <span className="text-sm font-medium text-neutral-200">Today&apos;s Usage</span>
              <Badge variant="outline">{quota} quota</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 text-neutral-500 animate-spin" />
              </div>
            ) : (
              <>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-bold text-neutral-100">
                      {usedToday}
                      <span className="text-sm text-neutral-500 ml-1">of {quota} used</span>
                    </p>
                    <p className="text-xs text-neutral-500 mt-1 flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      Resets daily
                    </p>
                  </div>
                  <p className="text-xs text-neutral-400 font-medium">{remaining} remaining</p>
                </div>
                <div className="h-1.5 rounded-full bg-neutral-800/60 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${usedPercent}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="h-full rounded-full bg-neutral-500/50"
                  />
                </div>
                <div className="flex items-center gap-1.5 pt-1 text-[10px] text-neutral-600">
                  <Sparkles className="w-3 h-3" />
                  Each generation consumes 1 credit
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Invoices / History */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardHeader>
            <span className="text-sm font-medium text-neutral-200">Invoices & Transactions</span>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-10 h-10 rounded-xl bg-neutral-800/60 border border-neutral-700/30 flex items-center justify-center mb-3">
                <CreditCard className="w-4 h-4 text-neutral-500" />
              </div>
              <p className="text-xs text-neutral-400">No invoices yet</p>
              <p className="text-[10px] text-neutral-600 mt-1">
                Invoices will appear here when paid billing is available.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </PageTransition>
  );
}
