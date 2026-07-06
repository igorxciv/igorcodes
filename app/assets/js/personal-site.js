// This theme logic is a deliberately duplicated pair with the inline pre-paint
// script in personal-site.njk (which runs before paint to avoid a theme flash).
// Both must agree on the storage key "fm-theme" and the default-dark behavior.
(function initPersonalSitePage() {
  const THEME_STORAGE_KEY = "fm-theme";

  document.body.classList.add("fm-enhanced");

  const root = document.documentElement;
  const themeToggle = document.querySelector("[data-theme-toggle]");
  const themeColorMetas = document.querySelectorAll('meta[name="theme-color"]');
  const revealItems = Array.from(document.querySelectorAll(".fm-reveal"));
  const heroSection = document.querySelector("#hero");
  const scrollDownIndicator = document.querySelector(".fm-scroll-down");
  const timeline = document.querySelector("[data-timeline]");
  const timelineProgress = document.querySelector("[data-timeline-progress]");
  const prefersReducedMotion =
    "matchMedia" in window && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const systemThemeQuery =
    "matchMedia" in window ? window.matchMedia("(prefers-color-scheme: light)") : null;

  const getStoredTheme = () => {
    try {
      const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
      return storedTheme === "light" || storedTheme === "dark" ? storedTheme : null;
    } catch {
      return null;
    }
  };

  const getPreferredTheme = () => {
    const storedTheme = getStoredTheme();
    if (storedTheme) {
      return storedTheme;
    }

    return systemThemeQuery?.matches ? "light" : "dark";
  };

  const updateThemeToggleState = (theme) => {
    if (!themeToggle) {
      return;
    }

    themeToggle.setAttribute("aria-checked", String(theme === "light"));
    themeToggle.dataset.theme = theme;
  };

  const applyTheme = (theme) => {
    root.dataset.theme = theme;
    root.style.colorScheme = theme;

    const { themeColorLight, themeColorDark } = root.dataset;
    const color = theme === "light" ? themeColorLight : themeColorDark;

    themeColorMetas.forEach((meta) => {
      meta.removeAttribute("media");
      meta.setAttribute("content", color);
    });

    updateThemeToggleState(theme);
  };

  const persistTheme = (theme) => {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage failures and keep the selected theme active.
    }
  };

  const commitTheme = (theme) => {
    applyTheme(theme);
    persistTheme(theme);
  };

  const toggleTheme = () => {
    const currentTheme = root.dataset.theme === "light" ? "light" : "dark";
    const nextTheme = currentTheme === "light" ? "dark" : "light";
    commitTheme(nextTheme);
  };

  applyTheme(getPreferredTheme());

  if (themeToggle) {
    themeToggle.addEventListener("click", toggleTheme);
  }

  if (systemThemeQuery) {
    systemThemeQuery.addEventListener("change", (event) => {
      if (getStoredTheme()) {
        return;
      }

      applyTheme(event.matches ? "light" : "dark");
    });
  }

  const setScrollIndicatorActive = (isActive) => {
    if (!scrollDownIndicator) {
      return;
    }

    scrollDownIndicator.classList.toggle("is-hero-active", isActive && !prefersReducedMotion);
  };

  if ("IntersectionObserver" in window && heroSection && scrollDownIndicator) {
    const heroObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setScrollIndicatorActive(entry.isIntersecting && entry.intersectionRatio > 0.56);
        });
      },
      {
        threshold: [0.56, 0.82],
      },
    );

    heroObserver.observe(heroSection);
  } else {
    setScrollIndicatorActive(Boolean(scrollDownIndicator));
  }

  if ("IntersectionObserver" in window && revealItems.length > 0) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.18,
      },
    );

    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  let timelineTargetProgress = 0;
  let timelineCurrentProgress = 0;
  let timelineFrame = null;

  const setTimelineProgress = (progress) => {
    if (!timelineProgress) {
      return;
    }

    timelineProgress.style.height = `${progress * 100}%`;
    timelineProgress.classList.toggle("is-active", progress > 0.015 && progress < 0.999);
  };

  const animateTimelineProgress = () => {
    const delta = timelineTargetProgress - timelineCurrentProgress;

    if (Math.abs(delta) < 0.0012) {
      timelineCurrentProgress = timelineTargetProgress;
      setTimelineProgress(timelineCurrentProgress);
      timelineFrame = null;
      return;
    }

    timelineCurrentProgress += delta * 0.2;
    setTimelineProgress(timelineCurrentProgress);
    timelineFrame = window.requestAnimationFrame(animateTimelineProgress);
  };

  const updateTimelineProgress = () => {
    if (!timeline || !timelineProgress) {
      return;
    }

    const rect = timeline.getBoundingClientRect();
    if (rect.height <= 0) {
      return;
    }

    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const position = viewportHeight - rect.top;
    const progress = Math.max(0, Math.min(position / rect.height, 1));
    timelineTargetProgress = progress;

    if (prefersReducedMotion) {
      timelineCurrentProgress = timelineTargetProgress;
      setTimelineProgress(timelineCurrentProgress);
      return;
    }

    if (timelineFrame === null) {
      timelineFrame = window.requestAnimationFrame(animateTimelineProgress);
    }
  };

  updateTimelineProgress();
  window.addEventListener("scroll", updateTimelineProgress, { passive: true });
  window.addEventListener("resize", updateTimelineProgress);
})();
