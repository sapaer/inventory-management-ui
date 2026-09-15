/**
 * Native "pull down at the top to refresh" only exists in mobile browsers
 * when the DOCUMENT itself scrolls and bounces — which restrictOverscroll.js
 * deliberately stops (see its own header comment) now that every page uses
 * a fixed shell with an internally-scrolling pane. That's the right fix for
 * the bounce, but it silently took the refresh gesture down with it, so
 * this reimplements just that gesture by hand: pull down from the top of
 * whatever the touch started on, past a threshold, and reload.
 */
const THRESHOLD = 68;
const MAX_PULL = 100;

export function initPullToRefresh() {
  let indicator = null;
  let iconEl = null;
  let startY = 0;
  let lastPull = 0;
  let pulling = false;
  let active = false;
  let refreshing = false;
  let scroller = null;

  function isMobile() {
    return window.matchMedia("(max-width: 900px)").matches;
  }

  // Nearest scrollable ancestor of the touch target, or null for the
  // document's own scroll — same rule restrictOverscroll.js uses.
  function findScroller(target) {
    let el = target instanceof Element ? target : target?.parentElement;
    while (el && el !== document.documentElement && el !== document.body) {
      const style = getComputedStyle(el);
      const scrollsY = style.overflowY === "auto" || style.overflowY === "scroll";
      if (scrollsY && el.scrollHeight > el.clientHeight) return el;
      el = el.parentElement;
    }
    return null;
  }

  function getScrollTop(el) {
    return el ? el.scrollTop : window.scrollY;
  }

  function ensureIndicator() {
    if (indicator) return;
    indicator = document.createElement("div");
    indicator.className = "ptr-indicator";
    iconEl = document.createElement("span");
    iconEl.className = "ptr-ic";
    iconEl.innerHTML =
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11A8 8 0 0 0 6 6.3L4 8"/><path d="M4 4v4h4"/><path d="M4 13a8 8 0 0 0 14 4.7l2-1.7"/><path d="M20 20v-4h-4"/></svg>';
    indicator.appendChild(iconEl);
    document.body.appendChild(indicator);
  }

  function paint(px) {
    ensureIndicator();
    const ratio = Math.min(1, px / THRESHOLD);
    indicator.style.opacity = px > 4 ? String(Math.min(1, ratio + 0.15)) : "0";
    indicator.style.transform = `translate(-50%, ${Math.min(px, MAX_PULL) - 40}px)`;
    iconEl.style.transform = `rotate(${ratio * 220}deg)`;
  }

  function paintRefreshing() {
    ensureIndicator();
    indicator.classList.add("ptr-spin");
    indicator.style.opacity = "1";
    indicator.style.transform = "translate(-50%, 14px)";
  }

  function reset() {
    if (!indicator) return;
    indicator.classList.remove("ptr-spin");
    indicator.style.opacity = "0";
    indicator.style.transform = "translate(-50%, -40px)";
  }

  function onTouchStart(e) {
    if (refreshing || !isMobile() || e.touches.length !== 1) {
      active = false;
      return;
    }
    scroller = findScroller(e.target);
    if (getScrollTop(scroller) > 0) {
      active = false;
      return;
    }
    active = true;
    pulling = false;
    lastPull = 0;
    startY = e.touches[0].clientY;
  }

  function onTouchMove(e) {
    if (!active || refreshing) return;
    const dy = e.touches[0].clientY - startY;
    if (dy <= 0 || getScrollTop(scroller) > 0) {
      active = false;
      pulling = false;
      reset();
      return;
    }
    pulling = true;
    e.preventDefault();
    lastPull = dy * 0.5;
    paint(lastPull);
  }

  function onTouchEnd() {
    if (!active) return;
    active = false;
    if (pulling && lastPull >= THRESHOLD) {
      refreshing = true;
      paintRefreshing();
      window.setTimeout(() => window.location.reload(), 350);
    } else {
      reset();
    }
    pulling = false;
  }

  window.addEventListener("touchstart", onTouchStart, { passive: true });
  window.addEventListener("touchmove", onTouchMove, { passive: false });
  window.addEventListener("touchend", onTouchEnd, { passive: true });
  window.addEventListener("touchcancel", onTouchEnd, { passive: true });
}
