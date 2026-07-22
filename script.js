/* ==========================================================================
   Jessica Issa — Portfolio
   Vanilla JS only. No build step, no frameworks.
   Handles: dark/light theme toggle, smooth scroll, scroll-reveal animations,
   scroll parallax, the cursor-following project preview, the skills
   marquee, the mobile navigation drawer, magnetic CTA buttons, and the
   homepage hero background.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", function () {
  initTheme();
  initSmoothScroll();
  initRevealOnScroll();
  initCursorPreview();
  initMarquee();
  initMobileMenu();
  initFooterYear();
  initMagneticButtons();
  initParallax();
  initHeroConstellation();
});

/* --------------------------------------------------------------------------
   Theme toggle — defaults to the atmospheric dark mode on first visit,
   remembers the visitor's choice in localStorage from then on.
   -------------------------------------------------------------------------- */
function initTheme() {
  var root = document.documentElement;
  var toggle = document.getElementById("theme-toggle");
  var icon = document.getElementById("theme-icon");
  var stored = localStorage.getItem("jessica-theme");

  function applyTheme(theme) {
    if (theme === "light") {
      root.classList.remove("dark");
      if (icon) icon.textContent = "☀";
    } else {
      root.classList.add("dark");
      if (icon) icon.textContent = "☾";
    }
  }

  applyTheme(stored === "light" ? "light" : "dark");

  if (toggle) {
    toggle.addEventListener("click", function () {
      var isDark = root.classList.contains("dark");
      var next = isDark ? "light" : "dark";
      applyTheme(next);
      localStorage.setItem("jessica-theme", next);
    });
  }
}

/* --------------------------------------------------------------------------
   Scroll reveal — IntersectionObserver adds `.is-visible` once an element
   enters the viewport; CSS handles the actual transition (see style.css).
   -------------------------------------------------------------------------- */
function initRevealOnScroll() {
  var targets = document.querySelectorAll(".reveal");
  if (!targets.length) return;

  if (!("IntersectionObserver" in window)) {
    targets.forEach(function (el) {
      el.classList.add("is-visible");
    });
    return;
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
  );

  targets.forEach(function (el) {
    observer.observe(el);
  });
}

/* --------------------------------------------------------------------------
   Cursor-following project preview — on desktop, hovering the project list
   summons a small floating panel that trails the pointer with a light
   lerp/easing for a smooth, physical feel. Shows real photography where a
   row has it (data-image), otherwise the project's identity gradient.
   Disabled on touch (those users get the always-visible .row-thumb instead).

   Glitch fix: visibility (is-active) is toggled ONLY on the list container's
   enter/leave, not per-row. The previous version toggled it per-row, so
   moving the pointer across the hairline border between two rows fired a
   leave-then-enter pair that could land in different animation frames,
   producing a visible opacity flicker at every row boundary. Content
   (colour / image / label) now updates via a single delegated "mouseover"
   listener instead, completely decoupled from the show/hide transition.
   -------------------------------------------------------------------------- */
var CURSOR_PREVIEW_ICONS = {
  // 01 — Regulatory: a clipboard with a checkmark (audit, compliance).
  "01": '<rect x="14" y="8" width="20" height="32" rx="2"/><rect x="19" y="6" width="10" height="5" rx="1"/><path d="M18 24l5 5 9-11"/>',
  // 02 — Digital Platform Review: a browser window with content lines.
  "02": '<rect x="8" y="9" width="32" height="30" rx="2"/><line x1="8" y1="17" x2="40" y2="17"/><circle cx="13" cy="13" r="1"/><circle cx="17" cy="13" r="1"/><line x1="14" y1="24" x2="34" y2="24"/><line x1="14" y1="30" x2="27" y2="30"/>',
  // 03 — Digital Inclusion: two overlapping circles (access, connection).
  "03": '<circle cx="19" cy="24" r="12"/><circle cx="29" cy="24" r="12"/>',
  // 04 — Neuv: a simple ascending data series.
  "04": '<line x1="9" y1="38" x2="9" y2="27"/><line x1="18" y1="38" x2="18" y2="17"/><line x1="27" y1="38" x2="27" y2="9"/><line x1="36" y1="38" x2="36" y2="21"/>',
  // 05 — Mango: a sun (Mediterranean warmth).
  "05": '<circle cx="24" cy="24" r="9"/><line x1="24" y1="4" x2="24" y2="9"/><line x1="24" y1="39" x2="24" y2="44"/><line x1="4" y1="24" x2="9" y2="24"/><line x1="39" y1="24" x2="44" y2="24"/><line x1="10" y1="10" x2="13.5" y2="13.5"/><line x1="34.5" y1="34.5" x2="38" y2="38"/><line x1="38" y1="10" x2="34.5" y2="13.5"/><line x1="13.5" y1="34.5" x2="10" y2="38"/>',
  // 06 — SEAT: a steering wheel (mobility).
  "06": '<circle cx="24" cy="24" r="14"/><circle cx="24" cy="24" r="3"/><line x1="24" y1="10" x2="24" y2="18"/><line x1="13" y1="31" x2="19" y2="27"/><line x1="35" y1="31" x2="29" y2="27"/>',
  // 07 — GTB: a simple stacked burger.
  "07": '<path d="M9 20c0-7 7-12 15-12s15 5 15 12"/><line x1="8" y1="20" x2="40" y2="20"/><line x1="10" y1="26" x2="38" y2="26"/><line x1="10" y1="31" x2="38" y2="31"/><path d="M8 36h32"/>',
  // 08 — Moora Foods: a simple storefront.
  "08": '<path d="M8 18l3-8h26l3 8"/><line x1="8" y1="18" x2="40" y2="18"/><path d="M10 18v18h28V18"/><line x1="20" y1="36" x2="20" y2="26"/><line x1="28" y1="36" x2="28" y2="26"/><line x1="20" y1="26" x2="28" y2="26"/>'
};

