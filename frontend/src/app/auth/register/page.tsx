"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name || form.name.length < 2) errs.name = "Name must be at least 2 characters";
    if (!form.email) errs.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = "Invalid email format";
    if (!form.password || form.password.length < 8) errs.password = "Password must be at least 8 characters";
    if (!/[A-Z]/.test(form.password)) errs.password = "Must contain an uppercase letter";
    if (!/[0-9]/.test(form.password)) errs.password = "Must contain a number";
    if (form.password !== form.confirmPassword) errs.confirmPassword = "Passwords do not match";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      router.push("/dashboard");
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
            <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center"><Sparkles className="w-5 h-5 text-neutral-950" /></div>
            <span className="font-semibold text-xl text-neutral-100">Intellix</span>
          </Link>
          <h1 className="text-2xl font-bold text-neutral-100">Create your account</h1>
          <p className="text-sm text-neutral-400 mt-2">Start creating amazing AI assets</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.form && <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg p-3">{errors.form}</p>}
          <div>
            <label className="block text-xs font-medium text-neutral-400 uppercase tracking-wider mb-1.5">Name</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John Doe" className="w-full bg-neutral-900/80 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600/50 transition-all" />
            {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
          </div>
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
          <div>
            <label className="block text-xs font-medium text-neutral-400 uppercase tracking-wider mb-1.5">Confirm Password</label>
            <input type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} placeholder="••••••••" className="w-full bg-neutral-900/80 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600/50 transition-all" />
            {errors.confirmPassword && <p className="text-xs text-red-400 mt-1">{errors.confirmPassword}</p>}
          </div>
          <button type="submit" disabled={loading} className="w-full py-3 bg-neutral-100 text-neutral-950 rounded-xl font-medium text-sm hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {loading ? <div className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" /> : null}
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>
        <p className="text-center text-sm text-neutral-500 mt-6">Already have an account?{" "}<Link href="/auth/login" className="text-neutral-300 hover:text-neutral-100 font-medium">Sign in</Link></p>
      </div>
    </div>
  );
}
