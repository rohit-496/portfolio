/**
 * FlowArt — Page-Flip Scroll Portfolio
 * Rohit Nyaupane · 2026
 *
 * Behaviour:
 * - Body scroll is LOCKED. Each card scrolls internally.
 * - When you reach the BOTTOM of a card and keep scrolling → next card flies in.
 * - When you are at the TOP of a card and scroll up → previous card returns.
 * - On back-transition, the current card flies back down/out.
 */

(function () {
  "use strict";

  if (typeof gsap === "undefined") { console.error("GSAP not loaded"); return; }

  /* ── CONFIG ─────────────────────────────────── */
  const DUR      = 0.85;           // transition duration (seconds)
  const EASE_IN  = "power3.inOut"; // fly-in ease
  const EASE_OUT = "power3.inOut"; // fly-out ease
  const ROT      = 22;             // starting rotation when off-screen

  /* ── ELEMENTS ────────────────────────────────── */
  const spacer    = document.getElementById("flowSpacer");
  const floorCard = document.getElementById("card-contact");
  const animCards = [
    document.getElementById("card-hero"),
    document.getElementById("card-about"),
    document.getElementById("card-skills"),
    document.getElementById("card-projects"),
  ];
  // Full ordered card list: anim cards + contact
  const ALL = [...animCards, floorCard];

  /* ── LOCK PAGE SCROLL ────────────────────────── */
  // We handle all scrolling manually
  document.body.style.overflow = "hidden";
  if (spacer) { spacer.style.height = "0px"; }
  const wrapper = document.getElementById("flowArt");
  if (wrapper) { wrapper.style.height = "auto"; }

  /* ── INITIAL POSITIONS ───────────────────────── */
  gsap.set(floorCard, {
    zIndex: 1,
    y: "0%", rotation: 0, scale: 0.94,
    transformOrigin: "center center",
  });

  // Off-screen: About, Skills, Projects pushed below viewport + rotated
  animCards.slice(1).forEach(c => gsap.set(c, {
    zIndex: 2,
    y: "130%", rotation: ROT, scale: 1,
    transformOrigin: "bottom right",
  }));

  // Hero: fully visible on top
  gsap.set(animCards[0], {
    zIndex: 50,
    y: "0%", rotation: 0, scale: 1,
    transformOrigin: "bottom right",
  });

  /* ── STATE ───────────────────────────────────── */
  let current    = 0;       // index into ALL[]
  let isAnimating = false;

  /* ── HELPERS ─────────────────────────────────── */
  function activeCard() { return ALL[current]; }

  function activeInner() {
    const c = activeCard();
    return c ? c.querySelector(".flow-inner") : null;
  }

  /** True if the active card's content is scrolled to the bottom (or has no scroll) */
  function atBottom() {
    const el = activeInner();
    if (!el) return true;
    return el.scrollTop + el.clientHeight >= el.scrollHeight - 4;
  }

  /** True if the active card's content is scrolled to the very top */
  function atTop() {
    const el = activeInner();
    if (!el) return true;
    return el.scrollTop <= 4;
  }

  /* ── PROGRESS DOTS ───────────────────────────── */
  const dots = Array.from(document.querySelectorAll(".flow-dot"));
  function setDot(i) {
    dots.forEach((d, j) => d.classList.toggle("active", j === i));
  }
  setDot(0);

  /* ── TRANSITIONS ─────────────────────────────── */

  function goNext() {
    if (isAnimating || current >= ALL.length - 1) return;
    isAnimating = true;

    const from  = ALL[current];
    const toIdx = current + 1;
    const to    = ALL[toIdx];

    if (toIdx === ALL.length - 1) {
      // ── Reveal Contact (floor) card ──
      // All anim cards peel upward, floor rises to scale 1
      animCards.forEach(c => gsap.set(c, { zIndex: 56 }));
      gsap.set(floorCard, { zIndex: 55 });

      gsap.to(animCards, {
        y: "-120%", rotation: -7,
        duration: DUR, ease: EASE_OUT,
        stagger: { each: 0.06, from: "end" },
        onComplete: () => {
          gsap.to(floorCard, { scale: 1, duration: 0.35, ease: "power2.out" });
          current = toIdx;
          setDot(current);
          isAnimating = false;
        },
      });
    } else {
      // ── Normal fly-in ──
      // Land at z=50 (same as hero level, above floor)
      gsap.set(to, { zIndex: 60, y: "130%", rotation: ROT });

      // Reset inner scroll to top BEFORE animation so we see the top of the content
      const inner = to.querySelector(".flow-inner");
      if (inner) inner.scrollTop = 0;

      // Slightly scale down the current card for depth
      gsap.to(from, { scale: 0.95, duration: DUR, ease: EASE_IN });

      // Fly in the new card
      gsap.to(to, {
        y: "0%", rotation: 0,
        duration: DUR, ease: EASE_IN,
        onComplete: () => {
          gsap.set(to, { zIndex: 50 });
          current = toIdx;
          setDot(current);
          isAnimating = false;
        },
      });
    }
  }

  function goPrev() {
    if (isAnimating || current <= 0) return;
    isAnimating = true;

    const prevIdx = current - 1;

    if (current === ALL.length - 1) {
      // ── Un-reveal Contact: bring anim cards back down ──
      // Restore anim cards flying back in (reverse peel)
      animCards.forEach((c, i) => gsap.set(c, { zIndex: 56, y: "-120%", rotation: -7 }));
      gsap.set(floorCard, { zIndex: 55 });

      gsap.to(animCards, {
        y: "0%", rotation: 0,
        duration: DUR, ease: EASE_IN,
        stagger: { each: 0.06, from: "start" },
        onComplete: () => {
          // Restore z-indices
          animCards.forEach((c, i) => {
            gsap.set(c, { zIndex: i <= prevIdx ? 50 : 2 });
          });
          gsap.set(floorCard, { zIndex: 1, scale: 0.94 });
          current = prevIdx;
          setDot(current);
          isAnimating = false;
        },
      });
    } else {
      // ── Fly current card back down ──
      const fromCard = ALL[current];
      const toCard   = ALL[prevIdx];

      // Current card flies back below viewport
      gsap.set(fromCard, { zIndex: 60 });
      gsap.to(fromCard, {
        y: "130%", rotation: ROT,
        duration: DUR, ease: EASE_OUT,
        onComplete: () => {
          gsap.set(fromCard, { zIndex: 2 });
          // Scroll the returning card's content to bottom so user is at the end
          const inner = fromCard.querySelector(".flow-inner");
          if (inner) inner.scrollTop = inner.scrollHeight;
          current = prevIdx;
          setDot(current);
          isAnimating = false;
        },
      });

      // Scale previous card back to full size
      gsap.to(toCard, { scale: 1, duration: DUR, ease: EASE_IN });
    }
  }

  /* ── WHEEL HANDLER ───────────────────────────── */
  let wheelAcc  = 0;
  let wheelLock = false;

  document.addEventListener("wheel", e => {
    e.preventDefault();

    if (isAnimating) return;

    const el = activeInner();

    if (e.deltaY > 0) {
      // ── Scrolling DOWN ──
      if (atBottom()) {
        // Internal scroll is maxed → switch to next card
        wheelAcc += Math.abs(e.deltaY);
        if (wheelAcc > 60 && !wheelLock) {
          wheelLock = true;
          wheelAcc  = 0;
          goNext();
          setTimeout(() => { wheelLock = false; }, DUR * 1000 + 300);
        }
      } else {
        // Still content to scroll → scroll the inner div
        if (el) el.scrollTop += Math.ceil(e.deltaY);
        wheelAcc = 0;
      }
    } else {
      // ── Scrolling UP ──
      if (atTop()) {
        wheelAcc += Math.abs(e.deltaY);
        if (wheelAcc > 60 && !wheelLock) {
          wheelLock = true;
          wheelAcc  = 0;
          goPrev();
          setTimeout(() => { wheelLock = false; }, DUR * 1000 + 300);
        }
      } else {
        if (el) el.scrollTop += Math.ceil(e.deltaY); // deltaY is negative here
        wheelAcc = 0;
      }
    }
  }, { passive: false });

  /* ── TOUCH SUPPORT ───────────────────────────── */
  let touchY0 = 0;

  document.addEventListener("touchstart", e => {
    touchY0 = e.touches[0].clientY;
  }, { passive: true });

  document.addEventListener("touchend", e => {
    if (isAnimating) return;
    const diff = touchY0 - e.changedTouches[0].clientY;
    if (Math.abs(diff) < 60) return;

    if (diff > 0) {
      // swipe up → go next
      if (atBottom()) goNext();
      else {
        const el = activeInner();
        if (el) el.scrollTop += diff;
      }
    } else {
      // swipe down → go prev
      if (atTop()) goPrev();
      else {
        const el = activeInner();
        if (el) el.scrollTop += diff;
      }
    }
  }, { passive: true });

  /* ── DOT CLICKS ──────────────────────────────── */
  dots.forEach((dot, i) => {
    dot.addEventListener("click", () => {
      if (isAnimating || i === current) return;
      // Animate step by step toward target
      function step() {
        if (current === i || isAnimating) return;
        const fn = i > current ? goNext : goPrev;
        fn();
        setTimeout(step, DUR * 1000 + 150);
      }
      step();
    });
  });

  /* ── ANCHOR LINKS ────────────────────────────── */
  document.querySelectorAll("a[href^='#card-']").forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute("href"));
      if (!target) return;
      const targetIdx = parseInt(target.dataset.index, 10);
      if (targetIdx === current || isAnimating) return;
      function step() {
        if (current === targetIdx || isAnimating) return;
        const fn = targetIdx > current ? goNext : goPrev;
        fn();
        setTimeout(step, DUR * 1000 + 150);
      }
      step();
    });
  });

  /* ── HERO PARALLAX ───────────────────────────── */
  const heroPhoto = document.querySelector("#card-hero .hero-photo-wrap");
  if (heroPhoto) {
    document.addEventListener("mousemove", e => {
      if (current !== 0) return;
      gsap.to(heroPhoto, {
        x: (e.clientX / window.innerWidth  - 0.5) * 18,
        y: (e.clientY / window.innerHeight - 0.5) * 10,
        duration: 1.4, ease: "power2.out", overwrite: "auto",
      });
    });
  }

})();
