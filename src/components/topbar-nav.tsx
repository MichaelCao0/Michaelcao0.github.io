"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type NavItem = {
  label: string;
  href: string;
};

type GlideBox = {
  left: number;
  width: number;
  ready: boolean;
  animated: boolean;
};

export function TopbarNav({ items }: { items: NavItem[] }) {
  const [activeHref, setActiveHref] = useState<string>(items[0]?.href ?? "#about");
  const [glide, setGlide] = useState<GlideBox>({ left: 0, width: 0, ready: false, animated: false });
  const navRef = useRef<HTMLElement | null>(null);
  const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const animRafRef = useRef<number | null>(null);

  const syncGlide = useCallback((href: string) => {
    const navEl = navRef.current;
    const activeEl = linkRefs.current[href];
    if (!navEl || !activeEl) {
      return;
    }

    const left = activeEl.offsetLeft;
    const width = activeEl.offsetWidth;
    if (width > 0) {
      setGlide((prev) => {
        if (!prev.ready) {
          if (animRafRef.current !== null) {
            window.cancelAnimationFrame(animRafRef.current);
          }
          animRafRef.current = window.requestAnimationFrame(() => {
            setGlide((curr) => (curr.ready && !curr.animated ? { ...curr, animated: true } : curr));
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
    return () => {
      if (animRafRef.current !== null) {
        window.cancelAnimationFrame(animRafRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const sectionIds = items.map((item) => item.href.replace(/^#/, ""));

    const updateActiveFromScroll = () => {
      const threshold = window.scrollY + 148;
      let current = items[0]?.href ?? "#about";

      for (const id of sectionIds) {
        const element = document.getElementById(id);
        if (element) {
          const rectTop = element.getBoundingClientRect().top + window.scrollY;
          if (rectTop <= threshold) {
            current = `#${id}`;
          }
        }
      }

      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 36) {
        current = items[items.length - 1]?.href ?? current;
      }

      setActiveHref((prev) => (prev === current ? prev : current));
    };

    const raf = window.requestAnimationFrame(updateActiveFromScroll);
    window.addEventListener("scroll", updateActiveFromScroll, { passive: true });
    window.addEventListener("resize", updateActiveFromScroll);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("scroll", updateActiveFromScroll);
      window.removeEventListener("resize", updateActiveFromScroll);
    };
  }, [items]);

  useEffect(() => {
    const raf = window.requestAnimationFrame(() => {
      syncGlide(activeHref);
      const navEl = navRef.current;
      const activeEl = linkRefs.current[activeHref];
      if (navEl && activeEl && navEl.scrollWidth > navEl.clientWidth + 2) {
        const maxScroll = navEl.scrollWidth - navEl.clientWidth;
        const centered = activeEl.offsetLeft - (navEl.clientWidth - activeEl.offsetWidth) / 2;
        const nextScroll = Math.max(0, Math.min(maxScroll, centered));
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        navEl.scrollTo({ left: nextScroll, behavior: reduced ? "auto" : "smooth" });
      }
    });

    const navEl = navRef.current;
    if (!navEl || typeof ResizeObserver === "undefined") {
      return () => window.cancelAnimationFrame(raf);
    }

    const observer = new ResizeObserver(() => {
      syncGlide(activeHref);
    });
    observer.observe(navEl);
    Object.values(linkRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => {
      window.cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [activeHref, syncGlide]);

  return (
    <nav
      ref={navRef}
      className={`topbar-nav ${glide.ready ? "has-glide" : ""}`}
      aria-label="Primary sections"
    >
      <span
        className={`topbar-glide-pill ${glide.animated ? "is-animated" : ""}`}
        aria-hidden="true"
        style={{
          width: `${glide.width}px`,
          transform: `translate3d(${glide.left}px, 0, 0)`,
          opacity: glide.ready ? 1 : 0,
        }}
      />
      {items.map((item) => {
        const isActive = activeHref === item.href;
        return (
          <a
            key={item.href}
            ref={(el) => {
              linkRefs.current[item.href] = el;
            }}
            href={item.href}
            onClick={() => {
              setActiveHref(item.href);
              syncGlide(item.href);
            }}
            className={`topbar-link ${isActive ? "is-active" : ""}`}
            aria-current={isActive ? "location" : undefined}
          >
            {item.label}
          </a>
        );
      })}
    </nav>
  );
}
