// This theme logic is a deliberately duplicated pair with the inline pre-paint
// script in personal-site.njk (which runs before paint to avoid a theme flash).
// Both must agree on the storage key "fm-theme" and the default-dark behavior.
//
// The same holds for seasonal scenes: the pre-paint script picks the season
// and reads the stored choice under "fm-scene"; this file owns the season
// control and everything a scene does after first paint.
(function initPersonalSitePage() {
  const THEME_STORAGE_KEY = "fm-theme";
  const SCENE_STORAGE_KEY = "fm-scene";

  // The ambient layer waits this long after page load, then for an idle
  // browser, before it downloads anything.
  const AMBIENT_LOAD_DELAY_MS = 2000;
  // Frame-rate watch. It starts after the settle time (longer than any
  // scene's fade-in), then averages over one window at a time.
  const FRAME_WATCH_SETTLE_MS = 4500;
  const FRAME_WATCH_WINDOW_MS = 3000;
  const FRAME_WATCH_MIN_FPS = 20;

  document.body.classList.add("fm-enhanced");

  const root = document.documentElement;
  const themeToggle = document.querySelector("[data-theme-toggle]");
  const themeColorMetas = document.querySelectorAll('meta[name="theme-color"]');
  const revealItems = Array.from(document.querySelectorAll(".fm-reveal"));
  const heroSection = document.querySelector("#hero");
  const scrollDownIndicator = document.querySelector(".fm-scroll-down");
  const timeline = document.querySelector("[data-timeline]");
  const timelineProgress = document.querySelector("[data-timeline-progress]");
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const systemThemeQuery = window.matchMedia("(prefers-color-scheme: light)");
  // Set once the seasonal scene is set up; told about every theme change.
  let seasonalScene = null;

  const getStoredTheme = () => {
    try {
      const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
      return storedTheme === "light" || storedTheme === "dark"
        ? storedTheme
        : null;
    } catch {
      return null;
    }
  };

  const getPreferredTheme = () => {
    const storedTheme = getStoredTheme();
    if (storedTheme) {
      return storedTheme;
    }

    return systemThemeQuery.matches ? "light" : "dark";
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
    seasonalScene?.themeChanged();
  };

  const persistTheme = (theme) => {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage failures (private mode, quota, disabled cookies).
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

  systemThemeQuery.addEventListener("change", (event) => {
    if (getStoredTheme()) {
      return;
    }

    applyTheme(event.matches ? "light" : "dark");
  });

  const setScrollIndicatorActive = (isActive) => {
    if (!scrollDownIndicator) {
      return;
    }

    scrollDownIndicator.classList.toggle(
      "is-hero-active",
      isActive && !prefersReducedMotion,
    );
  };

  if (heroSection && scrollDownIndicator) {
    const heroObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setScrollIndicatorActive(
            entry.isIntersecting && entry.intersectionRatio > 0.56,
          );
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

  if (revealItems.length > 0) {
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

    revealItems.forEach((item) => {
      observer.observe(item);
    });
  }

  let timelineTargetProgress = 0;
  let timelineCurrentProgress = 0;
  let timelineFrame = null;

  const setTimelineProgress = (progress) => {
    if (!timelineProgress) {
      return;
    }

    timelineProgress.style.height = `${progress * 100}%`;
    timelineProgress.classList.toggle(
      "is-active",
      progress > 0.015 && progress < 0.999,
    );
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

    const viewportHeight =
      window.innerHeight || document.documentElement.clientHeight;
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

  // ---- Seasonal scene -------------------------------------------------
  // A scene has two parts: content accents (still, on the content itself) and
  // an ambient layer (animated, optional for any visit). The season control
  // switches both. See app/assets/scenes/ for the scenes themselves.

  const wait = (ms) =>
    new Promise((resolve) => {
      window.setTimeout(resolve, ms);
    });

  const pageLoaded = () =>
    new Promise((resolve) => {
      if (document.readyState === "complete") {
        resolve();
        return;
      }
      window.addEventListener("load", resolve, { once: true });
    });

  const tabVisible = () =>
    new Promise((resolve) => {
      if (!document.hidden) {
        resolve();
        return;
      }
      const onChange = () => {
        if (!document.hidden) {
          document.removeEventListener("visibilitychange", onChange);
          resolve();
        }
      };
      document.addEventListener("visibilitychange", onChange);
    });

  const browserIdle = () =>
    new Promise((resolve) => {
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(resolve);
        return;
      }
      window.setTimeout(resolve, 200);
    });

  // Phones and less capable devices get the scene's lighter form. Decided
  // once per visit, when the ambient layer first mounts.
  const needsLighterForm = () =>
    window.innerWidth < 700 ||
    window.matchMedia("(pointer: coarse)").matches ||
    navigator.deviceMemory <= 4 ||
    navigator.hardwareConcurrency <= 4;

  // Calls onSlow when the page's frame rate, averaged over a window, falls
  // under the minimum while the scene is drawing. Paused time is ignored.
  const createFrameWatch = (host, onSlow) => {
    let settleTimer = null;
    let frameRequest = null;
    let windowStart = 0;
    let frameCount = 0;
    let isHostVisible = true;

    const hostObserver = new IntersectionObserver((entries) => {
      isHostVisible = entries.at(-1).isIntersecting;
    });

    // Paused time is ignored: a window only counts while the tab is visible
    // and the host is in view, and starts again after either changes.
    const restartWindow = () => {
      windowStart = 0;
    };

    const measure = (now) => {
      if (document.hidden || !isHostVisible) {
        restartWindow();
        return;
      }
      if (windowStart === 0) {
        windowStart = now;
        frameCount = 0;
        return;
      }

      frameCount += 1;
      const elapsed = now - windowStart;
      if (elapsed < FRAME_WATCH_WINDOW_MS) {
        return;
      }

      windowStart = 0;
      if ((frameCount * 1000) / elapsed < FRAME_WATCH_MIN_FPS) {
        onSlow();
      }
    };

    const tick = (now) => {
      frameRequest = window.requestAnimationFrame(tick);
      measure(now);
    };

    const stop = () => {
      window.clearTimeout(settleTimer);
      window.cancelAnimationFrame(frameRequest);
      hostObserver.disconnect();
      document.removeEventListener("visibilitychange", restartWindow);
      settleTimer = null;
      frameRequest = null;
    };

    const start = () => {
      stop();
      restartWindow();
      hostObserver.observe(host);
      document.addEventListener("visibilitychange", restartWindow);
      settleTimer = window.setTimeout(() => {
        frameRequest = window.requestAnimationFrame(tick);
      }, FRAME_WATCH_SETTLE_MS);
    };

    return { start, stop };
  };

  // Loads, mounts and removes one scene's ambient layer. Failure of any kind
  // is silent: the content accents stay and the next visit tries again.
  const createAmbientLayer = (scene, host, seasonToggle) => {
    let modulePromise = null;
    let handle = null;
    let isWanted = false;
    let isLighter = null;
    let isGoneForVisit = false;
    // Bumped on every start and stop, so work started earlier can tell that
    // it has been overtaken.
    let run = 0;

    const getContext = () => ({
      theme: root.dataset.theme === "light" ? "light" : "dark",
      occasions: scene.occasions,
      lighter: isLighter,
      assets: scene.assets,
    });

    const frameWatch = createFrameWatch(host, () => {
      if (isLighter) {
        // Too slow even in the lighter form: no ambient layer for the rest
        // of the visit. The control stays on and nothing is remembered.
        isGoneForVisit = true;
        stop();
        return;
      }
      isLighter = true;
      handle?.update(getContext());
      // Give the lighter form time to settle before judging it.
      frameWatch.start();
    });

    // A lost graphics context ends the ambient layer for this visit, like
    // any other failure. The event does not bubble, hence the capture phase.
    host.addEventListener(
      "webglcontextlost",
      () => {
        isGoneForVisit = true;
        stop();
      },
      true,
    );

    const loadModule = () => {
      modulePromise ??= import(scene.ambient).catch((error) => {
        modulePromise = null;
        throw error;
      });
      return modulePromise;
    };

    const mount = async (ownRun) => {
      const module = await loadModule();
      if (ownRun !== run) {
        return;
      }

      isLighter ??= needsLighterForm();
      const mounted = await module.mount(host, getContext());
      if (ownRun !== run) {
        mounted.destroy();
        return;
      }

      handle = mounted;
      // The theme may have changed while the scene was loading.
      handle.update(getContext());
      root.dataset.sceneAmbient = scene.season;
      frameWatch.start();
    };

    const waitForIdle = async () => {
      await pageLoaded();
      await wait(AMBIENT_LOAD_DELAY_MS);
      do {
        await tabVisible();
        await browserIdle();
      } while (document.hidden);
    };

    const start = async (isImmediate) => {
      run += 1;
      const ownRun = run;

      try {
        if (isImmediate) {
          seasonToggle.dataset.busy = "";
        } else {
          await waitForIdle();
        }
        if (ownRun === run) {
          await mount(ownRun);
        }
      } catch {
        // Silent: no three.js, no WebGL, or a failed download.
      } finally {
        if (ownRun === run) {
          seasonToggle.removeAttribute("data-busy");
        }
      }
    };

    function stop() {
      run += 1;
      isWanted = false;
      frameWatch.stop();
      seasonToggle.removeAttribute("data-busy");
      root.removeAttribute("data-scene-ambient");
      handle?.destroy();
      handle = null;
    }

    const set = (shouldRun, isImmediate) => {
      if (!shouldRun || isGoneForVisit) {
        stop();
        return;
      }
      if (isWanted) {
        return;
      }
      isWanted = true;
      start(isImmediate).catch(() => {
        // start() already swallows its own failures.
      });
    };

    return {
      set,
      themeChanged: () => handle?.update(getContext()),
    };
  };

  // Shows and hides one scene's content accents: the data-scene switch that
  // its accents.css hangs off, plus its accents.js when it has one.
  const createContentAccents = (scene) => {
    let modulePromise = null;
    let isShown = false;

    const sync = (module) => {
      if (isShown) {
        module.apply();
      } else {
        module.remove();
      }
    };

    const set = (shouldShow) => {
      isShown = shouldShow;

      if (shouldShow) {
        root.dataset.scene = scene.season;
        root.toggleAttribute("data-occasions", scene.occasions.length > 0);
        if (scene.occasions.length > 0) {
          root.dataset.occasions = scene.occasions.join(" ");
        }
      } else {
        root.removeAttribute("data-scene");
        root.removeAttribute("data-occasions");
      }

      if (!scene.accents || !(shouldShow || modulePromise)) {
        return;
      }
      modulePromise ??= import(scene.accents);
      modulePromise.then(sync).catch(() => {
        // Silent: without accents.js the scene keeps its CSS accents.
      });
    };

    return { set };
  };

  const initSeasonalScene = (scene) => {
    const seasonToggle = document.querySelector("[data-season-toggle]");
    const host = scene.slot
      ? document.querySelector(`[data-scene-slot="${scene.slot}"]`)
      : null;
    if (!seasonToggle) {
      return null;
    }

    const hasAmbient = Boolean(scene.ambient && host);
    const forcedColorsQuery = window.matchMedia("(forced-colors: active)");
    // Visitors who asked for less motion, less data or more contrast get the
    // content accents only, unless they switch the scene on themselves.
    const quietQueries = [
      window.matchMedia("(prefers-reduced-motion: reduce)"),
      window.matchMedia("(prefers-reduced-data: reduce)"),
      window.matchMedia("(prefers-contrast: more)"),
    ];
    const prefersQuiet = () =>
      quietQueries.some((query) => query.matches) ||
      navigator.connection?.saveData === true;

    const readStoredChoice = () => {
      try {
        const stored = window.localStorage.getItem(SCENE_STORAGE_KEY);
        return stored === "on" || stored === "off" ? stored : null;
      } catch {
        return null;
      }
    };

    // null (nothing stored), "on" or "off". One choice for every season; an
    // explicit choice always beats the automatic rule.
    let choice = readStoredChoice();

    const accents = createContentAccents(scene);
    const ambient = hasAmbient
      ? createAmbientLayer(scene, host, seasonToggle)
      : null;

    const getState = () => {
      if (forcedColorsQuery.matches) {
        return { hasControl: false, showAccents: false, runAmbient: false };
      }
      if (choice === "off") {
        return { hasControl: true, showAccents: false, runAmbient: false };
      }
      return {
        hasControl: true,
        showAccents: true,
        runAmbient: choice === "on" || !prefersQuiet(),
      };
    };

    const render = (isImmediate) => {
      const state = getState();
      const isOn = hasAmbient ? state.runAmbient : state.showAccents;

      seasonToggle.hidden = !state.hasControl;
      seasonToggle.setAttribute("aria-checked", String(isOn));
      accents.set(state.showAccents);
      ambient?.set(state.runAmbient, isImmediate);
    };

    seasonToggle.addEventListener("click", () => {
      const isOn = seasonToggle.getAttribute("aria-checked") === "true";
      if (isOn) {
        choice = "off";
      } else {
        // Where the scene has no ambient layer by design (no slot on this
        // page, or none in the scene), switching on is not an explicit
        // choice: it clears the stored one and returns the visitor to what
        // the site would pick. An ambient layer that exists but is not
        // running (no WebGL, failed download, too slow) still stores "on".
        choice = hasAmbient ? "on" : null;
      }
      try {
        if (choice) {
          window.localStorage.setItem(SCENE_STORAGE_KEY, choice);
        } else {
          window.localStorage.removeItem(SCENE_STORAGE_KEY);
        }
      } catch {
        // Ignore storage failures; the choice still holds for this visit.
      }
      render(true);
    });

    // With nothing stored, the scene follows these settings live.
    [forcedColorsQuery, ...quietQueries].forEach((query) => {
      query.addEventListener("change", () => render(false));
    });

    const icon = seasonToggle.querySelector(
      `[data-season-icon="${scene.season}"]`,
    );
    if (icon) {
      icon.hidden = false;
    }

    render(false);

    return { themeChanged: () => ambient?.themeChanged() };
  };

  // Set by the pre-paint script when the current season has a scene with
  // something to show on this page; otherwise the control stays hidden.
  if (window.__fmScene) {
    seasonalScene = initSeasonalScene(window.__fmScene);
  }
})();
