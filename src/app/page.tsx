import { CopyEmailButton } from "@/components/copy-email-button";
import { InterestGrid } from "@/components/interest-grid";
import { PublicationsSection } from "@/components/publications-section";
import { ResearchCopilot } from "@/components/research-copilot";
import { ThemeToggle } from "@/components/theme-toggle";
import { TopbarNav } from "@/components/topbar-nav";
import { VisitorMap } from "@/components/visitor-map";
import {
  experienceGroups,
  getPublications,
  interests,
  intro,
  navigation,
  news,
  preface,
  profile,
  profileLinks,
} from "@/data/site";

type IconName =
  | "mail"
  | "file"
  | "github"
  | "scholar"
  | "linkedin"
  | "openreview"
  | "huggingface"
  | "xiaohongshu";

function SectionHeading({
  kicker,
  title,
  meta,
}: {
  kicker: string;
  title: string;
  meta?: string;
}) {
  return (
    <div className="section-heading">
      <div>
        <p className="section-kicker">{kicker}</p>
        <h2 className="section-title">{title}</h2>
      </div>
      {meta ? <p className="section-meta">{meta}</p> : null}
    </div>
  );
}

function RichInlineText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);

  return (
    <>
      {parts.map((part, idx) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={idx}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("*") && part.endsWith("*")) {
          return (
            <em key={idx} className="news-paper-title">
              {part.slice(1, -1)}
            </em>
          );
        }
        return <span key={idx}>{part}</span>;
      })}
    </>
  );
}

function LinkIcon({ name }: { name: IconName }) {
  const common = "h-[17px] w-[17px] stroke-[1.65]";

  switch (name) {
    case "mail":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden="true">
          <path d="M4 7.5 12 13l8-5.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="4" y="6" width="16" height="12" rx="2.5" stroke="currentColor" />
        </svg>
      );
    case "file":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden="true">
          <path d="M8 3.5h6l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 7 19V5A1.5 1.5 0 0 1 8.5 3.5Z" stroke="currentColor" />
          <path d="M14 3.5V8h4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "github":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden="true">
          <path
            d="M9.2 18.2c-4 .9-4-2.2-5.6-2.7m11.2 5.4v-2.3a2 2 0 0 0-.6-1.5c2-.2 4.1-1 4.1-4.5A3.5 3.5 0 0 0 17.4 10a3.2 3.2 0 0 0-.1-2.4s-.8-.3-2.6 1A8.8 8.8 0 0 0 12 8.3a8.8 8.8 0 0 0-2.7.3c-1.8-1.3-2.6-1-2.6-1A3.2 3.2 0 0 0 6.6 10a3.5 3.5 0 0 0-.9 2.5c0 3.5 2.1 4.3 4.1 4.5a2 2 0 0 0-.6 1.5v2.3"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "scholar":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden="true">
          <path d="m4 9 8-4 8 4-8 4-8-4Z" stroke="currentColor" strokeLinejoin="round" />
          <path d="M7 11.5V15c0 1.7 2.2 3 5 3s5-1.3 5-3v-3.5" stroke="currentColor" strokeLinecap="round" />
        </svg>
      );
    case "linkedin":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden="true">
          <rect x="4.5" y="4.5" width="15" height="15" rx="2" stroke="currentColor" />
          <path d="M8 10.5v5M8 8.2v.1M11.5 15.5v-2.6a2.1 2.1 0 0 1 4.2 0v2.6M11.5 11v4.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "openreview":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden="true">
          <rect x="5" y="4.5" width="14" height="15" rx="3" stroke="currentColor" />
          <path d="M8.5 8.5h7M8.5 12h7M8.5 15.5h4.5" stroke="currentColor" strokeLinecap="round" />
        </svg>
      );
    case "huggingface":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden="true">
          <circle cx="8.5" cy="11" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="15.5" cy="11" r="1.2" fill="currentColor" stroke="none" />
          <path d="M7.5 15c1 .9 2.5 1.5 4.5 1.5s3.5-.6 4.5-1.5" stroke="currentColor" strokeLinecap="round" />
          <path d="M6.5 9c0-2.2 1.9-4 5.5-4s5.5 1.8 5.5 4v4.2c0 2.7-2.2 5-5.5 5s-5.5-2.3-5.5-5Z" stroke="currentColor" />
        </svg>
      );
    case "xiaohongshu":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden="true">
          <rect x="4.5" y="6" width="15" height="12" rx="4" stroke="currentColor" />
          <path d="M9 10.2h2.4M9 13.8h6M14 10.2h1" stroke="currentColor" strokeLinecap="round" />
        </svg>
      );
  }
}

