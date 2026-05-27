import { useEffect, useMemo, useRef, useState } from "react";
import { streamImage } from "@/lib/streamImage";
import {
  enhancePrompt,
  EXAMPLE_PROMPTS,
  suggestImprovements,
  type PosterStyle,
} from "@/lib/enhancePrompt";
import {
  Sparkles,
  Download,
  RefreshCw,
  Pencil,
  Wand2,
  Image as ImageIcon,
  History,
  Trash2,
  Zap,
} from "lucide-react";

const STYLES: PosterStyle[] = ["Cinematic", "Anime", "Realistic", "Cyberpunk"];
const HISTORY_KEY = "ai-poster-history-v1";

type HistoryItem = {
  id: string;
  prompt: string;
  style: PosterStyle;
  image: string;
  createdAt: number;
};

function loadHistory(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export default function PosterStudio() {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState<PosterStyle>("Cinematic");
  const [image, setImage] = useState<string | null>(null);
  const [isFinal, setIsFinal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [editing, setEditing] = useState(true);
  const abortRef = useRef<AbortController | null>(null);
  const resultRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const tips = useMemo(() => suggestImprovements(prompt), [prompt]);
  const enhanced = useMemo(
    () => (prompt.trim() ? enhancePrompt(prompt, style) : ""),
    [prompt, style],
  );

  async function handleGenerate(p = prompt, s = style) {
    const text = p.trim();
    if (!text) {
      setError("Type a prompt first — describe your poster.");
      return;
    }
    setError(null);
    setLoading(true);
    setIsFinal(false);
    setImage(null);
    setEditing(false);
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const finalPrompt = enhancePrompt(text, s);

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
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      console.error(e);
      setError((e as Error).message || "Image generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Save to history when a final image arrives
  useEffect(() => {
    if (!isFinal || !image) return;
    const item: HistoryItem = {
      id: crypto.randomUUID(),
      prompt,
      style,
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
    setPrompt(item.prompt);
    setStyle(item.style);
    setImage(item.image);
    setIsFinal(true);
    setEditing(false);
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

  return (
    <div className="min-h-screen w-full">
      {/* Nav */}
      <header className="sticky top-0 z-30 glass border-b border-border/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[oklch(0.72_0.27_330)] to-[oklch(0.65_0.25_295)] shadow-[0_0_24px_oklch(0.72_0.27_330_/_0.6)]">
              <Zap className="h-5 w-5 text-black" strokeWidth={2.5} />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-bold tracking-wide">AI POSTER STUDIO</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Gaming · YouTube · Creative
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
          Generate <span className="gradient-text neon-text">epic gaming posters</span>
          <br className="hidden sm:block" />
          from a single prompt
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base sm:text-lg text-muted-foreground">
          Type a simple idea. We auto-enhance it into a cinematic, 4K, ultra-detailed prompt and
          render it into a poster fit for YouTube thumbnails, key art, and Discord banners.
        </p>
      </section>

      {/* Studio */}
      <section id="studio" className="mx-auto max-w-6xl px-5 pb-20">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Prompt panel */}
          <div className="neon-border glass rounded-2xl p-5 sm:p-6">
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-neon-cyan">
              <Wand2 className="h-3.5 w-3.5" /> Your idea
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Cyberpunk samurai standing on a rainy Tokyo rooftop with a glowing katana"
              className="mt-2 w-full resize-none rounded-xl border border-border bg-input/60 px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/70 outline-none focus:border-[oklch(0.72_0.27_330)] focus:ring-2 focus:ring-[oklch(0.72_0.27_330_/_0.35)] min-h-[120px]"
              disabled={loading}
            />

            {/* Style selector */}
            <div className="mt-4">
              <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Style
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {STYLES.map((s) => {
                  const active = s === style;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStyle(s)}
                      disabled={loading}
                      className={
                        "rounded-full px-4 py-1.5 text-sm font-medium transition-all border " +
                        (active
                          ? "border-transparent text-black bg-gradient-to-r from-[oklch(0.78_0.22_200)] to-[oklch(0.72_0.27_330)] shadow-[0_0_20px_oklch(0.72_0.27_330_/_0.5)]"
                          : "border-border bg-secondary/50 text-foreground/80 hover:bg-secondary")
                      }
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tips */}
            {tips.length > 0 && (
              <div className="mt-4 rounded-xl border border-border/70 bg-secondary/30 p-3">
                <div className="text-[11px] font-semibold uppercase tracking-widest text-neon-cyan">
                  Prompt tips
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

            {/* Enhanced preview */}
            {enhanced && (
              <details className="mt-4 rounded-xl border border-border/70 bg-background/40 p-3 text-sm">
                <summary className="cursor-pointer text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Enhanced prompt preview
                </summary>
                <p className="mt-2 text-muted-foreground leading-relaxed">{enhanced}</p>
              </details>
            )}

            {/* CTA */}
            <button
              type="button"
              onClick={() => handleGenerate()}
              disabled={loading}
              className="btn-glow mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-base font-bold"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  Rendering your poster…
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

            {/* Examples */}
            <div className="mt-6">
              <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Example prompts
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {EXAMPLE_PROMPTS.map((ex) => (
                  <button
                    key={ex.label}
                    type="button"
                    onClick={() => {
                      setPrompt(ex.prompt);
                      setStyle(ex.style);
                    }}
                    disabled={loading}
                    className="rounded-full border border-border bg-secondary/40 px-3 py-1.5 text-xs text-foreground/85 hover:border-[oklch(0.72_0.27_330_/_0.6)] hover:bg-secondary"
                  >
                    {ex.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Result panel */}
          <div ref={resultRef} className="neon-border glass rounded-2xl p-5 sm:p-6 flex flex-col">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-neon-pink">
                <ImageIcon className="h-3.5 w-3.5" /> Poster
              </div>
              {image && isFinal && (
                <span className="rounded-full bg-neon-cyan/15 px-2.5 py-0.5 text-[10px] uppercase tracking-widest text-neon-cyan">
                  Ready
                </span>
              )}
            </div>

            <div className="relative mt-3 aspect-square w-full overflow-hidden rounded-xl border border-border bg-background/60">
              {!image && !loading && (
                <div className="absolute inset-0 grid place-items-center text-center px-6">
                  <div className="float-slow">
                    <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-[oklch(0.78_0.22_200)] to-[oklch(0.72_0.27_330)] shadow-[0_0_40px_oklch(0.72_0.27_330_/_0.45)]">
                      <Sparkles className="h-7 w-7 text-black" />
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
                      <p className="mt-3 text-sm text-muted-foreground">
                        Conjuring pixels…
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {image && (
                <img
                  src={image}
                  alt="Generated poster"
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
            <div className="mt-4 grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={download}
                disabled={!image || !isFinal}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary/60 px-3 py-2.5 text-sm font-medium hover:bg-secondary disabled:opacity-50"
              >
                <Download className="h-4 w-4" /> Download
              </button>
              <button
                type="button"
                onClick={() => handleGenerate()}
                disabled={loading || !prompt.trim()}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary/60 px-3 py-2.5 text-sm font-medium hover:bg-secondary disabled:opacity-50"
              >
                <RefreshCw className="h-4 w-4" /> Regenerate
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(true);
                  setTimeout(
                    () => document.getElementById("studio")?.scrollIntoView({ behavior: "smooth" }),
                    50,
                  );
                }}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary/60 px-3 py-2.5 text-sm font-medium hover:bg-secondary"
              >
                <Pencil className="h-4 w-4" /> Edit prompt
              </button>
            </div>

            {prompt && !editing && (
              <p className="mt-3 text-xs text-muted-foreground line-clamp-2">
                <span className="text-foreground/80 font-medium">Prompt:</span> {prompt}
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
                    alt={h.prompt}
                    className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-2.5">
                    <div className="text-[10px] uppercase tracking-widest text-neon-cyan">
                      {h.style}
                    </div>
                    <div className="line-clamp-2 text-xs text-white/90">{h.prompt}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <footer className="border-t border-border/60 py-8 text-center text-xs text-muted-foreground">
        Built with Lovable AI · Posters generated on demand
      </footer>
    </div>
  );
}
