/* ==========================================================================
   Jessica Issa — Portfolio
   Vanilla JS only. No build step, no frameworks.
   Handles: preloader, dark/light theme toggle, scroll-reveal animations,
   the cursor-following project preview, the skills marquee, and the
   mobile navigation drawer.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", function () {
  initPreloader();
  initTheme();
  initRevealOnScroll();
  initCursorPreview();
  initMarquee();
  initMobileMenu();
  initFooterYear();
  initMagneticButtons();
});

/* --------------------------------------------------------------------------
   Preloader — counts from 0 to 100 to set an intentional, editorial tone
   on load, then fades out and unlocks scrolling.
   -------------------------------------------------------------------------- */
function initPreloader() {
  var preloader = document.getElementById("preloader");
  var counter = document.getElementById("preloader-count");
  if (!preloader || !counter) return;

  document.documentElement.style.overflow = "hidden";

  var current = 0;
  var target = 100;
  var duration = 1100;
  var startTime = null;

  function tick(timestamp) {
    if (startTime === null) startTime = timestamp;
    var elapsed = timestamp - startTime;
    var progress = Math.min(elapsed / duration, 1);
    current = Math.floor(progress * target);
    counter.textContent = current + "%";

    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      counter.textContent = "100%";
      setTimeout(function () {
        preloader.classList.add("is-hidden");
        document.documentElement.style.overflow = "";
      }, 250);
    }
  }

  requestAnimationFrame(tick);
}

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
