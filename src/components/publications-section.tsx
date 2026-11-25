"use client";

import Image from "next/image";
import { KeyboardEvent as ReactKeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { cleanAuthorName, splitAuthorAffixes } from "@/data/copilot-engine";
import type { Publication, PublicationLink } from "@/data/site";

type StatusFilter = "all" | "accepted" | "preprint";

const STATUS_TABS: Array<{ id: StatusFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "accepted", label: "Accepted" },
  { id: "preprint", label: "Preprints" },
];

function getVenueTone(label: string) {
  const normalized = label.toLowerCase();

  if (normalized.includes("oral") || normalized.includes("spotlight") || normalized.includes("best")) {
    return "oral";
  }
  if (normalized.includes("neurips") || normalized.includes("nips")) return "neurips";
  if (normalized.includes("icml")) return "icml";
  if (normalized.includes("iclr")) return "iclr";
  if (normalized.includes("cvpr") || normalized.includes("iccv") || normalized.includes("eccv")) return "cvpr";
  if (normalized.includes("emnlp") || normalized.includes("acl") || normalized.includes("naacl")) return "acl";
  if (normalized.includes("arxiv") || normalized.includes("preprint")) return "arxiv";

  return "default";
}

function ActionIcon({ label }: { label: string }) {
  const key = label.toLowerCase();
  const cls = "h-3.5 w-3.5 shrink-0";

  if (key.includes("code") || key.includes("collection")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={cls} aria-hidden="true">
        <path
          d="m8.5 8.5-4 3.5 4 3.5M15.5 8.5l4 3.5-4 3.5M13.2 6.5l-2.4 11"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (key.includes("project")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={cls} aria-hidden="true">
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.7" />
        <path
          d="M4.5 12h15M12 4a12.5 12.5 0 0 1 0 16M12 4a12.5 12.5 0 0 0 0 16"
          stroke="currentColor"
          strokeWidth="1.55"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" className={cls} aria-hidden="true">
      <path
        d="M7 17 17 7M9.5 7H17v7.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AuthorList({
  authors,
  profileName,
}: {
  authors: string;
  profileName: string;
}) {
  const [expanded, setExpanded] = useState(false);

  const names = useMemo(
    () =>
      authors
        .split(",")
        .map((author) => author.trim())
        .filter(Boolean),
    [authors],
  );

  const isLongList = names.length > 8;
  const profileIndex = useMemo(
    () => names.findIndex((author) => cleanAuthorName(author) === profileName),
    [names, profileName],
  );
  const lastIndex = names.length - 1;

  const displayTokens = useMemo(() => {
    if (!isLongList || expanded) {
      return names.map((text, idx) => ({ type: "author" as const, text, key: `${text}-${idx}` }));
    }

    const indices = new Set<number>([0, 1, 2]);
    names.forEach((author, idx) => {
      if (author.includes("*")) {
        indices.add(idx);
      }
    });
    if (profileIndex !== -1) {
      indices.add(profileIndex);
    }
    if (lastIndex >= 0) {
      indices.add(lastIndex);
    }

    const sorted = Array.from(indices)
      .filter((idx) => idx >= 0 && idx < names.length)
      .sort((a, b) => a - b);
    const tokens: Array<{ type: "author" | "ellipsis"; text: string; key: string }> = [];

    sorted.forEach((idx, pos) => {
      if (pos > 0 && idx - sorted[pos - 1] > 1) {
        tokens.push({ type: "ellipsis", text: "…", key: `ellipsis-${pos}` });
      }
      tokens.push({ type: "author", text: names[idx], key: `${names[idx]}-${idx}` });
    });

    return tokens;
  }, [expanded, isLongList, lastIndex, names, profileIndex]);

  const hiddenCount = Math.max(0, names.length - displayTokens.filter((t) => t.type === "author").length);

  return (
    <p className="publication-authors">
      {displayTokens.map((token, index) => {
        const isSelf = token.type === "author" && cleanAuthorName(token.text) === profileName;
        const affixes = isSelf ? splitAuthorAffixes(token.text, profileName) : { prefix: "", suffix: "" };

        return (
          <span key={token.key}>
            {token.type === "ellipsis" ? (
              <span className="author-ellipsis">…</span>
            ) : isSelf ? (
              <strong className="author-self">
                {affixes.prefix}
                {profileName}
                {affixes.suffix}
              </strong>
            ) : (
              token.text
            )}
            {index < displayTokens.length - 1 ? ", " : null}
          </span>
        );
      })}
      {isLongList && (hiddenCount > 0 || expanded) ? (
        <>
          {" "}
          <button
            type="button"
            className="author-expand-btn"
            aria-expanded={expanded}
            onClick={() => setExpanded((prev) => !prev)}
          >
            {expanded ? "Show fewer" : `+${hiddenCount} more`}
          </button>
        </>
      ) : null}
    </p>
  );
}

function PublicationCard({
  item,
  profileName,
  staggerIndex,
  isSpotlighted,
  onPreview,
}: {
  item: Publication;
  profileName: string;
  staggerIndex: number;
  isSpotlighted: boolean;
  onPreview: (paper: Publication, trigger: HTMLButtonElement | null) => void;
}) {
  const [showBib, setShowBib] = useState(false);
  const [copiedBib, setCopiedBib] = useState(false);
  const copyTimerRef = useRef<number | null>(null);
  const coverBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  const venues =
    item.venues.length > 0
      ? item.venues
      : item.links.some((link) => link.label.toLowerCase().includes("arxiv"))
        ? ["arXiv"]
        : [];

  const parsedAuthors = item.authors.split(",").map((a) => a.trim());
  const isCoFirst = parsedAuthors.some(
    (a) => cleanAuthorName(a) === profileName && a.includes("*"),
  );
  const isFirst =
    !isCoFirst && parsedAuthors[0] ? cleanAuthorName(parsedAuthors[0]) === profileName : false;

  const copyBib = async () => {
    try {
      await navigator.clipboard.writeText(item.bibtex);
      setCopiedBib(true);
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
      copyTimerRef.current = window.setTimeout(() => setCopiedBib(false), 1800);
    } catch {
      // Ignore clipboard failures in restricted contexts
    }
  };

  const bibDrawerId = `bibtex-${item.id}`;

  return (
    <article
      id={`pub-${item.id}`}
      style={{ animationDelay: `${Math.min(staggerIndex, 6) * 38}ms` }}
      className={`publication-card affect-rise ${item.featured ? "is-featured" : ""} ${isSpotlighted ? "is-spotlighted" : ""}`}
    >
      <div className="publication-cover-wrap">
        {item.image ? (
          <button
            ref={coverBtnRef}
            type="button"
            className="publication-cover is-interactive"
            onClick={() => onPreview(item, coverBtnRef.current)}
            aria-label={`Zoom preview figure for ${item.title}`}
          >
            <Image
              src={item.image}
              alt={`${item.title} overview figure`}
              fill
              sizes="(max-width: 720px) 100vw, 224px"
              className={item.imageFit === "contain" ? "object-contain p-2" : "object-cover object-center"}
            />
            <span className="cover-zoom-pill" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
                <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
                <path
                  d="m16 16 4 4M11 8.5v5M8.5 11h5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </button>
        ) : (
          <div className="publication-cover is-typographic">
            <div className="publication-fallback">
              <span className="fallback-meta">{item.date}</span>
              <span className="fallback-title">{item.imageLabel ?? item.topic}</span>
              <span className="fallback-topic">{item.topic}</span>
            </div>
          </div>
        )}
      </div>

      <div className="publication-body">
        <div className="publication-badges">
          {item.featured ? <span className="publication-ribbon">★ Representative Work</span> : null}
          {venues.map((venue) => (
            <span key={venue} className={`publication-venue publication-venue--${getVenueTone(venue)}`}>
              {venue}
            </span>
          ))}
          {isCoFirst ? (
            <span className="publication-role-tag">Co-First Author</span>
          ) : isFirst ? (
            <span className="publication-role-tag">First Author</span>
          ) : null}
          <span className="publication-topic-tag">{item.topic}</span>
        </div>

        <h3 className="publication-title">{item.title}</h3>

        {item.authors ? <AuthorList authors={item.authors} profileName={profileName} /> : null}

        {item.note ? <p className="publication-note">{item.note}</p> : null}

        <div className="publication-links">
          {item.links.map((link: PublicationLink) => {
            const disabled = link.href === "#";
            return (
              <a
                key={link.label}
                href={disabled ? undefined : link.href}
                target={link.href.startsWith("http") && !disabled ? "_blank" : undefined}
                rel={link.href.startsWith("http") && !disabled ? "noreferrer" : undefined}
                className={`publication-link ${disabled ? "is-disabled" : ""}`}
                aria-disabled={disabled ? true : undefined}
              >
                <ActionIcon label={link.label} />
                <span>{link.label}</span>
              </a>
            );
          })}

          <button
            type="button"
            className={`publication-link is-subtle ${showBib ? "is-open" : ""}`}
            onClick={() => setShowBib((prev) => !prev)}
            aria-expanded={showBib}
            aria-controls={bibDrawerId}
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 shrink-0" aria-hidden="true">
              <path d="M7 7.5h10M7 12h10M7 16.5h6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
            <span>BibTeX</span>
          </button>
        </div>

        <div
          id={bibDrawerId}
          hidden={!showBib}
          className={showBib ? "bibtex-drawer affect-rise-fast" : undefined}
        >
          {showBib ? (
            <>
              <div className="bibtex-toolbar">
                <span>BibTeX Citation</span>
                <button type="button" onClick={copyBib} className={`bibtex-copy-btn ${copiedBib ? "is-copied" : ""}`}>
                  {copiedBib ? "Copied ✓" : "Copy BibTeX"}
                </button>
              </div>
              <pre className="bibtex-code">
                <code>{item.bibtex}</code>
              </pre>
            </>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function PublicationsSection({
  publications,
  profileName,
}: {
  publications: Publication[];
  profileName: string;
}) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [topicFilter, setTopicFilter] = useState<string>("All");
  const [previewPaper, setPreviewPaper] = useState<Publication | null>(null);
  const [spotlightId, setSpotlightId] = useState<string | null>(null);
  const [segGlide, setSegGlide] = useState<{
    left: number;
    width: number;
    ready: boolean;
    animated: boolean;
  }>({
    left: 0,
    width: 0,
    ready: false,
    animated: false,
  });

  const segContainerRef = useRef<HTMLDivElement | null>(null);
  const segBtnRefs = useRef<Record<StatusFilter, HTMLButtonElement | null>>({
    all: null,
    accepted: null,
    preprint: null,
  });
  const segAnimRafRef = useRef<number | null>(null);
  const topicFilterRef = useRef<string>("All");
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const lastTriggerRef = useRef<HTMLElement | null>(null);
  const spotlightTimerRef = useRef<number | null>(null);

  useEffect(() => {
    topicFilterRef.current = topicFilter;
  }, [topicFilter]);

  useEffect(() => {
    return () => {
      if (segAnimRafRef.current !== null) {
        window.cancelAnimationFrame(segAnimRafRef.current);
      }
    };
  }, []);

  const topics = useMemo(() => {
    const ordered = ["MLLMs", "Agentic AI", "World Models"];
    const extras = Array.from(new Set(publications.map((p) => p.topic))).filter(
      (t) => !ordered.includes(t),
    );
    const present = [...ordered, ...extras].filter((t) => publications.some((p) => p.topic === t));
    return ["All", ...present];
  }, [publications]);

  const scopedByTopic = useMemo(
    () =>
      publications.filter((item) => topicFilter === "All" || item.topic === topicFilter),
    [publications, topicFilter],
  );

  const scopedByStatus = useMemo(
    () =>
      publications.filter((item) => statusFilter === "all" || item.status === statusFilter),
    [publications, statusFilter],
  );

  const acceptedCount = useMemo(
    () => scopedByTopic.filter((item) => item.status === "accepted").length,
    [scopedByTopic],
  );
  const preprintCount = useMemo(
    () => scopedByTopic.filter((item) => item.status === "preprint").length,
    [scopedByTopic],
  );

  const filtered = useMemo(() => {
    return publications.filter((item) => {
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      const matchesTopic = topicFilter === "All" || item.topic === topicFilter;
      return matchesStatus && matchesTopic;
    });
  }, [publications, statusFilter, topicFilter]);

  const groups = useMemo(() => {
    if (filtered.length === 0) {
      return [];
    }
    if (statusFilter === "accepted") {
      return [{ title: "Accepted Conference Papers", items: filtered }];
    }
    if (statusFilter === "preprint") {
      return [{ title: "Preprints & Surveys", items: filtered }];
    }
    const accepted = filtered.filter((item) => item.status === "accepted");
    const preprints = filtered.filter((item) => item.status === "preprint");
    return [
      ...(accepted.length > 0 ? [{ title: "Accepted Conference Papers", items: accepted }] : []),
      ...(preprints.length > 0 ? [{ title: "Preprints & Surveys", items: preprints }] : []),
    ];
  }, [filtered, statusFilter]);

  const syncSegGlide = useCallback((activeStatus: StatusFilter) => {
    const activeBtn = segBtnRefs.current[activeStatus];
    if (!activeBtn) return;
    const left = activeBtn.offsetLeft;
    const width = activeBtn.offsetWidth;
    if (width > 0) {
      setSegGlide((prev) => {
        if (!prev.ready) {
          if (segAnimRafRef.current !== null) {
            window.cancelAnimationFrame(segAnimRafRef.current);
          }
          segAnimRafRef.current = window.requestAnimationFrame(() => {
            setSegGlide((curr) => (curr.ready && !curr.animated ? { ...curr, animated: true } : curr));
          });
          return { left, width, ready: true, animated: false };
        }
        return prev.left === left && prev.width === width
          ? prev
          : { left, width, ready: true, animated: prev.animated };
      });
    }
  }, []);

  useEffect(() => {
    const raf = window.requestAnimationFrame(() => syncSegGlide(statusFilter));
    const container = segContainerRef.current;
    if (!container || typeof ResizeObserver === "undefined") {
      return () => window.cancelAnimationFrame(raf);
    }

    const observer = new ResizeObserver(() => syncSegGlide(statusFilter));
    observer.observe(container);
    Object.values(segBtnRefs.current).forEach((btn) => {
      if (btn) observer.observe(btn);
    });

    return () => {
      window.cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [statusFilter, topicFilter, syncSegGlide]);

  useEffect(() => {
    const onSpotlight = (event: Event) => {
      const id = (event as CustomEvent<{ id?: string }>).detail?.id;
      if (!id) return;

      const targetPaper = publications.find((p) => p.id === id);
      if (!targetPaper) return;

      setStatusFilter((prev) =>
        prev === "all" || prev === targetPaper.status ? prev : "all",
      );

      if (topicFilterRef.current !== "All" && topicFilterRef.current !== targetPaper.topic) {
        setTopicFilter("All");
        window.dispatchEvent(
          new CustomEvent("filter-publication-topic", {
            detail: { topic: "All", preserveStatus: true },
          }),
        );
      }

      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          const cardEl = document.getElementById(`pub-${id}`);
          const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          cardEl?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
          setSpotlightId(id);
          if (spotlightTimerRef.current !== null) {
            window.clearTimeout(spotlightTimerRef.current);
          }
          spotlightTimerRef.current = window.setTimeout(() => {
            setSpotlightId(null);
          }, 1800);
        });
      });
    };

    const onFilterTopic = (event: Event) => {
      const detail = (event as CustomEvent<{ topic?: string; preserveStatus?: boolean }>).detail;
      const nextTopic = detail?.topic;
      if (!nextTopic) return;
      if (nextTopic === "All" || topics.includes(nextTopic)) {
        setTopicFilter(nextTopic);
        if (!detail?.preserveStatus) {
          setStatusFilter((prev) => {
            if (prev === "all") return prev;
            const hasMatch = publications.some(
              (p) => p.status === prev && (nextTopic === "All" || p.topic === nextTopic),
            );
            return hasMatch ? prev : "all";
          });
        }
      }
    };

    window.addEventListener("spotlight-publication", onSpotlight);
    window.addEventListener("filter-publication-topic", onFilterTopic);
    return () => {
      window.removeEventListener("spotlight-publication", onSpotlight);
      window.removeEventListener("filter-publication-topic", onFilterTopic);
      if (spotlightTimerRef.current !== null) {
        window.clearTimeout(spotlightTimerRef.current);
      }
    };
  }, [publications, topics]);

  const closePreview = useCallback(() => {
    setPreviewPaper(null);
    const trigger = lastTriggerRef.current;
    if (trigger) {
      window.requestAnimationFrame(() => trigger.focus());
    }
  }, []);

  useEffect(() => {
    if (!previewPaper) {
      return;
    }

    const focusRaf = window.requestAnimationFrame(() => {
      closeBtnRef.current?.focus();
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closePreview();
        return;
      }

      if (event.key === "Tab" && dialogRef.current) {
        const focusable = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), a[href]:not([aria-disabled="true"]), [tabindex]:not([tabindex="-1"])',
          ),
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement as HTMLElement | null;

        if (!active || !dialogRef.current.contains(active)) {
          event.preventDefault();
          (event.shiftKey ? last : first).focus();
          return;
        }

        if (event.shiftKey && active === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && active === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.cancelAnimationFrame(focusRaf);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [previewPaper, closePreview]);

  const handleTabKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const currentIndex = STATUS_TABS.findIndex((t) => t.id === statusFilter);
    if (currentIndex === -1) return;

    let nextIndex = -1;
    if (event.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % STATUS_TABS.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + STATUS_TABS.length) % STATUS_TABS.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = STATUS_TABS.length - 1;
    }

    if (nextIndex !== -1) {
      event.preventDefault();
      const nextStatus = STATUS_TABS[nextIndex].id;
      setStatusFilter(nextStatus);
      segBtnRefs.current[nextStatus]?.focus();
    }
  };

  const selectTopic = (topic: string) => {
    setTopicFilter(topic);
    window.dispatchEvent(
      new CustomEvent("filter-publication-topic", { detail: { topic, preserveStatus: true } }),
    );
  };

  return (
    <>
      <div className="pub-controls" role="region" aria-label="Filter publications">
        <div
          ref={segContainerRef}
          className={`pub-segmented ${segGlide.ready ? "has-glide" : ""}`}
          role="tablist"
          aria-label="Publication status"
          onKeyDown={handleTabKeyDown}
        >
          <span
            className={`pub-seg-glide ${segGlide.animated ? "is-animated" : ""}`}
            aria-hidden="true"
            style={{
              width: `${segGlide.width}px`,
              transform: `translate3d(${segGlide.left}px, 0, 0)`,
              opacity: segGlide.ready ? 1 : 0,
            }}
          />
          {STATUS_TABS.map((tab) => {
            const isSelected = statusFilter === tab.id;
            const count =
              tab.id === "all"
                ? scopedByTopic.length
                : tab.id === "accepted"
                  ? acceptedCount
                  : preprintCount;

            return (
              <button
                key={tab.id}
                ref={(el) => {
                  segBtnRefs.current[tab.id] = el;
                }}
                id={`pub-tab-${tab.id}`}
                type="button"
                role="tab"
                tabIndex={isSelected ? 0 : -1}
                aria-selected={isSelected}
                aria-controls="publications-tabpanel"
                className={`pub-seg-btn ${isSelected ? "is-active" : ""}`}
                onClick={() => setStatusFilter(tab.id)}
              >
                <span>{tab.label}</span>
                <span className="pub-count">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="pub-topics" role="group" aria-label="Filter by research topic">
          {topics.map((topic) => {
            const count =
              topic === "All"
                ? scopedByStatus.length
                : scopedByStatus.filter((p) => p.topic === topic).length;
            const isActive = topicFilter === topic;

            return (
              <button
                key={topic}
                type="button"
                aria-pressed={isActive}
                className={`pub-topic-chip ${isActive ? "is-active" : ""}`}
                onClick={() => selectTopic(topic)}
              >
                <span>{topic === "All" ? "All Themes" : topic}</span>
                <span className="pub-topic-count">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div
        id="publications-tabpanel"
        role="tabpanel"
        aria-labelledby={`pub-tab-${statusFilter}`}
      >
        {groups.length > 0 ? (
          <div key={`${statusFilter}-${topicFilter}`} className="publication-groups">
            {groups.map((group) => (
              <div key={group.title} className="publication-group">
                <div className="publication-group-bar">
                  <h3 className="publication-group-title">{group.title}</h3>
                  <span className="publication-group-count">{group.items.length}</span>
                </div>
                <div className="publication-stack">
                  {group.items.map((item, idx) => (
                    <PublicationCard
                      key={item.id}
                      item={item}
                      profileName={profileName}
                      staggerIndex={idx}
                      isSpotlighted={spotlightId === item.id}
                      onPreview={(paper, trigger) => {
                        lastTriggerRef.current = trigger;
                        setPreviewPaper(paper);
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="pub-empty-state affect-rise">
            <p className="pub-empty-text">
              No {statusFilter === "accepted" ? "accepted conference papers" : "preprints"} under{" "}
              <strong>{topicFilter}</strong> yet.
            </p>
            <button
              type="button"
              className="pub-reset-btn"
              onClick={() => {
                setStatusFilter("all");
                selectTopic("All");
              }}
            >
              Reset filters
            </button>
          </div>
        )}
      </div>

      {previewPaper && previewPaper.image ? (
        <div
          className="lightbox-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label={`Figure preview for ${previewPaper.title}`}
          onClick={closePreview}
        >
          <div
            ref={dialogRef}
            className="lightbox-dialog"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="lightbox-header">
              <div className="lightbox-heading-group">
                <div className="publication-badges">
                  {previewPaper.venues.map((venue) => (
                    <span key={venue} className={`publication-venue publication-venue--${getVenueTone(venue)}`}>
                      {venue}
                    </span>
                  ))}
                  <span className="publication-topic-tag">{previewPaper.topic}</span>
                </div>
                <h3 className="lightbox-title">{previewPaper.title}</h3>
              </div>
              <button
                ref={closeBtnRef}
                type="button"
                className="lightbox-close"
                onClick={closePreview}
                aria-label="Close figure preview"
              >
                ✕
              </button>
            </div>
            <div className="lightbox-stage">
              <Image
                src={previewPaper.image}
                alt={`${previewPaper.title} full figure`}
                fill
                sizes="(max-width: 1024px) 95vw, 940px"
                className="object-contain p-4"
              />
            </div>
            <div className="lightbox-footer">
              <div className="publication-links">
                {previewPaper.links.map((link) => {
                  const disabled = link.href === "#";
                  return (
                    <a
                      key={link.label}
                      href={disabled ? undefined : link.href}
                      target={link.href.startsWith("http") && !disabled ? "_blank" : undefined}
                      rel={link.href.startsWith("http") && !disabled ? "noreferrer" : undefined}
                      className={`publication-link ${disabled ? "is-disabled" : ""}`}
                      aria-disabled={disabled ? true : undefined}
                    >
                      <ActionIcon label={link.label} />
                      <span>{link.label}</span>
                    </a>
                  );
                })}
              </div>
              <span className="lightbox-hint">Esc or click outside to close</span>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
