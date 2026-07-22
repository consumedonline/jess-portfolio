/* ==========================================================================
   Jessica Issa — Portfolio
   Vanilla JS only. No build step, no frameworks.
   Handles: dark/light theme toggle, smooth scroll, scroll-reveal animations,
   scroll parallax, the cursor-following project preview, the skills
   marquee, the mobile navigation drawer, magnetic CTA buttons, the
   homepage hero background, and the scroll-triggered draw-in animations on
   every diagram/chart across the project pages.
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
  initQuadrantChart();
  initDiagramReveal();
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
   Quadrant chart (Digital Platform Review) — a static diagram brought to
   life on scroll. Two pieces, each guarded so this safely no-ops on every
   other page that doesn't have this chart:

   1. Scroll-triggered draw-in: axes stroke themselves in, the dashed grid
      fades up, then each node settles into place (staggered) followed by
      its label — sequenced and unhurried rather than all appearing at once
      or bouncing in. Nodes use a radial-gradient "bead" fill + SVG
      drop-shadow (set inline on the page) so they read as raised/glossy
      without needing any live cursor interaction.
   2. The effort table's rows stagger in on scroll to match.

   An interactive cursor-tilt was tried here and dropped — too playful for
   a case-study context. The hover states in style.css (node scale-up,
   label brighten, row highlight) still provide interactivity; they just
   don't require moving the mouse to discover.

   Both respect prefers-reduced-motion by skipping entirely.
   -------------------------------------------------------------------------- */
function initQuadrantChart() {
  if (typeof gsap === "undefined") return;

  var svg = document.getElementById("quadrant-chart");
  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- 1. Scroll-triggered draw-in ----
  if (svg && !prefersReducedMotion && typeof ScrollTrigger !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);

    var axes = svg.querySelectorAll("[data-quadrant-axis]");
    var grid = svg.querySelectorAll("[data-quadrant-grid]");
    var pointGroups = svg.querySelectorAll("[data-quadrant-point]");
    var nodes = [];
    var labels = [];

    axes.forEach(function (line) {
      var length = line.getTotalLength ? line.getTotalLength() : 500;
      line.style.strokeDasharray = length;
      line.style.strokeDashoffset = length;
    });

    gsap.set(grid, { opacity: 0 });

    pointGroups.forEach(function (group) {
      var node = group.querySelector(".quadrant-node");
      var label = group.querySelector(".quadrant-label");
      if (node) {
        gsap.set(node, { scale: 0 });
        nodes.push(node);
      }
      if (label) {
        gsap.set(label, { opacity: 0, y: 6 });
        labels.push(label);
      }
    });

    var tl = gsap.timeline({
      scrollTrigger: { trigger: svg, start: "top 75%", once: true },
    });

    tl.to(axes, { strokeDashoffset: 0, duration: 1, ease: "power2.out", stagger: 0.15 })
      .to(grid, { opacity: 1, duration: 0.6, ease: "power1.out" }, "-=0.35")
      .to(nodes, { scale: 1, duration: 0.55, ease: "power3.out", stagger: 0.09 }, "-=0.2")
      .to(labels, { opacity: 0.75, y: 0, duration: 0.45, ease: "power1.out", stagger: 0.09 }, "-=0.4");
  }

  // ---- 2. Effort table row stagger-in ----
  var rows = document.querySelectorAll(".effort-table tbody tr");
  if (rows.length && !prefersReducedMotion && typeof ScrollTrigger !== "undefined") {
    gsap.set(rows, { opacity: 0, x: -16 });
    gsap.to(rows, {
      opacity: 1,
      x: 0,
      duration: 0.5,
      ease: "power2.out",
      stagger: 0.08,
      scrollTrigger: { trigger: ".effort-table", start: "top 80%", once: true },
    });
  }
}

