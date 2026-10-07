import React, { useState, useEffect } from "react";
import { Clock, Calendar, Check, AlertCircle, Sparkles } from "lucide-react";
import { cn } from "../lib/utils";

export interface StoreScheduleSelectorProps {
  value?: string;
  onChange: (scheduleString: string) => void;
  className?: string;
}

const ALL_DAYS = [
  { id: "Mon", label: "Mon" },
  { id: "Tue", label: "Tue" },
  { id: "Wed", label: "Wed" },
  { id: "Thu", label: "Thu" },
  { id: "Fri", label: "Fri" },
  { id: "Sat", label: "Sat" },
  { id: "Sun", label: "Sun" },
];

export const StoreScheduleSelector: React.FC<StoreScheduleSelectorProps> = ({
  value = "",
  onChange,
  className = ""
}) => {
  const [selectedDays, setSelectedDays] = useState<string[]>([
    "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"
  ]);
  const [openTime, setOpenTime] = useState("09:00");
  const [closeTime, setCloseTime] = useState("22:00");
  const [openOnHolidays, setOpenOnHolidays] = useState(true);

  // Helper to convert 24h to 12h AM/PM
  const format12h = (time24: string) => {
    if (!time24) return "09:00 AM";
    const [hStr, mStr] = time24.split(":");
    let h = parseInt(hStr || "9", 10);
    const m = mStr || "00";
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12;
    if (h === 0) h = 12;
    return `${h.toString().padStart(2, "0")}:${m} ${ampm}`;
  };

  // Re-generate formatted string whenever state changes
  useEffect(() => {
    let daysStr = "";
    if (selectedDays.length === 7) {
      daysStr = "Daily (Mon – Sun)";
    } else if (
      selectedDays.length === 5 &&
      ["Mon", "Tue", "Wed", "Thu", "Fri"].every((d) => selectedDays.includes(d))
    ) {
      daysStr = "Weekdays (Mon – Fri)";
    } else if (
      selectedDays.length === 2 &&
      ["Sat", "Sun"].every((d) => selectedDays.includes(d))
    ) {
      daysStr = "Weekends (Sat & Sun)";
    } else if (selectedDays.length > 0) {
      daysStr = selectedDays.join(", ");
    } else {
      daysStr = "Closed";
    }

    const formatted = `${format12h(openTime)} – ${format12h(closeTime)} (${daysStr})${
      openOnHolidays ? " • Open on Holidays" : " • Closed on Holidays"
    }`;

    onChange(formatted);
  }, [selectedDays, openTime, closeTime, openOnHolidays]);

  const toggleDay = (dayId: string) => {
    if (selectedDays.includes(dayId)) {
      setSelectedDays(selectedDays.filter((d) => d !== dayId));
    } else {
      setSelectedDays([...selectedDays, dayId]);
    }
  };

  const setPreset = (type: "all" | "weekdays" | "weekends") => {
    if (type === "all") {
      setSelectedDays(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);
    } else if (type === "weekdays") {
      setSelectedDays(["Mon", "Tue", "Wed", "Thu", "Fri"]);
    } else if (type === "weekends") {
      setSelectedDays(["Sat", "Sun"]);
    }
  };

  return (
    <div className={cn("p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-4 text-xs", className)}>
      <div className="flex items-center justify-between">
        <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <Clock size={14} className="text-purple-600 dark:text-purple-400" />
          <span>Operating Hours & Open Days Schedule</span>
        </label>
        <span className="text-[11px] font-mono text-purple-700 dark:text-purple-300 font-semibold">
          {format12h(openTime)} – {format12h(closeTime)}
        </span>
      </div>

      {/* Preset Quick Buttons */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-slate-400 font-semibold">Presets:</span>
        <button
          type="button"
          onClick={() => setPreset("all")}
          className={cn(
            "px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border",
            selectedDays.length === 7
              ? "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300 dark:border-purple-800"
              : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          )}
        >
          Daily (Mon-Sun)
        </button>
        <button
          type="button"
          onClick={() => setPreset("weekdays")}
          className={cn(
            "px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border",
            selectedDays.length === 5 && ["Mon", "Tue", "Wed", "Thu", "Fri"].every((d) => selectedDays.includes(d))
              ? "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300 dark:border-purple-800"
              : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          )}
        >
          Weekdays
        </button>
        <button
          type="button"
          onClick={() => setPreset("weekends")}
          className={cn(
            "px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border",
            selectedDays.length === 2 && ["Sat", "Sun"].every((d) => selectedDays.includes(d))
              ? "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300 dark:border-purple-800"
              : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          )}
        >
          Weekends
        </button>
      </div>

      {/* Day-of-week Toggles */}
      <div>
        <label className="text-[11px] font-semibold text-slate-500 block mb-1.5">
          Select Active Store Open Days:
        </label>
        <div className="grid grid-cols-7 gap-1.5">
          {ALL_DAYS.map((day) => {
            const active = selectedDays.includes(day.id);
            return (
              <button
                key={day.id}
                type="button"
                onClick={() => toggleDay(day.id)}
                className={cn(
                  "py-2 rounded-xl text-center text-xs font-bold transition-all border shadow-2xs",
                  active
                    ? "bg-purple-600 text-white border-purple-600 shadow-purple-500/20"
                    : "bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 hover:border-purple-300"
                )}
              >
                {day.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Open & Close Times */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <div>
          <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1 text-[11px]">
            Opening Time *
          </label>
          <input
            type="time"
            value={openTime}
            onChange={(e) => setOpenTime(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white"
          />
        </div>
        <div>
          <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1 text-[11px]">
            Closing Time *
          </label>
          <input
            type="time"
            value={closeTime}
            onChange={(e) => setCloseTime(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Public Holiday Toggle */}
      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
        <div>
          <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">Public Holidays Status</p>
          <p className="text-[11px] text-slate-400">Keep store open on national & local holidays</p>
        </div>
        <button
          type="button"
          onClick={() => setOpenOnHolidays(!openOnHolidays)}
          className={cn(
            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
            openOnHolidays ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
          )}
        >
          <span
            className={cn(
              "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out",
              openOnHolidays ? "translate-x-5" : "translate-x-0"
            )}
          />
        </button>
      </div>
    </div>
  );
};
