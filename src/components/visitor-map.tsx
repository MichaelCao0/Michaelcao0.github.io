"use client";

import { useEffect, useRef, useState } from "react";

export function VisitorMap() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "blocked">("loading");

  useEffect(() => {
    const container = mountRef.current;
    if (!container || container.querySelector("script")) {
      return;
    }

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.id = "mapmyvisitors";
    script.src =
      "https://mapmyvisitors.com/map.js?d=IpOmOWxy0-p38X7mgCkXV16LIhDdgDn3uNLOmqsC4CM&cl=ffffff&w=a";
    script.async = true;
    script.onload = () => setStatus("ready");
    script.onerror = () => setStatus("blocked");
    container.appendChild(script);
  }, []);

  return (
    <div className="visitor-map-card">
      <div className="visitor-map-bar">
        <span className="visitor-map-caption">
          <span className="visitor-live-dot" aria-hidden="true" />
          Global academic readership
        </span>
        <a
          className="visitor-map-link"
          href="https://mapmyvisitors.com/web/1c9iu"
          target="_blank"
          rel="noreferrer"
        >
          View visitor analytics ↗
        </a>
      </div>

      <div className="visitor-map-shell">
        <div ref={mountRef} className="visitor-map-mount" />

        {status === "blocked" ? (
          <div className="visitor-map-fallback">
            <svg viewBox="0 0 120 64" fill="none" className="visitor-globe-svg" aria-hidden="true">
              <ellipse cx="60" cy="32" rx="46" ry="26" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 3" />
              <circle cx="60" cy="32" r="24" stroke="currentColor" strokeWidth="1.35" />
              <ellipse cx="60" cy="32" rx="11" ry="24" stroke="currentColor" strokeWidth="1.15" />
              <path d="M36 32h48M40 21h40M40 43h40" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
            </svg>
            <p className="visitor-fallback-title">Live visitor map unavailable in restricted / ad-blocked mode</p>
            <a
              href="https://mapmyvisitors.com/web/1c9iu"
              target="_blank"
              rel="noreferrer"
              className="visitor-fallback-cta"
            >
              Open MapMyVisitors dashboard ↗
            </a>
          </div>
        ) : null}
      </div>
    </div>
  );
}