function initCursorPreview() {
  var list = document.getElementById("work-list");
  var preview = document.getElementById("cursor-preview");
  var label = document.getElementById("cursor-preview-label");
  var icon = document.getElementById("cursor-preview-icon");
  if (!list || !preview) return;

  var isTouch = window.matchMedia("(pointer: coarse)").matches;
  if (isTouch) return;

  var mouseX = 0;
  var mouseY = 0;
  var panelX = 0;
  var panelY = 0;
  var lastRow = null;

  window.addEventListener("mousemove", function (e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  list.addEventListener("mouseenter", function () {
    preview.classList.add("is-active");
  });

  list.addEventListener("mouseleave", function () {
    preview.classList.remove("is-active");
    lastRow = null;
  });

  list.addEventListener("mouseover", function (e) {
    var row = e.target.closest(".project-row");
    if (!row || row === lastRow) return;
    lastRow = row;

    var text = row.getAttribute("data-label") || "";
    var iconKey = row.getAttribute("data-icon") || "";

    if (label) label.textContent = text;
    if (icon) icon.innerHTML = CURSOR_PREVIEW_ICONS[iconKey] || "";
  });

  function animate() {
    panelX += (mouseX - panelX) * 0.2;
    panelY += (mouseY - panelY) * 0.2;
    // Offsets are tuned for the panel's own size (currently w-28 h-32 /
    // 112x128px) so it trails just above-right of the cursor without
    // ballooning across neighbouring rows. Re-tune the -64 (roughly half
    // the panel height) if the panel's Tailwind size classes change.
    preview.style.transform =
      "translate(" + (panelX + 18) + "px," + (panelY - 64) + "px)";
    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}

/* --------------------------------------------------------------------------
   Skills marquee — the track's content is duplicated once in markup and
   the CSS animation scrolls exactly 50% of its width, so the loop is
   seamless regardless of viewport size.
   -------------------------------------------------------------------------- */
function initMarquee() {
  var track = document.getElementById("marquee-track");
  if (!track) return;

  var clone = track.innerHTML;
  track.insertAdjacentHTML("beforeend", clone);
}

/* --------------------------------------------------------------------------
   Mobile navigation drawer
   -------------------------------------------------------------------------- */
function initMobileMenu() {
  var toggle = document.getElementById("menu-toggle");
  var menu = document.getElementById("mobile-menu");
  if (!toggle || !menu) return;

  toggle.addEventListener("click", function () {
    menu.classList.toggle("is-open");
  });

  menu.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      menu.classList.remove("is-open");
    });
  });
}

/* --------------------------------------------------------------------------
   Footer year — keeps the copyright line accurate without manual edits.
   -------------------------------------------------------------------------- */
function initFooterYear() {
  var yearEl = document.getElementById("year");
  if (!yearEl) return;
  yearEl.textContent = "© " + new Date().getFullYear() + " — Jessica Issa";
}

/* --------------------------------------------------------------------------
   Smooth scroll (Lenis) — wraps native scroll rather than replacing it, so
   position:sticky, anchor links (#work, #about, #contact) and accessibility
   all keep working exactly as before. Synced to GSAP's own ticker (the
   documented Lenis+GSAP pattern) so Lenis and ScrollTrigger share a single
   requestAnimationFrame loop instead of fighting over two.

   Respects prefers-reduced-motion: if set, this function does nothing and
   the browser's default native scroll is left completely untouched.
   -------------------------------------------------------------------------- */
var lenisInstance = null;

