export function RouteSpinner({ label = "Carregando…" }: { label?: string }) {
  return (
    <div
      className="flex h-full min-h-[60vh] w-full flex-col items-center justify-center gap-6"
      role="status"
      aria-live="polite"
    >
      <div className="lightsaber-loader" aria-hidden>
        <span className="lightsaber ls-left ls-green" />
        <span className="lightsaber ls-right ls-red" />
        <span className="ls-particles ls-part-1" />
        <span className="ls-particles ls-part-2" />
        <span className="ls-particles ls-part-3" />
        <span className="ls-particles ls-part-4" />
        <span className="ls-particles ls-part-5" />
      </div>
      <span className="text-[13px] font-medium" style={{ color: "var(--fg-subtle)" }}>
        {label}
      </span>
    </div>
  );
}
