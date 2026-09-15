/**
 * Clamps every scrollable surface in the app (the document itself, and any
 * nested scroller like the signed-in app shell's `.content`) to its real
 * top/bottom edge on wheel/touch, without touching the CSS
 * `overscroll-behavior` property — that property reliably breaks normal
 * scrolling in this app (confirmed repeatedly), so this reimplements just
 * the boundary-clamping part by hand instead.
 *
 * For every wheel/touch tick this computes where the delta would actually
 * land BEFORE it's applied, and only intervenes (preventDefault + set the
 * position directly) when that would go past the edge — deciding purely
 * from "are we already resting at the edge?" misses the one tick that
 * FIRST crosses into it (e.g. position 40 and a tick of -80 both starts
 * and lands past 0 in the same event), so the clamp has to be computed
 * ahead of time, not reacted to after the fact. Every other tick is left
 * completely untouched, so normal scrolling stays native and smooth.
 *
 * Also re-clamps after the page's own content changes shape (collapsing an
 * accordion row while scrolled near the bottom, etc.) — see clampToContent
 * below for why that needs a separate mechanism from the gesture clamping.
 */
export function restrictOverscroll() {
  // Tracks the PREVIOUS touch position, not the gesture's starting position
  // — direction has to be judged move-to-move.
  let lastTouchY = 0;

  // Nearest scrollable ancestor of the event target, or null for the
  // document's own scroll (the common case on public/marketing pages).
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

  function getPos(scroller) {
    return scroller ? scroller.scrollTop : window.scrollY;
  }

  function getMax(scroller) {
    if (scroller) return Math.max(0, scroller.scrollHeight - scroller.clientHeight);
    return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  }

  function setPos(scroller, value) {
    if (scroller) scroller.scrollTop = value;
    else window.scrollTo(0, value);
  }

  function clamp(scroller, delta, e) {
    const max = getMax(scroller);
    const next = getPos(scroller) + delta;
    if (next < 0 || next > max) {
      e.preventDefault();
      setPos(scroller, Math.min(max, Math.max(0, next)));
    }
  }

  function onWheel(e) {
    clamp(findScroller(e.target), e.deltaY, e);
  }

  function onTouchStart(e) {
    lastTouchY = e.touches[0]?.clientY ?? 0;
  }

  function onTouchMove(e) {
    if (e.touches.length !== 1) return;
    const currentY = e.touches[0].clientY;
    const dy = lastTouchY - currentY; // > 0 = finger moved up since last event = scrolling down
    lastTouchY = currentY;
    clamp(findScroller(e.target), dy, e);
  }

  window.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("touchstart", onTouchStart, { passive: true });
  window.addEventListener("touchmove", onTouchMove, { passive: false });

  // Wheel/touch only clamps the position DURING a scroll gesture — it does
  // nothing when the page's own content changes shape instead (collapsing
  // an accordion row, closing a card, anything that shrinks scrollHeight
  // while already scrolled near the bottom). Nothing re-clamps scrollTop on
  // its own when that happens, so the viewport can end up parked past the
  // new (shorter) end of content — blank space below the footer that's no
  // longer there to fill it. Re-check after every DOM change, on whichever
  // of the app's two root scrollers (the signed-in shell's `.content`, or
  // the public pages' `.lp-scroll`) is currently mounted.
  function clampToContent() {
    const scroller = document.querySelector(".content, .lp-scroll");
    if (!scroller) return;
    const max = getMax(scroller);
    if (getPos(scroller) > max) setPos(scroller, max);
  }

  let scheduled = false;
  function scheduleClamp() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      clampToContent();
    });
  }

  new MutationObserver(scheduleClamp).observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class", "style"],
  });
  window.addEventListener("resize", scheduleClamp);
}