function initSmoothScroll() {
  if (typeof Lenis === "undefined" || typeof gsap === "undefined") return;

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) return;

  lenisInstance = new Lenis({
    duration: 1.1,
    smoothWheel: true,
  });

  if (typeof ScrollTrigger !== "undefined") {
    lenisInstance.on("scroll", ScrollTrigger.update);
  }

  gsap.ticker.add(function (time) {
    lenisInstance.raf(time * 1000);
  });

  // Lenis already handles its own frame timing; let GSAP's ticker drive
  // everything on one clock instead of smoothing twice.
  gsap.ticker.lagSmoothing(0);
}

/* --------------------------------------------------------------------------
   Scroll parallax — a small, deliberately subtle drift on the large
   decorative index numbers (the faint "01" / "02" background numerals on
   project hero sections and the homepage section markers). Purely additive:
   it never touches the existing .reveal system, so the on-load reveal
   animation behaves exactly as it did before. Skipped entirely if GSAP/
   ScrollTrigger aren't loaded, or if the visitor prefers reduced motion.
   -------------------------------------------------------------------------- */
function initParallax() {
  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) return;

  gsap.registerPlugin(ScrollTrigger);

  var targets = document.querySelectorAll("[data-parallax]");
  if (!targets.length) return;

  targets.forEach(function (el) {
    var speed = parseFloat(el.getAttribute("data-parallax")) || 40;

    gsap.to(el, {
      y: speed,
      ease: "none",
      scrollTrigger: {
        trigger: el,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      },
    });
  });
}

/* --------------------------------------------------------------------------
   Hero background (constellation) — homepage only, hand-written canvas
   effect. A field of dim points sits behind the hero copy; individual
   points quietly "ignite" one at a time (never all at once), briefly
   glowing brighter and drawing thin, low-opacity trailing lines to a
   couple of nearby points, then fade back to their resting dim state.
   Most points, most of the time, are just quiet dots — the network only
   reveals itself in patches, which is the point ("Systems that hold under
   pressure" as a network metaphor, not a static mesh of sticks).

   Only runs in dark mode — colours are tuned for the void background, and
   switching to light mode clears the canvas rather than trying to
   recolour it live. Skipped entirely on touch devices and for
   prefers-reduced-motion, same discipline as the rest of the site's motion.
   -------------------------------------------------------------------------- */
