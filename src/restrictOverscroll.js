/**
 * Stops the page from stretching past its top/bottom edge on trackpad and
 * touch, without touching the CSS `overscroll-behavior` property — that
 * property reliably breaks normal scrolling in this app (confirmed more
 * than once), so this reimplements just the boundary-clamping part by hand:
 * intercept wheel/touch only at the exact moment a gesture would push past
 * the edge, and only on the page's own document-level scroll. Any element
 * with its own scroll container (e.g. the signed-in app shell's `.content`)
 * is left completely alone — it keeps its native scroll and bounce, since
 * this only acts when the gesture target has no scrollable ancestor of its
 * own to handle it.
 */
export function restrictOverscroll() {
  // Tracks the PREVIOUS touch position, not the gesture's starting position
  // — direction has to be judged move-to-move. Using the start position for
  // the whole gesture misjudges direction once a finger reverses mid-touch
  // (e.g. pull-past-top then back down without lifting), letting a native
  // bounce sneak through right at that reversal.
  let lastTouchY = 0;

  function hasOwnScroller(target) {
    let el = target instanceof Element ? target : target?.parentElement;
    while (el && el !== document.body && el !== document.documentElement) {
      const style = getComputedStyle(el);
      const scrollsY = style.overflowY === "auto" || style.overflowY === "scroll";
      if (scrollsY && el.scrollHeight > el.clientHeight) return true;
      el = el.parentElement;
    }
    return false;
  }

  function atTop() {
    return window.scrollY <= 0;
  }

  function atBottom() {
    return Math.ceil(window.scrollY + window.innerHeight) >= document.documentElement.scrollHeight;
  }

  function onWheel(e) {
    if (hasOwnScroller(e.target)) return;
    if ((e.deltaY < 0 && atTop()) || (e.deltaY > 0 && atBottom())) {
      e.preventDefault();
    }
  }

  function onTouchStart(e) {
    lastTouchY = e.touches[0]?.clientY ?? 0;
  }

  function onTouchMove(e) {
    if (e.touches.length !== 1 || hasOwnScroller(e.target)) return;
    const currentY = e.touches[0].clientY;
    const dy = lastTouchY - currentY; // > 0 = finger moved up since last event = page scrolling down
    lastTouchY = currentY;
    if ((dy < 0 && atTop()) || (dy > 0 && atBottom())) {
      e.preventDefault();
    }
  }

  window.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("touchstart", onTouchStart, { passive: true });
  window.addEventListener("touchmove", onTouchMove, { passive: false });
}
