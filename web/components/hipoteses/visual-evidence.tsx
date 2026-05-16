"use client";

import { useRef, useState } from "react";
import { Plus, X, ExternalLink, ImageIcon, Link2, Upload } from "lucide-react";
import type {
  HypothesisImage,
  HypothesisPrototype,
} from "@/lib/discovery-data";

const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2MB

function detectSource(url: string): HypothesisPrototype["source"] {
  const u = url.toLowerCase();
  if (u.includes("figma.com")) return "figma";
  if (u.includes("maze.co")) return "maze";
  if (u.includes("invisionapp") || u.includes("invision.com")) return "invision";
  if (u.includes("framer.com") || u.includes("framer.website")) return "framer";
  return "other";
}

const sourceLabels: Record<NonNullable<HypothesisPrototype["source"]>, string> = {
  figma: "Figma",
  maze: "Maze",
  invision: "InVision",
  framer: "Framer",
  other: "Link",
};

const sourceColors: Record<NonNullable<HypothesisPrototype["source"]>, string> = {
  figma: "#a259ff",
  maze: "#3a1bff",
  invision: "#ff3366",
  framer: "#0099ff",
  other: "var(--fg-muted)",
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function VisualEvidence({
  prototypes,
  images,
  onChange,
}: {
  prototypes: HypothesisPrototype[];
  images: HypothesisImage[];
  onChange: (patch: { prototypes?: HypothesisPrototype[]; images?: HypothesisImage[] }) => void;
}) {
  return (
    <div className="mt-6 space-y-3">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--fg-faint)]">
        Evidências visuais
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div
          className="rounded-lg border bg-white"
          style={{ borderColor: "var(--border)" }}
        >
          <PrototypesPanel
            items={prototypes}
            onChange={(next) => onChange({ prototypes: next })}
          />
        </div>
        <div
          className="rounded-lg border bg-white"
          style={{ borderColor: "var(--border)" }}
        >
          <ImagesPanel
            items={images}
            onChange={(next) => onChange({ images: next })}
          />
        </div>
      </div>
    </div>
  );
}