function MetricStrip({
  metrics,
}: {
  metrics: Array<{ value: string; label: string; detail: string }>;
}) {
  return (
    <div className="metric-strip" aria-label="Research highlights">
      {metrics.map((metric) => (
        <div key={metric.label} className="metric-card">
          <strong className="metric-value">{metric.value}</strong>
          <span className="metric-label">{metric.label}</span>
          <span className="metric-detail">{metric.detail}</span>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const publications = getPublications();
  const acceptedPapers = publications.filter((item) => item.status === "accepted");
  const emailItem = profileLinks.find((item) => item.href?.startsWith("mailto:"));
  const emailAddress = emailItem?.href?.replace(/^mailto:/, "") ?? "";
  const topicCounts = publications.reduce<Record<string, number>>((acc, item) => {
    acc[item.topic] = (acc[item.topic] ?? 0) + 1;
    return acc;
  }, {});
  const newsYears = Array.from(
    new Set(news.map((item) => item.date.slice(0, 4)).filter((y) => /^\d{4}$/.test(y))),
  ).sort();
  const newsMeta =
    newsYears.length > 1
      ? `${newsYears[0]}–${newsYears[newsYears.length - 1]} Timeline`
      : newsYears.length === 1
        ? `${newsYears[0]} Timeline`
        : undefined;

  return (
    <div id="top" className="site-page">
      <header className="topbar">
        <div className="topbar-inner">
          <a href="#top" className="topbar-brand">
            <span className="topbar-monogram" aria-hidden="true">
              ZC
            </span>
            <span className="topbar-brand-text">
              <span className="topbar-name">{profile.name}</span>
              <span className="topbar-role">{profile.affiliation}</span>
            </span>
          </a>

          <TopbarNav items={navigation} />

          <div className="topbar-theme">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="site-shell">
        <div className="academic-layout">
          <aside className="sidebar-column">
            <div className="sidebar-card">
              <div className="profile-block">
                <span className="affiliation-pill">
                  <span className="affiliation-dot" aria-hidden="true" />
                  {profile.affiliation}
                </span>
                <h1 className="profile-name">{profile.name}</h1>
                <p className="profile-role">{profile.role} · Computer Science</p>
                <p className="profile-line">{profile.line}</p>
              </div>

              <div className="link-stack">
                {profileLinks.map((item) => {
                  const isMail = Boolean(item.href?.startsWith("mailto:"));

                  if (item.active && item.href) {
                    return (
                      <div key={item.label} className="icon-link-row">
                        <a
                          href={item.href}
                          className="icon-link"
                          target={item.href.startsWith("http") ? "_blank" : undefined}
                          rel={item.href.startsWith("http") ? "noreferrer" : undefined}
                        >
                          <span className="icon-shell">
                            <LinkIcon name={item.icon as IconName} />
                          </span>
                          <span className="icon-link-label">{item.label}</span>
                          {item.href.startsWith("http") ? (
                            <span className="link-arrow" aria-hidden="true">
                              ↗
                            </span>
                          ) : null}
                        </a>
                        {isMail && emailAddress ? <CopyEmailButton email={emailAddress} /> : null}
                      </div>
                    );
                  }

                  return (
                    <div key={item.label} className="icon-link is-muted" aria-disabled="true">
                      <span className="icon-shell">
                        <LinkIcon name={item.icon as IconName} />
                      </span>
                      <span className="icon-link-label">{item.label}</span>
                    </div>
                  );
                })}
              </div>

              {profile.note ? <p className="profile-note">{profile.note}</p> : null}
            </div>
          </aside>

          <div className="content-column">
            <section id="about" className="content-section hero-section">
              <div className="preface-banner">
                <p className="preface-eyebrow">{preface.eyebrow}</p>
                {preface.title ? <h2 className="preface-title">{preface.title}</h2> : null}
                {preface.text ? <p className="preface-lead">{preface.text}</p> : null}
                <div className="preface-divider" aria-hidden="true" />
                <p className="intro-copy">{intro}</p>
              </div>

              <MetricStrip
                metrics={[
                  {
                    value: String(publications.length),
                    label: "Selected Works",
                    detail: `${acceptedPapers.length} peer-reviewed · ${publications.length - acceptedPapers.length} preprints`,
                  },
                  {
                    value: "5",
                    label: "Major Venues",
                    detail: "ICML · NeurIPS · ICLR · EMNLP · CVPR",
                  },
                  {
                    value: "Oral",
                    label: "Oral Highlight",
                    detail: "T2AV-Compass · CVPR 2026 VGBE",
                  },
                ]}
              />

              <InterestGrid items={interests} topicCounts={topicCounts} />

              <ResearchCopilot
                publications={publications}
                experienceGroups={experienceGroups}
                profileName={profile.name}
              />
            </section>

            <section id="news" className="content-section">
              <SectionHeading kicker="News" title="Recent Updates" meta={newsMeta} />
              <div className="timeline-list">
                {news.map((item, idx) => (
                  <article key={`${item.date}-${item.text}`} className={`timeline-row ${idx === 0 ? "is-latest" : ""}`}>
                    <div className="timeline-marker" aria-hidden="true" />
                    <p className="list-date">{item.date}</p>
                    <p className="list-text">
                      <RichInlineText text={item.text} />
                    </p>
                  </article>
                ))}
              </div>
            </section>

            <section id="publications" className="content-section">
              <SectionHeading
                kicker="Selected Publications"
                title="Papers and Projects"
                meta="* equal contribution · click figures to zoom"
              />
              <PublicationsSection publications={publications} profileName={profile.name} />
            </section>

            <section id="experience" className="content-section">
              <SectionHeading kicker="Experience" title="Education, Research & Industry" />
              <div className="experience-groups">
                {experienceGroups.map((group) => (
                  <div key={group.title} className="experience-group">
                    <h3 className="experience-group-title">{group.title}</h3>
                    <div className="experience-cards">
                      {group.items.map((item) => {
                        const isPresent = item.date.toLowerCase().includes("present");
                        return (
                          <article key={`${item.date}-${item.title}`} className="experience-row">
                            <div className="experience-date-col">
                              <span className="list-date">{item.date}</span>
                              {isPresent ? <span className="present-pill">Current</span> : null}
                            </div>
                            <div className="experience-main">
                              <h4 className="experience-title">{item.title}</h4>
                              <p className="list-text">{item.text}</p>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section id="visitors" className="content-section">
              <SectionHeading kicker="Visitors" title="Global Readership" />
              <VisitorMap />
            </section>

            <footer className="site-footer">
              <p className="footer-copy">
                © {new Date().getFullYear()} {profile.name} · {profile.affiliation}
              </p>
              <a href="#top" className="back-to-top">
                Back to top ↑
              </a>
            </footer>
          </div>
        </div>
      </main>
    </div>
  );
}
