import { useEffect, useMemo, useRef, useState } from "react";
import { streamImage } from "@/lib/streamImage";
import {
  buildPosterPrompt,
  suggestImprovements,
  POSTER_TYPES,
  STYLES,
  COLOR_MOODS,
  ORIENTATIONS,
  TEMPLATES,
  type PosterFields,
  type PosterType,
  type PosterStyle,
  type ColorMood,
  type Orientation,
} from "@/lib/enhancePrompt";
import {
  Sparkles,
  Download,
  RefreshCw,
  Wand2,
  Image as ImageIcon,
  History,
  Trash2,
  Hammer,
  Copy,
  Check,
} from "lucide-react";

const HISTORY_KEY = "posterforge-history-v2";

type HistoryItem = {
  id: string;
  fields: PosterFields;
  image: string;
  createdAt: number;
};

const DEFAULT_FIELDS: PosterFields = {
  type: "Event",
  title: "",
  subtitle: "",
  dateTime: "",
  location: "",
  cta: "",
  details: "",
  style: "Modern",
  mood: "Vibrant",
  orientation: "Portrait",
};

function loadHistory(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]");
  } catch {
    return [];
  }
}

// Which extra fields are most relevant for each type (we still show all, but reorder/highlight)
const FIELD_HINTS: Record<PosterType, string[]> = {
  Event: ["dateTime", "location", "cta"],
  Business: ["subtitle", "cta", "details"],
  Movie: ["subtitle", "dateTime"],
  Music: ["dateTime", "location", "cta"],
  Sports: ["dateTime", "location"],
  Sale: ["dateTime", "cta", "details"],
  Birthday: ["dateTime", "location", "cta"],
  Wedding: ["dateTime", "location"],
  Conference: ["dateTime", "location", "cta"],
  Fitness: ["cta", "details"],
  "Real Estate": ["location", "cta", "details"],
  Education: ["dateTime", "cta", "details"],
  Food: ["details", "cta"],
  Motivational: ["subtitle"],
  Gaming: ["subtitle", "dateTime"],
  Custom: ["subtitle", "details"],
};

