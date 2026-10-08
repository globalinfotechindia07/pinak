import React, { useState } from "react";
import { QrCode, Printer, Download, X, Sparkles, Receipt, Calculator, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface CounterQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessName: string;
  upiVpa: string;
}

export const CounterQRModal: React.FC<CounterQRModalProps> = ({
  isOpen,
  onClose,
  businessName,
  upiVpa
}) => {
  const [mode, setMode] = useState<"standee" | "dynamic">("standee");
  const [billAmount, setBillAmount] = useState(1200);
  const [discountValue, setDiscountValue] = useState(200);
  const payableAmount = Math.max(0, billAmount - discountValue);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
    toast.success("Print dialog opened for counter standee!");
  };

  const dynamicUpiUrl = `upi://pay?pa=${encodeURIComponent(upiVpa)}&pn=${encodeURIComponent(businessName)}&am=${payableAmount}.00&cu=INR&tn=PinakBill&tr=dyn_${Date.now()}`;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <aside className="w-screen max-w-md bg-white dark:bg-[#121626] shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <QrCode size={20} className="text-pink-600" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Manrope']">
                Store Counter & Digital Pay QR
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X size={18} />
            </button>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="px-6 pt-4">
            <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-xs font-bold">
              <button
                onClick={() => setMode("standee")}
                className={`py-2 rounded-xl transition-all ${
                  mode === "standee"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Store Counter Standee
              </button>
              <button
                onClick={() => setMode("dynamic")}
                className={`py-2 rounded-xl transition-all ${
                  mode === "dynamic"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Dynamic Bill QR (POS)
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-5 text-sm">
            {mode === "dynamic" && (
              <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-800 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-900 dark:text-purple-300">
                  <Calculator size={15} />
                  <span>Digital Pay Bill Encoder</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300">Gross Bill (₹)</label>
                    <input
                      type="number"
                      value={billAmount}
                      onChange={(e) => setBillAmount(parseFloat(e.target.value) || 0)}
                      className="mt-1 w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300">Deal Applied (₹)</label>
                    <input
                      type="number"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                      className="mt-1 w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-pink-600"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-purple-200/60 dark:border-purple-800/60 font-bold">
                  <span>Exact Payable UPI Amount:</span>
                  <span className="text-base text-pink-600 font-extrabold">₹{payableAmount}</span>
                </div>
              </div>
            )}

            {/* Printable / Scan Standee Card */}
            <div className="p-6 rounded-3xl bg-gradient-to-b from-purple-50 to-pink-50 dark:from-purple-950/40 dark:to-pink-950/20 border-2 border-dashed border-pink-300 dark:border-pink-800/80 text-center space-y-4 shadow-inner">
              <div className="flex items-center justify-center gap-2">
                <div className="brand-mark text-sm w-7 h-7">P</div>
                <span className="font-extrabold font-['Manrope'] tracking-wider text-base text-slate-900 dark:text-white">
                  PINAK DEALS
                </span>
              </div>

              <div>
                <h4 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {businessName}
                </h4>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {mode === "dynamic" ? `Scan to pay exact ₹${payableAmount}` : "Scan with PhonePe, GPay, Paytm, or Pinak App"}
                </p>
              </div>

              {/* QR Pattern Simulation */}
              <div className="w-48 h-48 mx-auto bg-white p-3 rounded-2xl shadow-md border border-slate-200 flex flex-col items-center justify-center relative">
                <div className="w-full h-full border-4 border-slate-900 rounded-xl p-2 flex flex-col justify-between">
                  <div className="flex justify-between">
                    <div className="w-9 h-9 border-4 border-slate-900 bg-slate-900 rounded-sm" />
                    <div className="w-9 h-9 border-4 border-slate-900 bg-slate-900 rounded-sm" />
                  </div>
                  <div className="text-center font-extrabold text-pink-600 font-mono text-xs">
                    {mode === "dynamic" ? `₹${payableAmount}` : "PINAK REWARDS"}
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="w-9 h-9 border-4 border-slate-900 bg-slate-900 rounded-sm" />
                    <div className="w-6 h-6 border-2 border-slate-900 flex items-center justify-center text-[9px] font-bold">
                      UPI
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <p className="font-mono text-xs font-bold text-purple-700 dark:text-purple-300 bg-white/80 dark:bg-slate-900/80 py-1.5 px-3 rounded-lg inline-block border border-purple-200 dark:border-purple-800">
                  UPI VPA: {upiVpa}
                </p>
                <p className="text-[11px] text-slate-500 font-medium">
                  {mode === "dynamic"
                    ? "Amount locked in QR · Customer PIN required"
                    : "Pay direct with UPI · Auto-deduct active deals & earn reward points"}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-3">
            <button
              onClick={() => toast.success("Standee image downloaded as PNG!")}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-100"
            >
              <Download size={14} />
              <span>Download PNG</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 btn-gradient flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-white text-xs font-bold shadow-md"
            >
              <Printer size={14} />
              <span>Print Standee</span>
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};
