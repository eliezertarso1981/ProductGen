"use client";

import { useState, type FormEvent, type HTMLAttributes } from "react";
import { X } from "lucide-react";

export function SingleTagInput({
  value,
  onChange,
  suggestions,
  placeholder,
  inputMode,
}: {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  const [draft, setDraft] = useState("");
  const trimmedValue = value.trim();
  const reusableSuggestions = suggestions
    .map((suggestion) => suggestion.trim())
    .filter((suggestion, index, list) =>
      suggestion.length > 0 &&
      suggestion.toLocaleLowerCase("pt-BR") !== trimmedValue.toLocaleLowerCase("pt-BR") &&
      list.findIndex((item) => item.toLocaleLowerCase("pt-BR") === suggestion.toLocaleLowerCase("pt-BR")) === index
    );

  function commitDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextValue = draft.trim();
    if (!nextValue) return;
    onChange(nextValue);
    setDraft("");
  }

  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--bg)] p-2 focus-within:border-[var(--primary)] focus-within:shadow-[0_0_0_3px_rgba(19,200,181,0.15)]">
      <div className="flex flex-wrap items-center gap-1.5">
        {trimmedValue && (
          <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[rgba(19,200,181,0.30)] bg-[var(--primary-soft)] px-2.5 py-1 text-[12px] font-medium text-[var(--primary)]">
            <span className="truncate">{trimmedValue}</span>
            <button
              type="button"
              onClick={() => onChange("")}
              className="rounded-full p-0.5 text-[var(--primary)] hover:bg-[var(--primary-soft)]"
              aria-label={`Remover ${trimmedValue}`}
              title="Limpar valor"
            >
              <X size={12} aria-hidden />
            </button>
          </span>
        )}
        <form onSubmit={commitDraft} className="flex min-w-[160px] flex-1 items-center gap-1.5">
          <input
            name="tagValue"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            inputMode={inputMode}
            placeholder={trimmedValue ? "Adicionar novo valor..." : placeholder}
            className="min-w-0 flex-1 bg-transparent px-1 py-1 text-[13px] text-[var(--fg)] outline-none placeholder:text-[var(--fg-faint)]"
          />
          <button
            type="submit"
            className="rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-1 text-[11px] font-medium text-[var(--fg-muted)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-muted)] hover:text-[var(--fg)]"
          >
            Adicionar
          </button>
        </form>
      </div>

      {reusableSuggestions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5 border-t border-[var(--border-soft)] pt-2">
          <span className="self-center text-[11px] font-medium text-[var(--fg-faint)]">Reutilizar:</span>
          {reusableSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => onChange(suggestion)}
              className="rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-1 text-[11px] font-medium text-[var(--fg-muted)] hover:border-[rgba(19,200,181,0.35)] hover:bg-[var(--primary-soft-2)] hover:text-[var(--primary)]"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function MultiTagInput({
  values,
  onChange,
  suggestions,
  placeholder,
}: {
  values: string[];
  onChange: (values: string[]) => void;
  suggestions: string[];
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");
  const normalizedValues = uniqueTags(values);
  const reusableSuggestions = uniqueTags(suggestions).filter(
    (suggestion) => !hasTag(normalizedValues, suggestion),
  );

  function addTags(nextValues: string[]) {
    const nextTags = uniqueTags([...normalizedValues, ...nextValues]);
    if (nextTags.length === normalizedValues.length) return;

    onChange(nextTags);
    setDraft("");
  }

  function commitDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    addTags(splitTags(draft));
  }

  function removeTag(tag: string) {
    onChange(normalizedValues.filter((value) => normalizeTag(value) !== normalizeTag(tag)));
  }

  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--bg)] p-2 focus-within:border-[var(--primary)] focus-within:shadow-[0_0_0_3px_rgba(19,200,181,0.15)]">
      <div className="flex flex-wrap items-center gap-1.5">
        {normalizedValues.map((tag) => (
          <TagChip key={tag} value={tag} onRemove={() => removeTag(tag)} />
        ))}
        <form onSubmit={commitDraft} className="flex min-w-[180px] flex-1 items-center gap-1.5">
          <input
            name="tagValue"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={normalizedValues.length > 0 ? "Adicionar ferramenta..." : placeholder}
            className="min-w-0 flex-1 bg-transparent px-1 py-1 text-[13px] text-[var(--fg)] outline-none placeholder:text-[var(--fg-faint)]"
          />
          <button
            type="submit"
            className="rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-1 text-[11px] font-medium text-[var(--fg-muted)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-muted)] hover:text-[var(--fg)]"
          >
            Adicionar
          </button>
        </form>
      </div>

      {reusableSuggestions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5 border-t border-[var(--border-soft)] pt-2">
          <span className="self-center text-[11px] font-medium text-[var(--fg-faint)]">Reutilizar:</span>
          {reusableSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => addTags([suggestion])}
              className="rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-1 text-[11px] font-medium text-[var(--fg-muted)] hover:border-[rgba(19,200,181,0.35)] hover:bg-[var(--primary-soft-2)] hover:text-[var(--primary)]"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function TagChip({ value, onRemove }: { value: string; onRemove: () => void }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[rgba(19,200,181,0.30)] bg-[var(--primary-soft)] px-2.5 py-1 text-[12px] font-medium text-[var(--primary)]">
      <span className="truncate">{value}</span>
      <button
        type="button"
        onClick={onRemove}
        className="rounded-full p-0.5 text-[var(--primary)] hover:bg-[var(--primary-soft)]"
        aria-label={`Remover ${value}`}
        title="Remover tag"
      >
        <X size={12} aria-hidden />
      </button>
    </span>
  );
}

function splitTags(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function uniqueTags(values: string[]): string[] {
  const seen = new Set<string>();

  return values.reduce<string[]>((acc, value) => {
    const tag = value.trim();
    const key = normalizeTag(tag);
    if (!tag || seen.has(key)) return acc;

    seen.add(key);
    acc.push(tag);
    return acc;
  }, []);
}

function hasTag(values: string[], tag: string): boolean {
  const key = normalizeTag(tag);
  return values.some((value) => normalizeTag(value) === key);
}

function normalizeTag(value: string): string {
  return value.trim().toLocaleLowerCase("pt-BR");
}
