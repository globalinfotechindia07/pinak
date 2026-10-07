import { useTheme } from "@/contexts/ThemeContext";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  let theme: "light" | "dark" = "light";
  try {
    const themeContext = useTheme();
    theme = themeContext.theme;
  } catch {
    theme = "light";
  }

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white dark:group-[.toaster]:bg-[#131726] group-[.toaster]:text-slate-900 dark:group-[.toaster]:text-slate-100 group-[.toaster]:border-slate-200 dark:group-[.toaster]:border-slate-800 group-[.toaster]:shadow-2xl group-[.toaster]:opacity-100 group-[.toaster]:backdrop-blur-none group-[.toaster]:rounded-2xl group-[.toaster]:border",
          description: "group-[.toast]:text-slate-500 dark:group-[.toast]:text-slate-400 text-xs",
          actionButton:
            "group-[.toast]:bg-purple-600 group-[.toast]:text-white font-medium",
          cancelButton:
            "group-[.toast]:bg-slate-100 dark:group-[.toast]:bg-slate-800 group-[.toast]:text-slate-600 dark:group-[.toast]:text-slate-300",
        },
      }}
      style={
        {
          "--normal-bg": theme === "dark" ? "#131726" : "#ffffff",
          "--normal-text": theme === "dark" ? "#f1f5f9" : "#0f172a",
          "--normal-border": theme === "dark" ? "#23293e" : "#eaecf2",
          "--success-bg": theme === "dark" ? "#131726" : "#ffffff",
          "--success-text": theme === "dark" ? "#f1f5f9" : "#0f172a",
          "--success-border": theme === "dark" ? "#23293e" : "#eaecf2",
          "--error-bg": theme === "dark" ? "#131726" : "#ffffff",
          "--error-text": theme === "dark" ? "#f1f5f9" : "#0f172a",
          "--error-border": theme === "dark" ? "#23293e" : "#eaecf2",
          "--warning-bg": theme === "dark" ? "#131726" : "#ffffff",
          "--warning-text": theme === "dark" ? "#f1f5f9" : "#0f172a",
          "--warning-border": theme === "dark" ? "#23293e" : "#eaecf2",
          "--info-bg": theme === "dark" ? "#131726" : "#ffffff",
          "--info-text": theme === "dark" ? "#f1f5f9" : "#0f172a",
          "--info-border": theme === "dark" ? "#23293e" : "#eaecf2",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