function initHeroConstellation() {
  var canvas = document.getElementById("hero-constellation");
  if (!canvas || !canvas.getContext) return;

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isTouch = window.matchMedia("(pointer: coarse)").matches;
  if (prefersReducedMotion || isTouch) return;

  var ctx = canvas.getContext("2d");
  var container = canvas.parentElement;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);

  var CONNECT_RADIUS = 160;
  var MAX_LINKS = 3;
  var IGNITE_MIN = 2200;
  var IGNITE_MAX = 6000;
  var RAMP_UP = 550;
  var HOLD = 1000;
  var RAMP_DOWN = 800;

  var points = [];
  var running = false;
  var rafId = null;

  function seedPoints(w, h) {
    var count = Math.round((w * h) / 16000);
    count = Math.max(28, Math.min(count, 60));

    points = [];
    for (var i = 0; i < count; i++) {
      points.push({
        x: Math.random() * w,
        y: Math.random() * h,
        state: "idle",
        activation: 0,
        stateStart: performance.now() + Math.random() * IGNITE_MAX,
        links: []
      });
    }
  }

  function resize() {
    var rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + "px";
    canvas.style.height = rect.height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seedPoints(rect.width, rect.height);
  }

  function nearestLinks(point) {
    return points
      .filter(function (p) { return p !== point; })
      .map(function (p) {
        var dx = p.x - point.x;
        var dy = p.y - point.y;
        return { p: p, d: Math.sqrt(dx * dx + dy * dy) };
      })
      .filter(function (c) { return c.d < CONNECT_RADIUS; })
      .sort(function (a, b) { return a.d - b.d; })
      .slice(0, MAX_LINKS)
      .map(function (c) { return c.p; });
  }

  function tick(now) {
    if (!running) return;

    var w = canvas.width / dpr;
    var h = canvas.height / dpr;
    ctx.clearRect(0, 0, w, h);

    points.forEach(function (point) {
      var elapsed = now - point.stateStart;

      if (point.state === "idle") {
        if (elapsed >= 0) {
          point.state = "igniting";
          point.stateStart = now;
          point.links = nearestLinks(point);
        }
      } else if (point.state === "igniting") {
        point.activation = Math.min(1, elapsed / RAMP_UP);
        if (elapsed >= RAMP_UP) {
          point.state = "holding";
          point.stateStart = now;
        }
      } else if (point.state === "holding") {
        point.activation = 1;
        if (elapsed >= HOLD) {
          point.state = "fading";
          point.stateStart = now;
        }
      } else if (point.state === "fading") {
        point.activation = Math.max(0, 1 - elapsed / RAMP_DOWN);
        if (elapsed >= RAMP_DOWN) {
          point.state = "idle";
          point.activation = 0;
          point.links = [];
          point.stateStart = now + IGNITE_MIN + Math.random() * (IGNITE_MAX - IGNITE_MIN);
        }
      }

      // Resting dot — always faintly present, whether or not this point
      // is currently active. This is what keeps the field from going
      // completely blank between ignitions.
      ctx.beginPath();
      ctx.arc(point.x, point.y, 1.4, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(198, 255, 61, 0.08)";
      ctx.fill();

      if (point.activation > 0) {
        point.links.forEach(function (linked) {
          ctx.beginPath();
          ctx.moveTo(point.x, point.y);
          ctx.lineTo(linked.x, linked.y);
          ctx.strokeStyle = "rgba(198, 255, 61, " + (point.activation * 0.22).toFixed(3) + ")";
          ctx.lineWidth = 1;
          ctx.stroke();
        });

        // The "north star" itself — brighter core with a soft glow that
        // scales with activation, so it visibly swells in and fades out
        // rather than snapping on/off.
        ctx.beginPath();
        ctx.arc(point.x, point.y, 1.4 + point.activation * 2.2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(198, 255, 61, " + (point.activation * 0.9).toFixed(3) + ")";
        ctx.shadowColor = "rgba(198, 255, 61, " + (point.activation * 0.8).toFixed(3) + ")";
        ctx.shadowBlur = 10 * point.activation;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    });

    rafId = requestAnimationFrame(tick);
  }

  var scrollFade = null;

  function start() {
    if (running) return;
    running = true;
    resize();
    rafId = requestAnimationFrame(tick);
    window.addEventListener("resize", resize);

    // Reacts to scroll: fades out as the hero scrolls past, rather than
    // just sitting static regardless of where the visitor is on the page.
    // (The gentle drift on the canvas itself is handled for free by the
    // generic initParallax() system, via its data-parallax attribute.)
    if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
      canvas.style.opacity = 1;
      scrollFade = gsap.to(canvas, {
        opacity: 0,
        ease: "none",
        scrollTrigger: {
          trigger: container,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
    }
  }

  function stop() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    window.removeEventListener("resize", resize);
    if (scrollFade) {
      scrollFade.scrollTrigger.kill();
      scrollFade.kill();
      scrollFade = null;
    }
    canvas.style.opacity = "";
    var w = canvas.width / dpr;
    var h = canvas.height / dpr;
    if (w && h) ctx.clearRect(0, 0, w, h);
  }

  function sync() {
    var isDark = document.documentElement.classList.contains("dark");
    if (isDark) {
      start();
    } else {
      stop();
    }
  }

  sync();

  var toggle = document.getElementById("theme-toggle");
  if (toggle) {
    toggle.addEventListener("click", sync);
  }
}

/* --------------------------------------------------------------------------
   Magnetic CTA buttons — the filled accent button (the .cta-button pattern,
   currently just the 404 "back home" action) pulls its label slightly
   toward the cursor within a small radius, then eases back on leave.
   Desktop only, same touch check as the cursor preview above.

   Only the inner [data-magnetic-content] span is moved by JS — the outer
   button's hover/press states are pure CSS (see .cta-button in style.css)
   so this never fights those transforms; it just rides alongside them.
   -------------------------------------------------------------------------- */
function initMagneticButtons() {
  var buttons = document.querySelectorAll("[data-magnetic]");
  if (!buttons.length) return;

  var isTouch = window.matchMedia("(pointer: coarse)").matches;
  if (isTouch) return;

  var STRENGTH = 0.35;
  var MAX_OFFSET = 10;

  buttons.forEach(function (button) {
    var content = button.querySelector("[data-magnetic-content]") || button;
    var targetX = 0;
    var targetY = 0;
    var currentX = 0;
    var currentY = 0;

    function clamp(value) {
      return Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, value));
    }

    button.addEventListener("mousemove", function (e) {
      var rect = button.getBoundingClientRect();
      var relX = e.clientX - (rect.left + rect.width / 2);
      var relY = e.clientY - (rect.top + rect.height / 2);
      targetX = clamp(relX * STRENGTH);
      targetY = clamp(relY * STRENGTH);
    });

    button.addEventListener("mouseleave", function () {
      targetX = 0;
      targetY = 0;
    });

    function animate() {
      currentX += (targetX - currentX) * 0.2;
      currentY += (targetY - currentY) * 0.2;
      content.style.transform = "translate(" + currentX.toFixed(2) + "px," + currentY.toFixed(2) + "px)";
      requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
  });
}
