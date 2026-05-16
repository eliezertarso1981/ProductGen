"use client";

import { useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff, type LucideIcon } from "lucide-react";
import type { AuthTheme } from "@/lib/theme";
import { palette, brand } from "@/lib/theme";

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  icon: LucideIcon;
  theme: AuthTheme;
  type?: "text" | "email" | "password";
  error?: boolean;
  trailing?: React.ReactNode;
}

export function TextField({
  label,
  icon: Icon,
  theme,
  type = "text",
  error = false,
  trailing,
  id,
  ...props
}: TextFieldProps) {
  const p = palette[theme];
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (show ? "text" : "password") : type;
  const fieldId = id ?? props.name ?? label.toLowerCase();
  const borderColor = error ? brand.danger : p.border;

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={fieldId}
          className="block text-[11px] font-semibold uppercase tracking-wider"
          style={{ color: p.textSecondary }}
        >
          {label}
        </label>
      )}
      <div
        className="relative flex items-center rounded-xl border transition-colors"
        style={{
          borderColor,
          backgroundColor: p.inputBg,
        }}
      >
        <span className="pointer-events-none flex h-11 w-11 items-center justify-center">
          <Icon size={16} color={error ? brand.danger : p.textMuted} />
        </span>
        <input
          {...props}
          id={fieldId}
          type={inputType}
          className="flex-1 bg-transparent py-2.5 pr-3 text-sm outline-none placeholder:text-[color:var(--fg-faint)]"
          style={{ color: p.textPrimary }}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Ocultar senha" : "Mostrar senha"}
            className="flex h-11 w-11 items-center justify-center"
          >
            {show ? (
              <EyeOff size={16} color={p.textMuted} />
            ) : (
              <Eye size={16} color={p.textMuted} />
            )}
          </button>
        ) : (
          trailing
        )}
      </div>
    </div>
  );
}
