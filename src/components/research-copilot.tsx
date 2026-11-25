"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  buildCustomQuerySynthesis,
  buildPresetSynthesis,
  type LensId,
} from "@/data/copilot-engine";
import type { ExperienceGroup, Publication } from "@/data/site";

const PRESETS: Array<{ id: Exclude<LensId, "custom">; label: string; topicSync: string }> = [
  { id: "overview", label: "Overview", topicSync: "All" },
  { id: "mllms", label: "MLLMs & Audio-Video", topicSync: "MLLMs" },
  { id: "agents", label: "Agentic AI & Safety", topicSync: "Agentic AI" },
  { id: "world-models", label: "World Models & Robotics", topicSync: "World Models" },
];

function PixelMatrix({ active }: { active: boolean }) {
  return (
    <span className={`affect-pixel-matrix ${active ? "is-thinking" : "is-idle"}`} aria-hidden="true">
      {Array.from({ length: 9 }).map((_, idx) => (
        <span key={idx} className="affect-pixel-dot" style={{ animationDelay: `${(idx % 4) * 90}ms` }} />
      ))}
    </span>
  );
}

export function ResearchCopilot({
  publications,
  experienceGroups,
  profileName,
}: {
  publications: Publication[];
  experienceGroups: ExperienceGroup[];
  profileName: string;
}) {
  const [activeLens, setActiveLens] = useState<LensId>("overview");
  const [customQuery, setCustomQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [phase, setPhase] = useState<"idle" | "thinking">("idle");
  const [stepIndex, setStepIndex] = useState(0);
  const [traceOpen, setTraceOpen] = useState(false);
  const [activeCitation, setActiveCitation] = useState<number | null>(null);
  const timersRef = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  }, []);

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  const payload = useMemo(() => {
    if (activeLens === "custom" && submittedQuery.trim()) {
      return buildCustomQuerySynthesis(submittedQuery, publications, experienceGroups, profileName);
    }
    const presetKey = activeLens === "custom" ? "overview" : activeLens;
    return buildPresetSynthesis(presetKey, publications);
  }, [activeLens, experienceGroups, profileName, publications, submittedQuery]);

  const triggerThinkingTransition = useCallback(() => {
    clearTimers();
    setActiveCitation(null);

    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setPhase("idle");
      setStepIndex(2);
      return;
    }

    setPhase("thinking");
    setStepIndex(0);

    const t1 = window.setTimeout(() => setStepIndex(1), 115);
    const t2 = window.setTimeout(() => setStepIndex(2), 230);
    const t3 = window.setTimeout(() => setPhase("idle"), 340);
    timersRef.current = [t1, t2, t3];
  }, [clearTimers]);

  const selectPreset = useCallback(
    (lens: Exclude<LensId, "custom">, syncPublications = false) => {
      setActiveLens(lens);
      setSubmittedQuery("");
      triggerThinkingTransition();

      if (syncPublications && typeof window !== "undefined") {
        const preset = PRESETS.find((p) => p.id === lens);
        if (preset) {
          window.dispatchEvent(
            new CustomEvent("filter-publication-topic", { detail: { topic: preset.topicSync } }),
          );
        }
      }
    },
    [triggerThinkingTransition],
  );

  useEffect(() => {
    const onSelectTopic = (event: Event) => {
      const detail = (event as CustomEvent<{ topic?: string }>).detail;
      const topic = detail?.topic;
      if (topic === "MLLMs") selectPreset("mllms", false);
      else if (topic === "Agentic AI") selectPreset("agents", false);
      else if (topic === "World Models") selectPreset("world-models", false);
      else if (topic === "All") selectPreset("overview", false);
    };

    window.addEventListener("select-research-lens", onSelectTopic);
    return () => window.removeEventListener("select-research-lens", onSelectTopic);
  }, [selectPreset]);

  const handleQuerySubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = customQuery.trim();
    if (!trimmed) {
      selectPreset("overview", false);
      return;
    }
    setSubmittedQuery(trimmed);
    setActiveLens("custom");
    triggerThinkingTransition();
  };

  const jumpToPaper = (paperId: string) => {
    window.dispatchEvent(
      new CustomEvent("spotlight-publication", { detail: { id: paperId } }),
    );
  };

  const totalMs = useMemo(
    () => payload.trace.reduce((acc, item) => acc + item.ms, 0),
    [payload.trace],
  );

  const waterfallSteps = useMemo(
    () =>
      payload.trace.map((step, idx) => {
        const elapsed = payload.trace.slice(0, idx).reduce((sum, item) => sum + item.ms, 0);
        const startPct = Math.min(86, Math.round((elapsed / Math.max(totalMs, 1)) * 100));
        const rawWidth = Math.round((step.ms / Math.max(totalMs, 1)) * 100);
        const widthPct = Math.min(100 - startPct, Math.max(14, rawWidth));
        return { ...step, startPct, widthPct };
      }),
    [payload.trace, totalMs],
  );

  const activeTraceStep = payload.trace[Math.min(stepIndex, payload.trace.length - 1)];
  const settledSummary = `${payload.sources.length} cited ${payload.sources.length === 1 ? "work" : "works"} · ${payload.label}`;

  return (
    <div className="copilot-card" role="region" aria-label="Interactive cited research brief">
      <div className="copilot-topbar">
        <div className="copilot-status-group">
          <PixelMatrix active={phase === "thinking"} />
          <span className="copilot-kicker">Cited Research Brief</span>
          <span className="copilot-status-sep" aria-hidden="true">
            ·
          </span>
          <span className="copilot-status-live" aria-hidden="true">
            {phase === "thinking" && activeTraceStep
              ? `${activeTraceStep.tool}(${activeTraceStep.arg})…`
              : settledSummary}
          </span>
          <span className="sr-only" aria-live="polite">
            {phase === "idle" ? `Research brief ready: ${settledSummary}` : ""}
          </span>
        </div>

        <button
          type="button"
          className={`copilot-trace-toggle ${traceOpen ? "is-open" : ""}`}
          onClick={() => setTraceOpen((prev) => !prev)}
          aria-expanded={traceOpen}
          aria-controls="copilot-trace-drawer"
        >
          <span className="copilot-trace-mono">
            {payload.trace.length} steps · {totalMs}ms
          </span>
          <svg
            viewBox="0 0 16 16"
            fill="none"
            className="copilot-chevron"
            aria-hidden="true"
          >
            <path
              d="m4.5 6.25 3.5 3.5 3.5-3.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <div
        id="copilot-trace-drawer"
        hidden={!traceOpen}
        className={traceOpen ? "copilot-trace-drawer" : undefined}
      >
        {traceOpen
          ? waterfallSteps.map((step, idx) => (
              <div key={`${step.tool}-${idx}`} className="copilot-trace-row">
                <span className="copilot-trace-call">
                  <code>{step.tool}</code>
                  <span className="copilot-trace-arg">({step.arg})</span>
                </span>
                <span className="copilot-trace-bar-track" aria-hidden="true">
                  <span
                    className="copilot-trace-bar-fill"
                    style={{ marginLeft: `${step.startPct}%`, width: `${step.widthPct}%` }}
                  />
                </span>
                <span className="copilot-trace-meta">
                  <span className="copilot-trace-result">{step.result}</span>
                  <span className="copilot-trace-ms">{step.ms}ms</span>
                </span>
              </div>
            ))
          : null}
      </div>

      <div className="copilot-controls">
        <div className="copilot-presets" role="group" aria-label="Research synthesis lenses">
          {PRESETS.map((preset) => {
            const isSelected = activeLens === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => selectPreset(preset.id, true)}
                className={`copilot-preset-chip ${isSelected ? "is-active" : ""}`}
                aria-pressed={isSelected}
              >
                {preset.label}
              </button>
            );
          })}
          {activeLens === "custom" && submittedQuery ? (
            <button
              type="button"
              onClick={() => {
                setCustomQuery("");
                selectPreset("overview", false);
              }}
              className="copilot-preset-chip is-active is-custom-pill"
              aria-label={`Clear query ${submittedQuery} and return to Overview`}
            >
              <span className="copilot-custom-pill-text">Query: {submittedQuery}</span>
              <span aria-hidden="true">✕</span>
            </button>
          ) : null}
        </div>

        <form className="copilot-composer" onSubmit={handleQuerySubmit}>
          <svg
            viewBox="0 0 20 20"
            fill="none"
            className="copilot-search-icon"
            aria-hidden="true"
          >
            <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="m13.2 13.2 3.3 3.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={customQuery}
            onChange={(e) => setCustomQuery(e.target.value)}
            placeholder="Query papers, venues, methods (e.g., CVPR Oral, hallucination, AgiBot)…"
            aria-label="Query across publications and research experience"
            className="copilot-input"
          />
          {customQuery ? (
            <button
              type="button"
              className="copilot-clear-btn"
              onClick={() => {
                setCustomQuery("");
                if (activeLens === "custom") {
                  selectPreset("overview", false);
                }
              }}
              aria-label="Clear query"
            >
              ✕
            </button>
          ) : null}
          <button type="submit" className="copilot-submit-btn">
            Ask ↵
          </button>
        </form>
      </div>

      <div
        key={`${payload.lens}-${submittedQuery}`}
        className={`copilot-answer-body ${phase === "thinking" ? "is-refreshing" : "is-ready"}`}
      >
        <p className="copilot-prose">
          {payload.segments.map((seg, idx) => {
            const isLit =
              activeCitation !== null && seg.citations.includes(activeCitation);

            return (
              <span key={seg.id} className="copilot-segment-wrap">
                <span className={`copilot-sentence ${isLit ? "is-lit" : ""}`}>
                  {seg.text}
                </span>
                {seg.citations.length > 0 ? (
                  <span className="copilot-inline-citations">
                    {seg.citations.map((citeNum) => {
                      const source = payload.sources[citeNum - 1];
                      if (!source) return null;
                      const chipActive = activeCitation === citeNum;
                      return (
                        <button
                          key={`${seg.id}-c${citeNum}`}
                          type="button"
                          className={`citation-chip ${chipActive ? "is-active" : ""}`}
                          onMouseEnter={() => setActiveCitation(citeNum)}
                          onMouseLeave={() => setActiveCitation(null)}
                          onFocus={() => setActiveCitation(citeNum)}
                          onBlur={() => setActiveCitation(null)}
                          onClick={() => jumpToPaper(source.id)}
                          title={`Jump to [${citeNum}] ${source.title}`}
                          aria-label={`Citation ${citeNum}: ${source.shortTitle}. Click to jump to paper.`}
                        >
                          {citeNum}
                        </button>
                      );
                    })}
                  </span>
                ) : null}
                <span className="copilot-period">.</span>
                {idx < payload.segments.length - 1 ? " " : null}
              </span>
            );
          })}
        </p>

        {payload.sources.length > 0 ? (
          <div className="copilot-sources-strip" aria-label="Cited sources">
            {payload.sources.map((source, idx) => {
              const citeNum = idx + 1;
              const isHighlighted = activeCitation === citeNum;
              const primaryVenue = source.venues[0] ?? source.meta;
              const paperHref =
                source.links.find((l) => l.label.toLowerCase().includes("paper"))?.href ??
                source.links[0]?.href;

              return (
                <div
                  key={source.id}
                  className={`copilot-source-card ${isHighlighted ? "is-highlighted" : ""}`}
                  onMouseEnter={() => setActiveCitation(citeNum)}
                  onMouseLeave={() => setActiveCitation(null)}
                  onFocusCapture={() => setActiveCitation(citeNum)}
                  onBlurCapture={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                      setActiveCitation(null);
                    }
                  }}
                >
                  <div className="copilot-source-top">
                    <span className="copilot-source-index">[{citeNum}]</span>
                    <span className="copilot-source-venue">{primaryVenue}</span>
                  </div>
                  <p className="copilot-source-title">{source.shortTitle}</p>
                  <div className="copilot-source-actions">
                    <button
                      type="button"
                      className="copilot-source-jump"
                      onClick={() => jumpToPaper(source.id)}
                    >
                      Locate ↓
                    </button>
                    {paperHref ? (
                      <a
                        href={paperHref}
                        target="_blank"
                        rel="noreferrer"
                        className="copilot-source-ext"
                      >
                        Paper ↗
                      </a>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
