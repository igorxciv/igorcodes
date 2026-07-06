(function initNotFoundPage() {
  const notFoundPage = document.querySelector("[data-404]");

  if (!notFoundPage) {
    return;
  }

  document.body.classList.add("fm-enhanced");

  const codeElement = notFoundPage.querySelector("[data-404-code]");
  const codeShadowElement = notFoundPage.querySelector(
    "[data-404-code-shadow]",
  );
  const commandElement = notFoundPage.querySelector("[data-404-command]");
  const backButton = notFoundPage.querySelector("[data-404-back-link]");
  const prefersReducedMotion =
    "matchMedia" in window &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const prefersDataSaving =
    "connection" in navigator &&
    navigator.connection &&
    typeof navigator.connection.saveData === "boolean" &&
    navigator.connection.saveData;
  const allowAnimatedEffects = !prefersReducedMotion && !prefersDataSaving;

  const staticCode = codeElement?.dataset.staticValue || "404";
  const cleanupCallbacks = [];

  const addCleanup = (cleanup) => {
    if (typeof cleanup === "function") {
      cleanupCallbacks.push(cleanup);
    }
  };

  const setCode = (value) => {
    if (codeElement) {
      codeElement.textContent = value;
    }

    if (codeShadowElement) {
      codeShadowElement.textContent = value;
    }
  };

  if (backButton) {
    backButton.addEventListener("click", () => {
      const hasReferrer = Boolean(document.referrer);
      const referrerUrl = hasReferrer
        ? new URL(document.referrer, window.location.href)
        : null;
      const isSameOriginReferrer =
        referrerUrl &&
        referrerUrl.origin === window.location.origin &&
        referrerUrl.href !== window.location.href;

      if (isSameOriginReferrer) {
        window.location.assign(
          `${referrerUrl.pathname}${referrerUrl.search}${referrerUrl.hash}`,
        );
        return;
      }

      if (window.history.length > 1) {
        window.history.back();
        return;
      }

      window.location.assign("/");
    });
  }

  if (commandElement) {
    const fullCommand =
      commandElement.dataset.command || commandElement.textContent || "";

    if (allowAnimatedEffects) {
      let commandIndex = 0;
      commandElement.textContent = "";

      const typingInterval = window.setInterval(() => {
        commandIndex += 1;
        commandElement.textContent = fullCommand.slice(0, commandIndex);

        if (commandIndex >= fullCommand.length) {
          window.clearInterval(typingInterval);
        }
      }, 85);

      addCleanup(() => {
        window.clearInterval(typingInterval);
      });
    } else {
      commandElement.textContent = fullCommand;
    }
  }

  if (allowAnimatedEffects) {
    const glitchChars = ["404", "4Ø4", "4□4", "404", "4o4", "404"];
    const glitchInterval = window.setInterval(() => {
      const randomIndex = Math.floor(Math.random() * glitchChars.length);
      setCode(glitchChars[randomIndex]);
    }, 160);
    const glitchStopTimeout = window.setTimeout(() => {
      window.clearInterval(glitchInterval);
      setCode(staticCode);
    }, 12_000);

    addCleanup(() => {
      window.clearInterval(glitchInterval);
    });
    addCleanup(() => {
      window.clearTimeout(glitchStopTimeout);
    });
  } else {
    setCode(staticCode);
  }

  window.addEventListener(
    "pagehide",
    () => {
      cleanupCallbacks.forEach((cleanup) => {
        cleanup();
      });
    },
    { once: true },
  );
})();
