import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { staffApi, VerifyInviteResponse } from "../api/staffApi";
import {
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Users
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Card } from "../components/ui/card";
import { toast } from "sonner";

export default function AcceptInvite() {
  const [, setLocation] = useLocation();

  const [token, setToken] = useState<string>("");
  const [inviteData, setInviteData] = useState<VerifyInviteResponse | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Form State
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryToken = params.get("token");

    if (!queryToken) {
      setIsVerifying(false);
      setVerifyError("No invitation token provided. Please check the link from your invitation email.");
      return;
    }

    setToken(queryToken);
    verifyToken(queryToken);
  }, []);

  const verifyToken = async (tok: string) => {
    setIsVerifying(true);
    setVerifyError(null);
    try {
      const data = await staffApi.verifyInviteToken(tok);
      setInviteData(data);
    } catch (err: any) {
      console.error("Token verification failed:", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error?.message ||
        err?.message ||
        "This invitation link is invalid, expired, or has already been accepted.";
      setVerifyError(msg);
    } finally {
      setIsVerifying(false);
    }
  };

  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isMatch = password.length > 0 && password === confirmPassword;
  const isValid = hasMinLength && hasUpperCase && hasNumber && isMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      toast.error("Please meet all password security requirements.");
      return;
    }

    setIsSubmitting(true);
    try {
      await staffApi.acceptInvite({
        token,
        password,
      });

      setIsSuccess(true);
      toast.success("Account activated successfully! Redirecting to login...");
      setTimeout(() => {
        setLocation(`/login?email=${encodeURIComponent(inviteData?.email || "")}`);
      }, 2000);
    } catch (err: any) {
      console.error("Failed to accept invite:", err);
      toast.error(
        err?.response?.data?.message || err?.message || "Failed to activate account. The link may have expired."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center bg-[#f8f9fc] dark:bg-[#0c0e17] p-4 select-none">
      {/* Brand Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-purple-500/20">
          P
        </div>
        <div>
          <span className="font-extrabold text-2xl font-['Manrope'] tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-pink-600 to-amber-600">
            PINAK
          </span>
          <span className="text-[11px] text-slate-400 block font-semibold -mt-1 tracking-wider uppercase">
            Team Onboarding Portal
          </span>
        </div>
      </div>

      <div className="w-full max-w-md">
        {/* State 1: Verifying Token */}
        {isVerifying && (
          <Card className="p-8 text-center bg-white dark:bg-[#121626] border-slate-200/80 dark:border-slate-800 shadow-xl rounded-3xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center mx-auto animate-spin">
              <Sparkles size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Validating Invitation Link...
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Verifying cryptographic credentials and platform authorization tokens.
            </p>
          </Card>
        )}

        {/* State 2: Verification Error / Expired */}
        {!isVerifying && verifyError && (
          <Card className="p-8 text-center bg-white dark:bg-[#121626] border-slate-200/80 dark:border-slate-800 shadow-xl rounded-3xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle size={26} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Invitation Link Invalid or Expired
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {verifyError}
            </p>
            <div className="pt-2">
              <Button
                onClick={() => setLocation("/login")}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-md"
              >
                Return to Login
              </Button>
            </div>
          </Card>
        )}

        {/* State 3: Success Screen */}
        {!isVerifying && !verifyError && isSuccess && (
          <Card className="p-8 text-center bg-white dark:bg-[#121626] border-slate-200/80 dark:border-slate-800 shadow-xl rounded-3xl space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Account Activated Successfully!
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Your credentials have been securely stored. Redirecting you to the platform login console...
            </p>
            <div className="pt-2">
              <Button
                onClick={() => setLocation(`/login?email=${encodeURIComponent(inviteData?.email || "")}`)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-md flex items-center justify-center gap-2"
              >
                <span>Proceed to Sign In</span>
                <ArrowRight size={14} />
              </Button>
            </div>
          </Card>
        )}

        {/* State 4: Set Password Form */}
        {!isVerifying && !verifyError && !isSuccess && inviteData && (
          <Card className="p-6 md:p-8 bg-white dark:bg-[#121626] border-slate-200/80 dark:border-slate-800 shadow-xl rounded-3xl space-y-5">
            <div className="border-b border-slate-100 dark:border-slate-800/80 pb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                  <ShieldCheck size={13} />
                  Role-Based Authorization
                </span>
                <Badge variant="secondary" className="text-[10px]">
                  {inviteData.scope}
                </Badge>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-['Manrope']">
                Welcome, {inviteData.name}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                You have been invited as{" "}
                <strong className="text-slate-700 dark:text-slate-200">
                  {inviteData.roleName}
                </strong>
                . Set your secure password below to activate your account.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Work Email
                </Label>
                <Input
                  value={inviteData.email}
                  disabled
                  className="mt-1 bg-slate-50 dark:bg-slate-800/40 text-slate-500 cursor-not-allowed text-xs font-medium"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Create New Password *
                </Label>
                <div className="relative mt-1">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter secure password"
                    className="text-xs pr-10 rounded-xl"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Confirm Password *
                </Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="mt-1 text-xs rounded-xl"
                  required
                />
              </div>

              {/* Password Requirements Checklist */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-1.5 text-[11px]">
                <span className="font-bold text-slate-500 block mb-1">
                  Security Requirements:
                </span>
                <div className={`flex items-center gap-2 ${hasMinLength ? "text-emerald-600 font-semibold" : "text-slate-400"}`}>
                  <CheckCircle2 size={13} className={hasMinLength ? "text-emerald-600" : "text-slate-300"} />
                  <span>At least 8 characters</span>
                </div>
                <div className={`flex items-center gap-2 ${hasUpperCase ? "text-emerald-600 font-semibold" : "text-slate-400"}`}>
                  <CheckCircle2 size={13} className={hasUpperCase ? "text-emerald-600" : "text-slate-300"} />
                  <span>At least one uppercase letter (A-Z)</span>
                </div>
                <div className={`flex items-center gap-2 ${hasNumber ? "text-emerald-600 font-semibold" : "text-slate-400"}`}>
                  <CheckCircle2 size={13} className={hasNumber ? "text-emerald-600" : "text-slate-300"} />
                  <span>At least one number (0-9)</span>
                </div>
                <div className={`flex items-center gap-2 ${isMatch ? "text-emerald-600 font-semibold" : "text-slate-400"}`}>
                  <CheckCircle2 size={13} className={isMatch ? "text-emerald-600" : "text-slate-300"} />
                  <span>Passwords match</span>
                </div>
              </div>

              <Button
                type="submit"
                disabled={!isValid || isSubmitting}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-md transition-all disabled:opacity-50"
              >
                {isSubmitting ? "Activating Credentials..." : "Activate Account & Enter Console"}
              </Button>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}
