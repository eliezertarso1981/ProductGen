"use client";

import { useAuthTheme, palette } from "@/lib/theme";
import { ThemeToggle } from "./theme-toggle";
import { TestimonialPanel } from "./testimonial-panel";
import type { AuthTheme } from "@/lib/theme";

interface AuthShellProps {
  children: (theme: AuthTheme) => React.ReactNode;
  showFooter?: boolean;
}

export function AuthShell({ children, showFooter = true }: AuthShellProps) {
  const [theme, setTheme, ready] = useAuthTheme();
  const p = palette[theme];

  if (!ready) {
    return <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-elevated)" }} />;
  }

  return (
    <div
      className="grid min-h-screen grid-cols-1 md:grid-cols-2"
      style={{ backgroundColor: p.canvas }}
    >
      <div className="relative flex flex-col px-6 py-10 md:px-16 md:py-12">
        <div className="absolute right-6 top-6 md:right-10 md:top-10">
          <ThemeToggle
            theme={theme}
            onToggle={() => setTheme(theme === "dark" ? "light" : "dark")}
          />
        </div>

        <div className="flex w-full flex-1 flex-col">
          <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center">
            {children(theme)}
          </div>

          {showFooter && (
            <div
              className="mx-auto mt-10 hidden w-full max-w-sm items-center justify-between text-xs md:flex"
              style={{ color: p.textSecondary }}
            >
              <span>© 2025 ProductGen, Inc.</span>
              <div className="flex gap-5">
                <a href="#" className="hover:opacity-80">
                  Privacidade
                </a>
                <a href="#" className="hover:opacity-80">
                  Termos
                </a>
                <a href="#" className="hover:opacity-80">
                  Status
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      <TestimonialPanel />
    </div>
  );
}
