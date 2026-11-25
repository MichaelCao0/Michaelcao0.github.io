"use client";

export function ThemeToggle() {
  const toggleTheme = () => {
    const current = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    const nextTheme = current === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    try {
      window.localStorage.setItem("theme", nextTheme);
    } catch {
      // Ignore storage access errors in private browsing
    }
  };

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label="Toggle color theme"
      title="Switch light / dark appearance"
    >
      <span className="theme-track" aria-hidden="true">
        <span className="theme-cloud theme-cloud-a" />
        <span className="theme-cloud theme-cloud-b" />
        <span className="theme-stars" />
      </span>
      <span className="theme-thumb" aria-hidden="true">
        <span className="theme-thumb-core" />
      </span>
    </button>
  );
}
