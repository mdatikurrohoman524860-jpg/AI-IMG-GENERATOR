"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Sparkles, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (!form.email) { setErrors((p) => ({ ...p, email: "Email is required" })); return; }
    if (!form.password) { setErrors((p) => ({ ...p, password: "Password is required" })); return; }

    setLoading(true);
    try {
      await login(form.email, form.password);
      router.push(searchParams.get("callbackUrl") || "/dashboard");
    } catch (error: any) {
      setErrors((p) => ({ ...p, form: error.message }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-neutral-950" />
            </div>
            <span className="font-semibold text-xl text-neutral-100">Intellix</span>
          </Link>
          <h1 className="text-2xl font-bold text-neutral-100">Welcome back</h1>
          <p className="text-sm text-neutral-400 mt-2">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.form && <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg p-3">{errors.form}</p>}
          <div>
            <label className="block text-xs font-medium text-neutral-400 uppercase tracking-wider mb-1.5">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" className="w-full bg-neutral-900/80 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600/50 transition-all" />
            {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-400 uppercase tracking-wider mb-1.5">Password</label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" className="w-full bg-neutral-900/80 border border-neutral-800 rounded-xl px-4 py-3 pr-10 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600/50 transition-all" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
            </div>
            {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password}</p>}
          </div>
          <div className="flex items-center justify-end">
            <Link href="/auth/forgot-password" className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors">Forgot password?</Link>
          </div>
          <button type="submit" disabled={loading} className="w-full py-3 bg-neutral-100 text-neutral-950 rounded-xl font-medium text-sm hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {loading ? <div className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" /> : null}
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <p className="text-center text-sm text-neutral-500 mt-6">Don&apos;t have an account?{" "}<Link href="/auth/register" className="text-neutral-300 hover:text-neutral-100 font-medium">Create one</Link></p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-neutral-950 flex items-center justify-center"><div className="w-8 h-8 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
