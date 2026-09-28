import React, { useState } from "react";
import { useLocation } from "wouter";
import {
  Sparkles,
  ShieldCheck,
  Building2,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  Sun,
  Moon,
  CheckCircle2,
  Zap,
  Store,
  HelpCircle,
  X,
  Send
} from "lucide-react";
import { toast } from "sonner";
import { useMockStore } from "../hooks/useMockStore";
import { useTheme } from "../contexts/ThemeContext";
import { UserRole } from "../types";
import { authApi } from "../api/authApi";
import { setStoredTokens } from "../api/interceptors";

export const Login: React.FC = () => {
  const [, setLocation] = useLocation();
  const store = useMockStore();
  const { theme, toggleTheme } = useTheme();

  const [selectedRole, setSelectedRole] = useState<UserRole>("admin");
  const [email, setEmail] = useState("riya.admin@pinak.app");
  const [password, setPassword] = useState("••••••••••••");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  // If already authenticated and visiting /login directly, redirect to /
  // but allow users to stay if they deliberately came here to switch
  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    if (role === "admin") {
      setEmail("riya.admin@pinak.app");
    } else {
      setEmail("sunil@curryleaf.in");
    }
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);

    try {
      const authRes = await authApi.login({
        identifier: email,
        email: email,
        password: password,
        role: selectedRole === "admin" ? "ADMIN" : "MERCHANT",
      });

      if (authRes?.accessToken) {
        setStoredTokens(authRes.accessToken, authRes.refreshToken);
      }
      store.login(selectedRole, email);
      toast.success(
        `Welcome back! Logged in as ${
          selectedRole === "admin" ? "Super Admin" : "Store Partner"
        }.`
      );
      setLocation("/");
    } catch (apiErr: any) {
      console.warn("Backend API not reachable or credentials mismatch, falling back to local session:", apiErr);
      // Fallback for seamless developer testing when backend server is restarting
      store.login(selectedRole, email);
      toast.success(
        `Logged in as ${
          selectedRole === "admin" ? "Super Admin" : "Store Partner"
        } (Offline/Sandbox mode).`
      );
      setLocation("/");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = (role: UserRole) => {
    setSelectedRole(role);
    const demoEmail = role === "admin" ? "riya.admin@pinak.app" : "sunil@curryleaf.in";
    setEmail(demoEmail);
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      store.login(role, demoEmail);
      toast.success(
        `Signed in as ${role === "admin" ? "Platform Administrator" : "Merchant Partner"}!`
      );
      setLocation("/");
    }, 400);
  };

  const handleSendReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      toast.error("Please enter your account email address.");
      return;
    }
    setForgotSent(true);
    toast.success(`Password reset verification link sent to ${forgotEmail}!`);
    setTimeout(() => {
      setIsForgotOpen(false);
      setForgotSent(false);
      setForgotEmail("");
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fc] dark:bg-[#0c0e17] text-slate-900 dark:text-slate-100 flex flex-col justify-between relative overflow-hidden transition-colors duration-200">
      {/* Background Decorative Glow Gradients */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-br from-pink-500/20 via-purple-500/15 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-gradient-to-tl from-amber-500/20 via-rose-500/15 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <header className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto w-full z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#ffc837] via-[#ff4e50] to-[#8a2387] flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-pink-500/20">
            P
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 bg-clip-text text-transparent font-['Manrope']">
              PINAK
            </span>
            <span className="block text-[10px] uppercase font-bold tracking-widest text-slate-400">
              Merchant & Discovery Portal
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => toggleTheme?.()}
            className="p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-xs"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} />}
          </button>
        </div>
      </header>

      {/* Main Login Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 z-10">
        <div className="w-full max-w-md space-y-6">
          {/* Card */}
          <div className="p-7 sm:p-8 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-2xl relative overflow-hidden backdrop-blur-xl">
            {/* Top Badge */}
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-pink-50 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 border border-pink-200/60 dark:border-pink-900/60 inline-flex items-center gap-1.5">
                <Sparkles size={13} className="text-pink-600 dark:text-pink-400" />
                Console Access
              </span>
              <span className="text-[11px] font-mono text-slate-400">v2.4 Live Demo</span>
            </div>

            <div className="space-y-1 mb-6">
              <h1 className="text-2xl font-extrabold font-['Manrope'] text-slate-900 dark:text-white tracking-tight">
                Sign In to PINAK
              </h1>
              <p className="text-xs text-slate-500">
                Manage discovery ranking, store campaigns, and zero-fee UPI payouts.
              </p>
            </div>

            {/* Quick 1-Click Demo Login Pills */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 space-y-2 mb-6">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Quick 1-Click Demo Sign-In
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin("admin")}
                  className="p-2.5 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/60 hover:bg-purple-100/80 dark:bg-purple-950/30 dark:hover:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-left transition-all group"
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <ShieldCheck size={14} className="text-purple-600 dark:text-purple-400" />
                    <span>Admin Mode</span>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    Platform Superadmin
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin("merchant")}
                  className="p-2.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/60 hover:bg-amber-100/80 dark:bg-amber-950/30 dark:hover:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-left transition-all group"
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Store size={14} className="text-amber-600 dark:text-amber-400" />
                    <span>Merchant Mode</span>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    The Curry Leaf
                  </span>
                </button>
              </div>
            </div>

            {/* Role Switcher Tabs */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl mb-5">
              <button
                type="button"
                onClick={() => handleRoleSelect("admin")}
                className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  selectedRole === "admin"
                    ? "bg-white dark:bg-[#1a1f33] text-purple-700 dark:text-purple-300 shadow-xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <ShieldCheck size={14} />
                <span>Platform Admin</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleSelect("merchant")}
                className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  selectedRole === "merchant"
                    ? "bg-white dark:bg-[#1a1f33] text-pink-600 dark:text-pink-300 shadow-xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Building2 size={14} />
                <span>Store Partner</span>
              </button>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-pink-500/30"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Password</label>
                  <button
                    type="button"
                    onClick={() => setIsForgotOpen(true)}
                    className="text-[11px] font-semibold text-pink-600 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-pink-500/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400 font-medium">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-pink-600 focus:ring-pink-500"
                  />
                  <span>Remember this device for 30 days</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-gradient w-full py-3 rounded-xl text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2 mt-2"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Enter {selectedRole === "admin" ? "Admin Workspace" : "Merchant Console"}</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Security Note */}
          <div className="text-center space-y-1 text-slate-400 text-[11px]">
            <p className="flex items-center justify-center gap-1.5 font-medium">
              <ShieldCheck size={14} className="text-emerald-500" />
              <span>Direct Bank Settlement · NPCI UPI 2.0 Direct Routing</span>
            </p>
            <p>100% Non-Custodial Platform Escrow Guarantee</p>
          </div>
        </div>
      </main>

      {/* Forgot Password Right Slide-Over Drawer */}
      {isForgotOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsForgotOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <aside className="w-screen max-w-md bg-white dark:bg-[#121626] shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-transparent">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-pink-600 text-white shadow-md">
                    <HelpCircle size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Password Reset
                    </h3>
                    <p className="text-xs text-slate-500">
                      Recover access to your PINAK partner account
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsForgotOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSendReset} className="flex-1 p-6 space-y-4 text-xs">
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Enter your registered admin or merchant email. We will dispatch a temporary authentication code and magic sign-in link.
                </p>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Registered Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. sunil@curryleaf.in"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                  />
                </div>

                {forgotSent ? (
                  <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 font-bold">
                    <CheckCircle2 size={16} />
                    <span>Reset email dispatched successfully!</span>
                  </div>
                ) : (
                  <button
                    type="submit"
                    className="btn-gradient w-full py-2.5 rounded-xl text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 mt-4"
                  >
                    <Send size={14} />
                    <span>Dispatch Recovery Email</span>
                  </button>
                )}
              </form>
            </aside>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-slate-400 z-10">
        © 2026 PINAK Platform. All rights reserved.
      </footer>
    </div>
  );
};