function PrototypesPanel({
  items,
  onChange,
}: {
  items: HypothesisPrototype[];
  onChange: (next: HypothesisPrototype[]) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");

  const submit = () => {
    const u = url.trim();
    if (!u) return;
    let safe = u;
    if (!/^https?:\/\//i.test(safe)) safe = `https://${safe}`;
    const item: HypothesisPrototype = {
      id: uid(),
      label: label.trim() || safe.replace(/^https?:\/\//, "").slice(0, 40),
      url: safe,
      source: detectSource(safe),
      addedAt: new Date().toISOString(),
    };
    onChange([item, ...items]);
    setLabel("");
    setUrl("");
    setAdding(false);
  };

  return (
    <div className="p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[var(--fg)]">
          <Link2 size={13} className="text-[var(--fg-muted)]" />
          Protótipos
          <span className="text-[var(--fg-faint)]">({items.length})</span>
        </div>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] text-[var(--fg-muted)] hover:bg-[var(--bg-muted)]"
            style={{ borderColor: "var(--border)" }}
          >
            <Plus size={12} /> Adicionar
          </button>
        )}
      </div>

      {adding && (
        <div
          className="mb-2 space-y-1.5 rounded-md border bg-[var(--bg-muted)] p-2"
          style={{ borderColor: "var(--border)" }}
        >
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Rótulo (opcional)"
            className="w-full rounded-md border bg-white px-2 py-1.5 text-[12px] outline-none focus:border-[var(--primary)]"
            style={{ borderColor: "var(--border)" }}
          />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://figma.com/..."
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
              if (e.key === "Escape") {
                setAdding(false);
                setUrl("");
                setLabel("");
              }
            }}
            className="w-full rounded-md border bg-white px-2 py-1.5 text-[12px] outline-none focus:border-[var(--primary)]"
            style={{ borderColor: "var(--border)" }}
          />
          <div className="flex justify-end gap-1.5">
            <button
              onClick={() => {
                setAdding(false);
                setUrl("");
                setLabel("");
              }}
              className="rounded-md px-2 py-1 text-[11px] text-[var(--fg-muted)] hover:bg-white"
            >
              Cancelar
            </button>
            <button
              onClick={submit}
              disabled={!url.trim()}
              className="rounded-md px-2 py-1 text-[11px] font-semibold text-white disabled:opacity-50"
              style={{ backgroundColor: "var(--primary)" }}
            >
              Adicionar
            </button>
          </div>
        </div>
      )}

      {items.length === 0 && !adding ? (
        <p className="text-[12px] text-[var(--fg-faint)]">Nenhum protótipo vinculado.</p>
      ) : (
        <ul className="space-y-1">
          {items.map((p) => {
            const src = p.source ?? "other";
            return (
              <li
                key={p.id}
                className="group flex items-center gap-2 rounded-md border bg-white px-2 py-1.5 text-[12px] hover:bg-[var(--bg-muted)]"
                style={{ borderColor: "var(--border)" }}
              >
                <span
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[9px] font-bold text-white"
                  style={{ backgroundColor: sourceColors[src] }}
                >
                  {sourceLabels[src][0]}
                </span>
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-w-0 flex-1 items-center gap-1.5 text-[var(--fg)]"
                >
                  <span className="truncate">{p.label}</span>
                  <ExternalLink size={11} className="shrink-0 text-[var(--fg-faint)]" />
                </a>
                <span className="shrink-0 text-[10px] text-[var(--fg-faint)]">{sourceLabels[src]}</span>
                <button
                  onClick={() => onChange(items.filter((x) => x.id !== p.id))}
                  className="shrink-0 rounded p-0.5 text-[var(--fg-faint)] opacity-0 hover:bg-[var(--danger-soft)] hover:text-[var(--danger)] group-hover:opacity-100"
                  aria-label="Remover"
                >
                  <X size={12} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function ImagesPanel({
  items,
  onChange,
}: {
  items: HypothesisImage[];
  onChange: (next: HypothesisImage[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    const accepted: HypothesisImage[] = [];
    for (const f of Array.from(files)) {
      if (!f.type.startsWith("image/")) continue;
      if (f.size > MAX_IMAGE_BYTES) {
        setError(`"${f.name}" excede 2MB.`);
        continue;
      }
      const dataUrl = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result as string);
        r.onerror = rej;
        r.readAsDataURL(f);
      });
      accepted.push({
        id: uid(),
        name: f.name,
        dataUrl,
        size: f.size,
        addedAt: new Date().toISOString(),
      });
    }
    if (accepted.length) onChange([...accepted, ...items]);
  };

  return (
    <div className="p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[var(--fg)]">
          <ImageIcon size={13} className="text-[var(--fg-muted)]" />
          Imagens
          <span className="text-[var(--fg-faint)]">({items.length})</span>
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] text-[var(--fg-muted)] hover:bg-[var(--bg-muted)]"
          style={{ borderColor: "var(--border)" }}
        >
          <Upload size={12} /> Enviar
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {error && (
        <p className="mb-2 text-[11px] text-[var(--danger)]">{error}</p>
      )}

      {items.length === 0 ? (
        <button
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-1 rounded-md border border-dashed py-6 text-[12px] text-[var(--fg-faint)] hover:bg-[var(--bg-muted)]"
          style={{ borderColor: "var(--border)" }}
        >
          <ImageIcon size={18} />
          <span>Arraste ou clique para enviar imagens</span>
          <span className="text-[10px]">PNG, JPG até 2MB</span>
        </button>
      ) : (
        <ul className="grid grid-cols-3 gap-2">
          {items.map((img) => (
            <li key={img.id} className="group relative aspect-square overflow-hidden rounded-md border" style={{ borderColor: "var(--border)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.dataUrl} alt={img.name} className="h-full w-full object-cover" />
              <a
                href={img.dataUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/30"
                aria-label={`Abrir ${img.name}`}
              />
              <button
                onClick={() => onChange(items.filter((x) => x.id !== img.id))}
                className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100"
                aria-label="Remover"
              >
                <X size={11} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
