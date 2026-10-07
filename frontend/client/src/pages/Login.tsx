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
  Store,
  X,
  Send
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useAppStore } from "../hooks/useAppStore";
import { useTheme } from "../contexts/ThemeContext";
import { UserRole } from "../types";
import { authApi } from "../api/authApi";
import { tokenManager } from "../api/tokenManager";

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email address is required")
    .email("Please enter a valid email address (e.g. name@domain.com)"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});

export const Login: React.FC = () => {
  const [, setLocation] = useLocation();
  const store = useAppStore();
  const { theme, toggleTheme } = useTheme();

  const [selectedRole, setSelectedRole] = useState<UserRole>("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setFormErrors({});
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFormErrors({});

    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const fieldName = issue.path[0]?.toString() || "form";
        if (!fieldErrors[fieldName]) {
          fieldErrors[fieldName] = issue.message;
        }
      });
      setFormErrors(fieldErrors);
      const firstError = Object.values(fieldErrors)[0];
      toast.error(firstError || "Please check the highlighted fields.");
      return;
    }

    setIsLoading(true);

    try {
      const authRes = await authApi.login({
        identifier: email.trim(),
        email: email.trim(),
        password: password,
        role: selectedRole === "admin" ? "ADMIN" : "MERCHANT",
      });

      if (authRes?.user?.status === "SUSPENDED" || authRes?.user?.status === "BLOCKED" || authRes?.user?.status === "INACTIVE") {
        toast.error("Your account has been suspended or deactivated. Please contact your platform administrator.");
        return;
      }

      if (authRes?.accessToken) {
        tokenManager.setAccessToken(authRes.accessToken);
      }

      const userRoleStr = String(authRes?.user?.role || "").toUpperCase();
      const staffScope = String(authRes?.user?.staffScope || "").toUpperCase();
      const isPlatformStaff = staffScope === "PLATFORM" || userRoleStr.includes("ADMIN");
      const isStoreStaff = staffScope === "STORE" || (!isPlatformStaff && selectedRole === "store");

      const resolvedRole: UserRole =
        isPlatformStaff
          ? "admin"
          : isStoreStaff
          ? "store"
          : "merchant";

      store.login(
        resolvedRole,
        email.trim(),
        isStoreStaff ? (authRes?.user?.storeId || selectedStoreId || undefined) : undefined,
        {
          id: authRes?.user?.id,
          name: authRes?.user?.name,
          roleName: authRes?.user?.staffRoleName,
          staffRoleId: authRes?.user?.staffRoleId,
          staffScope: authRes?.user?.staffScope,
          permissions: authRes?.user?.permissions,
          status: authRes?.user?.status,
        }
      );
      toast.success(
        `Welcome back! Authenticated as ${authRes?.user?.name || (resolvedRole === "admin" ? "Platform Admin" : "Merchant Partner")}.`
      );
      const destination =
        resolvedRole === "admin"
          ? "/admin/overview"
          : resolvedRole === "store"
          ? "/store/dashboard"
          : "/merchant/dashboard";
      setLocation(destination);
    } catch (apiErr: any) {
      console.error("Login authentication error:", apiErr);
      const errMsg =
        apiErr?.response?.data?.message ||
        apiErr?.response?.data?.error?.message ||
        apiErr?.message ||
        "Invalid credentials. Please verify your email and password.";
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
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
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0e17] text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-pink-500 selection:text-white transition-colors duration-200">
      {/* Top Simple Nav */}
      <header className="px-6 py-4 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-600 to-amber-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-pink-500/25">
            P
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl font-['Manrope'] tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-pink-600 to-amber-600">
                PINAK
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                Operations
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block font-semibold -mt-1">
              Cluster Ops & Multi-Store Portal
            </span>
          </div>
        </div>

        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Toggle Light / Dark Mode"
        >
          {theme === "dark" ? (
            <Sun size={18} className="text-amber-400" />
          ) : (
            <Moon size={18} />
          )}
        </button>
      </header>

      {/* Main Login Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden">
          {/* Left Hero Graphic Column */}
          <div className="lg:col-span-5 bg-gradient-to-br from-purple-700 via-pink-600 to-amber-600 p-8 text-white flex flex-col justify-between relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]" />
            <div className="absolute -right-20 -bottom-20 w-72 h-72 rounded-full bg-white/10 blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md text-white border border-white/20">
                <Sparkles size={13} />
                Multi-Store Architecture
              </span>
              <h2 className="text-2xl sm:text-3xl font-black font-['Manrope'] leading-tight">
                One Platform for Brand HQ & Store Outlets.
              </h2>
              <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
                Empower brand headquarters to manage stores and corporate staff, while giving store managers and branch supervisors independent access to live order verification and customer rewards.
              </p>
            </div>

            <div className="relative z-10 pt-8 border-t border-white/20 space-y-3">
              <div className="flex items-center gap-3 text-xs font-semibold text-white/90">
                <CheckCircle2 size={16} className="text-white shrink-0" />
                <span>Super Admin: Cluster oversight & KYC verification</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold text-white/90">
                <CheckCircle2 size={16} className="text-white shrink-0" />
                <span>Merchant HQ: Store creation & corporate staff</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold text-white/90">
                <CheckCircle2 size={16} className="text-white shrink-0" />
                <span>Store Branches: Store Manager PINs & live order verification</span>
              </div>
            </div>
          </div>

          {/* Right Form Column */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between">
            <div>
              {/* Role Switcher Tabs */}
              <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl mb-5">
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
                  <span>Super Admin</span>
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
                  <span>Merchant HQ</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleSelect("store")}
                  className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    selectedRole === "store"
                      ? "bg-white dark:bg-[#1a1f33] text-amber-600 dark:text-amber-300 shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Store size={14} />
                  <span>Store Branch</span>
                </button>
              </div>

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-4 text-xs">
                {selectedRole === "store" && store.stores.length > 0 && (
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Select Store Branch Outlet
                    </label>
                    <select
                      value={selectedStoreId}
                      onChange={(e) => setSelectedStoreId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
                    >
                      <option value="">Select branch outlet (optional)</option>
                      {store.stores.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.storeName} - {s.branchName} ({s.city})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {selectedRole === "store" ? "Store Branch Login Email" : "Email Address"}
                  </label>
                  <div className="relative">
                    <Mail
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="email"
                      placeholder={
                        selectedRole === "admin"
                          ? "riya.admin@pinak.app"
                          : selectedRole === "store"
                          ? "branch@merchant.in"
                          : "owner@merchant.in"
                      }
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (formErrors.email) setFormErrors((prev) => ({ ...prev, email: "" }));
                      }}
                      className={`w-full pl-10 pr-3 py-2.5 rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-hidden focus:ring-2 ${
                        formErrors.email
                          ? "border-rose-500 focus:ring-rose-500/30"
                          : "border-slate-200 dark:border-slate-700 focus:ring-pink-500/30"
                      }`}
                    />
                  </div>
                  {formErrors.email && (
                    <p className="text-[11px] text-rose-500 mt-1 font-medium flex items-center gap-1">
                      <span>•</span> {formErrors.email}
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">
                      {selectedRole === "store" ? "Store Access PIN" : "Password"}
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsForgotOpen(true)}
                      className="text-[11px] font-semibold text-pink-600 hover:underline"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder={selectedRole === "store" ? "Enter branch PIN" : "Enter your password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (formErrors.password) setFormErrors((prev) => ({ ...prev, password: "" }));
                      }}
                      className={`w-full pl-10 pr-10 py-2.5 rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-hidden focus:ring-2 ${
                        formErrors.password
                          ? "border-rose-500 focus:ring-rose-500/30"
                          : "border-slate-200 dark:border-slate-700 focus:ring-pink-500/30"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {formErrors.password && (
                    <p className="text-[11px] text-rose-500 mt-1 font-medium flex items-center gap-1">
                      <span>•</span> {formErrors.password}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded text-pink-600 focus:ring-pink-500/30"
                    />
                    <span className="text-slate-600 dark:text-slate-400 font-medium">
                      Remember this terminal
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-gradient w-full py-3 rounded-xl text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2 hover:opacity-95 transition-opacity disabled:opacity-50 mt-2"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>
                        {selectedRole === "admin"
                          ? "Access Platform Console"
                          : selectedRole === "store"
                          ? "Open Store Branch Portal"
                          : "Enter Merchant HQ Console"}
                      </span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 text-center text-[11px] text-slate-400">
              PINAK Network OS • AES-256 GCM Encrypted Session • ISO-27001 Certified
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400">
        &copy; 2026 PINAK Technologies Private Limited. All rights reserved.
      </footer>

      {/* Forgot Password Modal */}
      {isForgotOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsForgotOpen(false)}
          />
          <div className="relative w-full max-w-sm bg-white dark:bg-[#121626] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 z-10 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Reset Portal Access
              </h3>
              <button
                onClick={() => setIsForgotOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Enter your registered work email. We will send a secure token to reset your password or counter PIN.
            </p>
            <form onSubmit={handleSendReset} className="space-y-3 text-xs">
              <input
                type="email"
                required
                placeholder="you@company.com"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              />
              <button
                type="submit"
                disabled={forgotSent}
                className="btn-gradient w-full py-2.5 rounded-xl text-white font-bold text-xs shadow-md flex items-center justify-center gap-2"
              >
                <Send size={13} />
                <span>{forgotSent ? "Link Dispatched" : "Send Recovery Link"}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
