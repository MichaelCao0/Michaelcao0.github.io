"use client";

import { useEffect, useState } from "react";

import type { InterestItem } from "@/data/site";

export function InterestGrid({
  items,
  topicCounts,
}: {
  items: InterestItem[];
  topicCounts: Record<string, number>;
}) {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  useEffect(() => {
    const onExternalTopic = (event: Event) => {
      const detail = (event as CustomEvent<{ topic?: string }>).detail;
      const next = detail?.topic;
      setSelectedTopic(!next || next === "All" ? null : next);
    };

    window.addEventListener("filter-publication-topic", onExternalTopic);
    return () => window.removeEventListener("filter-publication-topic", onExternalTopic);
  }, []);

  const handleSelect = (topicTitle: string, scrollToPubs = false) => {
    const nextTopic = !scrollToPubs && selectedTopic === topicTitle ? "All" : topicTitle;
    setSelectedTopic(nextTopic === "All" ? null : nextTopic);

    window.dispatchEvent(
      new CustomEvent("select-research-lens", { detail: { topic: nextTopic } }),
    );
    window.dispatchEvent(
      new CustomEvent("filter-publication-topic", { detail: { topic: nextTopic } }),
    );

    if (scrollToPubs) {
      const el = document.getElementById("publications");
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    }
  };

  return (
    <div className="interest-grid" aria-label="Research focus areas">
      {items.map((item, idx) => {
        const count = topicCounts[item.title] ?? 0;
        const isActive = selectedTopic === item.title;

        return (
          <article
            key={item.raw}
            className={`interest-card is-interactive ${isActive ? "is-selected" : ""}`}
          >
            <div className="interest-card-top">
              <span className="interest-index">0{idx + 1}</span>
              {count > 0 ? (
                <button
                  type="button"
                  className="interest-jump-pill"
                  onClick={() => handleSelect(item.title, true)}
                  aria-label={`Filter and jump to ${count} ${item.title} papers`}
                >
                  {count} papers ↓
                </button>
              ) : null}
            </div>
            <button
              type="button"
              className="interest-card-trigger"
              aria-pressed={isActive}
              onClick={() => handleSelect(item.title, false)}
            >
              <span className="interest-title">{item.title}</span>
              {item.detail ? <span className="interest-detail">{item.detail}</span> : null}
            </button>
          </article>
        );
      })}
    </div>
  );
}
