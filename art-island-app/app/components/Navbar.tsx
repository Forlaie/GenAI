"use client";

import { useRouter } from "next/navigation";
import { LogOut, Moon, Sun, ArrowLeft } from "lucide-react";

interface NavbarProps {
  title: string;
  subtitle?: string;
  rightChild?: React.ReactNode;
  darkMode: boolean;
  onDarkModeToggle: () => void;
  showBackButton?: boolean;
}

export function Navbar({
  title,
  subtitle,
  rightChild,
  darkMode,
  onDarkModeToggle,
  showBackButton,
}: NavbarProps) {
  const router = useRouter();

  const bgColor = darkMode ? "rgba(15,35,54,0.9)" : "rgba(255,255,255,0.9)";
  const borderColor = darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const textMain = darkMode ? "#f0f6ff" : "#1a1a1a";
  const textMuted = darkMode ? "#7ea8c4" : "#888780";
  const btnBg = darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)";

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/");
  }

  return (
    <div
      className="fixed top-0 left-0 right-0 z-20 flex items-center justify-between px-4 sm:px-5 py-2.5"
      style={{
        background: bgColor,
        borderBottom: `1px solid ${borderColor}`,
        backdropFilter: "blur(14px)",
      }}
    >
      <div className="shrink-0">
        <h1
          className="text-sm sm:text-base font-semibold leading-tight"
          style={{ color: textMain }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className="text-[10px] hidden sm:block"
            style={{ color: textMuted }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {rightChild && (
        <div className="flex-1 flex items-center justify-center">
          {rightChild}
        </div>
      )}

      <div className="flex items-center gap-1 shrink-0">
        {showBackButton && (
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full transition-colors flex items-center gap-1.5"
            style={{
              backgroundColor: btnBg,
              color: textMain,
            }}
            title="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline text-sm">Back</span>
          </button>
        )}
        <button
          onClick={onDarkModeToggle}
          className="p-2 rounded-full transition-colors"
          style={{
            backgroundColor: btnBg,
            color: textMain,
          }}
          title="Toggle dark mode"
        >
          {darkMode ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </button>
        <button
          onClick={handleLogout}
          className="p-2 rounded-full transition-colors"
          style={{
            backgroundColor: btnBg,
            color: textMain,
          }}
          title="Log out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