export default function PosterStudio() {
  const [fields, setFields] = useState<PosterFields>(DEFAULT_FIELDS);
  const [image, setImage] = useState<string | null>(null);
  const [isFinal, setIsFinal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [copied, setCopied] = useState(false);
  const [customPrompt, setCustomPrompt] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const resultRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const tips = useMemo(() => suggestImprovements(fields), [fields]);
  const enhanced = useMemo(() => buildPosterPrompt(fields), [fields]);
  const hints = FIELD_HINTS[fields.type] ?? [];

  function update<K extends keyof PosterFields>(key: K, value: PosterFields[K]) {
    setFields((f) => ({ ...f, [key]: value }));
  }

  async function handleGenerate() {
    if (!fields.title.trim()) {
      setError("Add a main headline first — it's the heart of your poster.");
      return;
    }
    setError(null);
    setLoading(true);
    setIsFinal(false);
    setImage(null);
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const finalPrompt = customPrompt?.trim() || buildPosterPrompt(fields);

    try {
      await streamImage(
        "/api/generate-image",
        finalPrompt,
        (dataUrl, final) => {
          setImage(dataUrl);
          if (final) setIsFinal(true);
        },
        ctrl.signal,
      );
      setTimeout(
        () => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
        50,
      );
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      console.error(e);
      setError((e as Error).message || "Image generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isFinal || !image) return;
    const item: HistoryItem = {
      id: crypto.randomUUID(),
      fields,
      image,
      createdAt: Date.now(),
    };
    const next = [item, ...history].slice(0, 12);
    setHistory(next);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    } catch {
      /* quota */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFinal]);

  function clearHistory() {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  }

  function loadFromHistory(item: HistoryItem) {
    setFields(item.fields);
    setImage(item.image);
    setIsFinal(true);
    setCustomPrompt(null);
  }

  function applyTemplate(t: (typeof TEMPLATES)[number]) {
    setFields({ ...DEFAULT_FIELDS, ...t.fields });
    setCustomPrompt(null);
  }

  function download() {
    if (!image) return;
    const a = document.createElement("a");
    a.href = image;
    a.download = `poster-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(enhanced);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  const orientationAspect: Record<Orientation, string> = {
    Portrait: "aspect-[2/3]",
    Square: "aspect-square",
    Landscape: "aspect-[3/2]",
  };

  return (
    <div className="min-h-screen w-full">
      {/* Nav */}
      <header className="sticky top-0 z-30 glass border-b border-border/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[oklch(0.72_0.27_330)] to-[oklch(0.65_0.25_295)] shadow-[0_0_24px_oklch(0.72_0.27_330_/_0.6)]">
              <Hammer className="h-5 w-5 text-black" strokeWidth={2.5} />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-bold tracking-wide">POSTERFORGE AI</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Any poster · Any occasion
              </div>
            </div>
          </div>
          <a
            href="#studio"
            className="hidden sm:inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-4 py-1.5 text-xs font-medium text-foreground/80 hover:bg-secondary"
          >
            <Sparkles className="h-3.5 w-3.5" /> Start creating
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-5 pt-14 pb-8 text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-secondary/40 px-3 py-1 text-xs text-muted-foreground">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-neon-pink opacity-70 pulse-ring"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-neon-pink"></span>
          </span>
          Powered by Lovable AI
        </div>
        <h1 className="mt-5 text-4xl sm:text-6xl font-extrabold tracking-tight">
          Forge <span className="gradient-text neon-text">any poster</span>
          <br className="hidden sm:block" />
          from your idea
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base sm:text-lg text-muted-foreground">
          Pick a type, fill in your content — title, date, location, CTA — and AI designs a
          print-ready poster with real, legible text. Events, sales, weddings, movies, gaming and
          more.
        </p>
      </section>

      {/* Templates */}
      <section className="mx-auto max-w-6xl px-5 pb-4">
        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Quick templates
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.label}
              type="button"
              onClick={() => applyTemplate(t)}
              disabled={loading}
              className="rounded-full border border-border bg-secondary/40 px-3 py-1.5 text-xs text-foreground/85 hover:border-[oklch(0.72_0.27_330_/_0.6)] hover:bg-secondary"
            >
              {t.label}
            </button>
          ))}
        </div>
      </section>

      {/* Studio */}
      <section id="studio" className="mx-auto max-w-6xl px-5 pb-20">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Form panel */}
          <div className="neon-border glass rounded-2xl p-5 sm:p-6">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-neon-cyan">
              <Wand2 className="h-3.5 w-3.5" /> Poster content
            </div>

            {/* Type */}
            <div className="mt-4">
              <Label>Poster type</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {POSTER_TYPES.map((t) => {
                  const active = t === fields.type;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => update("type", t)}
                      disabled={loading}
                      className={
                        "rounded-full px-3 py-1.5 text-xs font-medium transition-all border " +
                        (active
                          ? "border-transparent text-black bg-gradient-to-r from-[oklch(0.78_0.22_200)] to-[oklch(0.72_0.27_330)] shadow-[0_0_16px_oklch(0.72_0.27_330_/_0.4)]"
                          : "border-border bg-secondary/50 text-foreground/80 hover:bg-secondary")
                      }
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Core fields */}
            <div className="mt-5 grid gap-3">
              <Field
                label="Title / Headline *"
                value={fields.title}
                onChange={(v) => update("title", v)}
                placeholder="e.g. Black Friday Mega Sale"
                disabled={loading}
              />
              <Field
                label="Subtitle / Tagline"
                value={fields.subtitle ?? ""}
                onChange={(v) => update("subtitle", v)}
                placeholder="e.g. Up to 70% off everything"
                disabled={loading}
                highlight={hints.includes("subtitle")}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label="Date & time"
                  value={fields.dateTime ?? ""}
                  onChange={(v) => update("dateTime", v)}
                  placeholder="Sat, July 20 · 8 PM"
                  disabled={loading}
                  highlight={hints.includes("dateTime")}
                />
                <Field
                  label="Location / Venue"
                  value={fields.location ?? ""}
                  onChange={(v) => update("location", v)}
                  placeholder="Skyline Lounge, Mumbai"
                  disabled={loading}
                  highlight={hints.includes("location")}
                />
              </div>
              <Field
                label="Call to action"
                value={fields.cta ?? ""}
                onChange={(v) => update("cta", v)}
                placeholder="Book Now · Register · Get Tickets"
                disabled={loading}
                highlight={hints.includes("cta")}
              />
              <div>
                <Label>Extra details</Label>
                <textarea
                  value={fields.details ?? ""}
                  onChange={(e) => update("details", e.target.value)}
                  placeholder="Speakers, menu items, prices, sponsors…"
                  disabled={loading}
                  className="mt-1.5 w-full resize-none rounded-xl border border-border bg-input/60 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-[oklch(0.72_0.27_330)] focus:ring-2 focus:ring-[oklch(0.72_0.27_330_/_0.3)] min-h-[72px]"
                />
              </div>
            </div>

            {/* Style + Mood + Orientation */}
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <Select
                label="Style"
                value={fields.style}
                onChange={(v) => update("style", v as PosterStyle)}
                options={STYLES}
                disabled={loading}
              />
              <Select
                label="Color mood"
                value={fields.mood}
                onChange={(v) => update("mood", v as ColorMood)}
                options={COLOR_MOODS}
                disabled={loading}
              />
              <Select
                label="Orientation"
                value={fields.orientation}
                onChange={(v) => update("orientation", v as Orientation)}
                options={ORIENTATIONS}
                disabled={loading}
              />
            </div>

            {/* Tips */}
            {tips.length > 0 && (
              <div className="mt-4 rounded-xl border border-border/70 bg-secondary/30 p-3">
                <div className="text-[11px] font-semibold uppercase tracking-widest text-neon-cyan">
                  Suggestions
                </div>
                <ul className="mt-1.5 space-y-1 text-sm text-muted-foreground">
                  {tips.map((t) => (
                    <li key={t} className="flex gap-2">
                      <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neon-pink" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Advanced prompt */}
            <details className="mt-4 rounded-xl border border-border/70 bg-background/40 p-3 text-sm">
              <summary className="cursor-pointer text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Advanced · View / edit AI prompt
              </summary>
              <textarea
                value={customPrompt ?? enhanced}
                onChange={(e) => setCustomPrompt(e.target.value)}
                className="mt-2 w-full resize-y rounded-lg border border-border bg-input/60 px-3 py-2 text-xs text-muted-foreground min-h-[120px] outline-none focus:border-[oklch(0.72_0.27_330)]"
              />
              <div className="mt-2 flex justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setCustomPrompt(null)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Reset to auto-generated
                </button>
                <button
                  type="button"
                  onClick={copyPrompt}
                  className="inline-flex items-center gap-1.5 text-xs text-neon-cyan hover:text-foreground"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied" : "Copy prompt"}
                </button>
              </div>
            </details>

            {/* CTA */}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading}
              className="btn-glow mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-base font-bold"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  Forging your poster…
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Generate Poster
                </>
              )}
            </button>
            {error && (
              <div className="mt-3 rounded-lg border border-destructive/40 bg-destructive/15 px-3 py-2 text-sm text-destructive-foreground">
                {error}
              </div>
            )}
          </div>

          {/* Result panel */}
          <div ref={resultRef} className="neon-border glass rounded-2xl p-5 sm:p-6 flex flex-col">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-neon-pink">
                <ImageIcon className="h-3.5 w-3.5" /> Preview
              </div>
              {image && isFinal && (
                <span className="rounded-full bg-neon-cyan/15 px-2.5 py-0.5 text-[10px] uppercase tracking-widest text-neon-cyan">
                  Ready
                </span>
              )}
            </div>

            <div
              className={
                "relative mt-3 w-full overflow-hidden rounded-xl border border-border bg-background/60 " +
                orientationAspect[fields.orientation]
              }
            >
              {!image && !loading && (
                <div className="absolute inset-0 grid place-items-center text-center px-6">
                  <div className="float-slow">
                    <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-[oklch(0.78_0.22_200)] to-[oklch(0.72_0.27_330)] shadow-[0_0_40px_oklch(0.72_0.27_330_/_0.45)]">
                      <Hammer className="h-7 w-7 text-black" />
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">
                      Your poster will appear here.
                    </p>
                  </div>
                </div>
              )}

              {loading && !image && (
                <div className="absolute inset-0">
                  <div className="absolute inset-0 shimmer opacity-60" />
                  <div className="absolute inset-0 grid place-items-center">
                    <div className="text-center">
                      <RefreshCw className="mx-auto h-8 w-8 animate-spin text-neon-pink" />
                      <p className="mt-3 text-sm text-muted-foreground">Forging pixels…</p>
                    </div>
                  </div>
                </div>
              )}

              {image && (
                <img
                  src={image}
                  alt={fields.title || "Generated poster"}
                  className={
                    "h-full w-full object-cover transition-[filter,transform] duration-500 " +
                    (isFinal ? "blur-0 scale-100" : "blur-2xl scale-105")
                  }
                />
              )}
              {image && !isFinal && (
                <div className="absolute bottom-3 left-3 rounded-full bg-black/60 px-3 py-1 text-[11px] uppercase tracking-widest text-neon-cyan backdrop-blur">
                  Rendering preview…
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={download}
                disabled={!image || !isFinal}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary/60 px-3 py-2.5 text-sm font-medium hover:bg-secondary disabled:opacity-50"
              >
                <Download className="h-4 w-4" /> Download PNG
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading || !fields.title.trim()}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary/60 px-3 py-2.5 text-sm font-medium hover:bg-secondary disabled:opacity-50"
              >
                <RefreshCw className="h-4 w-4" /> Regenerate
              </button>
            </div>

            {fields.title && (
              <p className="mt-3 text-xs text-muted-foreground">
                <span className="text-foreground/80 font-medium">{fields.type}</span> ·{" "}
                {fields.title}
              </p>
            )}
          </div>
        </div>

        {/* History */}
        <div className="mt-12">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <History className="h-5 w-5 text-neon-cyan" /> Your recent posters
            </h2>
            {history.length > 0 && (
              <button
                onClick={clearHistory}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" /> Clear history
              </button>
            )}
          </div>
          {history.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Posters you generate are saved here on this device.
            </p>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {history.map((h) => (
                <button
                  key={h.id}
                  onClick={() => loadFromHistory(h)}
                  className="group relative overflow-hidden rounded-xl border border-border bg-card text-left transition-all hover:border-[oklch(0.72_0.27_330_/_0.6)]"
                >
                  <img
                    src={h.image}
                    alt={h.fields.title}
                    className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-2.5">
                    <div className="text-[10px] uppercase tracking-widest text-neon-cyan">
                      {h.fields.type} · {h.fields.style}
                    </div>
                    <div className="line-clamp-2 text-xs text-white/90">{h.fields.title}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <footer className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        PosterForge AI · Built with Lovable
      </footer>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  disabled,
  highlight,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  highlight?: boolean;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={
          "mt-1.5 w-full rounded-xl border bg-input/60 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-[oklch(0.72_0.27_330)] focus:ring-2 focus:ring-[oklch(0.72_0.27_330_/_0.3)] " +
          (highlight ? "border-[oklch(0.78_0.22_200_/_0.55)]" : "border-border")
        }
      />
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  disabled?: boolean;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="mt-1.5 w-full rounded-xl border border-border bg-input/60 px-3 py-2.5 text-sm text-foreground outline-none focus:border-[oklch(0.72_0.27_330)] focus:ring-2 focus:ring-[oklch(0.72_0.27_330_/_0.3)]"
      >
        {options.map((o) => (
          <option key={o} value={o} className="bg-background">
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