/* --------------------------------------------------------------------------
   Static diagram reveal — the same "draws itself in on scroll" idea used
   on the quadrant chart, extended to every other diagram/chart type across
   the project pages: dependency flow maps, before/after ladders, radial
   operating-model diagrams, network diagrams, the emotion curve, floor
   plans, method steppers, horizontal timelines and vertical step lists.

   Deliberately unhurried: durations sit around half a second, staggers are
   gentle, and every ease is a plain power curve — no elastic/back overshoot,
   nothing bouncy. The point is a quiet pulse of life to break up
   text-heavy pages, not a flourish that calls attention to itself. Each
   diagram fires once, the first time it scrolls into view.

   Purely additive and self-contained: every block below only touches
   elements it finds by class name, so this safely no-ops on any page
   (or diagram type) that doesn't have that class. Skips entirely under
   prefers-reduced-motion, same as every other motion feature on the site.
   -------------------------------------------------------------------------- */
function initDiagramReveal() {
  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  gsap.registerPlugin(ScrollTrigger);

  var EASE = "power2.out";
  var POP = "power3.out";

  function drawLine(el) {
    if (!el || !el.getTotalLength) return;
    var length = el.getTotalLength();
    el.style.strokeDasharray = length;
    el.style.strokeDashoffset = length;
  }

  // ---- Dependency flow maps: tier by tier, connector by connector ----
  document.querySelectorAll(".flow-map").forEach(function (map) {
    var children = Array.prototype.slice.call(map.children);
    if (!children.length) return;

    var tl = gsap.timeline({ scrollTrigger: { trigger: map, start: "top 78%", once: true } });

    children.forEach(function (child, i) {
      if (child.classList.contains("flow-connector")) {
        gsap.set(child, { scaleY: 0, transformOrigin: "top center" });
        tl.to(child, { scaleY: 1, duration: 0.35, ease: EASE }, i === 0 ? 0 : "-=0.05");
      } else {
        var spans = child.querySelectorAll("span");
        if (!spans.length) return;
        gsap.set(spans, { opacity: 0, y: 10 });
        tl.to(spans, { opacity: 1, y: 0, duration: 0.5, ease: EASE, stagger: 0.08 }, i === 0 ? 0 : "-=0.1");
      }
    });
  });

  // ---- Before/after workflow ladders ----
  document.querySelectorAll(".ladder").forEach(function (ladder) {
    var items = ladder.querySelectorAll("li");
    if (!items.length) return;
    var fromSide = ladder.classList.contains("ladder-after") ? 14 : -14;
    gsap.set(items, { opacity: 0, x: fromSide });
    gsap.to(items, {
      opacity: 1,
      x: 0,
      duration: 0.5,
      ease: EASE,
      stagger: 0.08,
      scrollTrigger: { trigger: ladder, start: "top 82%", once: true },
    });
  });

  // ---- Radial operating-model / stakeholder-map diagrams ----
  document.querySelectorAll(".radial-diagram").forEach(function (svg) {
    var rings = svg.querySelectorAll(".radial-ring");
    var spokes = svg.querySelectorAll(".radial-spoke");
    var center = svg.querySelectorAll(".radial-center, .radial-center-text");
    var nodes = svg.querySelectorAll(".radial-node");
    var labels = svg.querySelectorAll(".radial-label");
    if (!nodes.length) return;

    spokes.forEach(drawLine);
    gsap.set(rings, { opacity: 0 });
    gsap.set(center, { opacity: 0, scale: 0.85, transformOrigin: "center" });
    gsap.set(nodes, { scale: 0, transformOrigin: "center" });
    gsap.set(labels, { opacity: 0 });

    var tl = gsap.timeline({ scrollTrigger: { trigger: svg, start: "top 75%", once: true } });
    tl.to(rings, { opacity: 1, duration: 0.6, ease: EASE })
      .to(center, { opacity: 1, scale: 1, duration: 0.5, ease: EASE }, "-=0.3")
      .to(spokes, { strokeDashoffset: 0, duration: 0.6, ease: EASE, stagger: 0.06 }, "-=0.2")
      .to(nodes, { scale: 1, duration: 0.4, ease: POP, stagger: 0.07 }, "-=0.3")
      .to(labels, { opacity: 0.62, duration: 0.4, ease: EASE, stagger: 0.07 }, "-=0.35");
  });

  // ---- Network diagrams (Predictive Engine / Decision Layer style) ----
  document.querySelectorAll(".network-diagram").forEach(function (svg) {
    var edges = svg.querySelectorAll(".network-edge");
    var nodes = svg.querySelectorAll(".network-node");
    var root = svg.querySelectorAll(".network-node-root");
    if (!nodes.length && !root.length) return;

    edges.forEach(drawLine);
    gsap.set(root, { scale: 0, transformOrigin: "center" });
    gsap.set(nodes, { scale: 0, transformOrigin: "center" });

    var tl = gsap.timeline({ scrollTrigger: { trigger: svg, start: "top 80%", once: true } });
    tl.to(root, { scale: 1, duration: 0.4, ease: POP })
      .to(edges, { strokeDashoffset: 0, duration: 0.5, ease: EASE, stagger: 0.03 }, "-=0.1")
      .to(nodes, { scale: 1, duration: 0.35, ease: POP, stagger: 0.025 }, "-=0.3");
  });

  // ---- Emotion curve chart ----
  document.querySelectorAll(".emotion-chart").forEach(function (svg) {
    var line = svg.querySelector(".emotion-line");
    var dots = svg.querySelectorAll(".emotion-dot");
    var labels = svg.querySelectorAll(".emotion-label");
    if (!line) return;

    drawLine(line);
    gsap.set(dots, { scale: 0, transformOrigin: "center" });
    gsap.set(labels, { opacity: 0, y: 6 });

    var tl = gsap.timeline({ scrollTrigger: { trigger: svg, start: "top 78%", once: true } });
    tl.to(line, { strokeDashoffset: 0, duration: 1, ease: EASE })
      .to(dots, { scale: 1, duration: 0.35, ease: POP, stagger: 0.12 }, "-=0.7")
      .to(labels, { opacity: 0.55, y: 0, duration: 0.35, ease: EASE, stagger: 0.12 }, "-=0.6");
  });

  // ---- Floor plan / spatial zoning diagrams ----
  document.querySelectorAll(".floor-plan").forEach(function (plan) {
    var zones = plan.querySelectorAll(".floor-zone");
    if (!zones.length) return;
    gsap.set(zones, { opacity: 0, scaleX: 0, transformOrigin: "left center" });
    gsap.to(zones, {
      opacity: 1,
      scaleX: 1,
      duration: 0.6,
      ease: EASE,
      stagger: 0.1,
      scrollTrigger: { trigger: plan, start: "top 82%", once: true },
    });
  });

  // ---- Method steppers ----
  document.querySelectorAll(".stepper").forEach(function (stepper) {
    var items = stepper.querySelectorAll(".stepper-item");
    if (!items.length) return;
    gsap.set(items, { opacity: 0, y: 14 });
    gsap.to(items, {
      opacity: 1,
      y: 0,
      duration: 0.5,
      ease: EASE,
      stagger: 0.08,
      scrollTrigger: { trigger: stepper, start: "top 80%", once: true },
    });
  });

  // ---- Horizontal chronological timelines ----
  document.querySelectorAll(".timeline").forEach(function (timeline) {
    var track = timeline.querySelector(".timeline-track");
    var points = timeline.querySelectorAll(".timeline-point");
    if (!points.length) return;
    if (track) gsap.set(track, { scaleX: 0, transformOrigin: "left center" });
    gsap.set(points, { opacity: 0, y: 12 });

    var tl = gsap.timeline({ scrollTrigger: { trigger: timeline, start: "top 80%", once: true } });
    if (track) tl.to(track, { scaleX: 1, duration: 0.7, ease: EASE });
    tl.to(points, { opacity: 1, y: 0, duration: 0.5, ease: EASE, stagger: 0.08 }, track ? "-=0.4" : 0);
  });

  // ---- Vertical numbered step lists ----
  document.querySelectorAll(".vertical-steps").forEach(function (list) {
    var steps = list.querySelectorAll(".vertical-step");
    if (!steps.length) return;
    gsap.set(steps, { opacity: 0, x: -12 });
    gsap.to(steps, {
      opacity: 1,
      x: 0,
      duration: 0.5,
      ease: EASE,
      stagger: 0.1,
      scrollTrigger: { trigger: list, start: "top 80%", once: true },
    });
  });
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
