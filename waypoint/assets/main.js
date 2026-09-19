/* Waypoint — product site interactions. No dependencies. */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var clamp = function (n, a, b) { return Math.min(b, Math.max(a, n)); };

  /* ---- Nav ---- */
  var navShell = document.querySelector(".nav-shell");
  var menuBtn = document.querySelector(".menu-btn");
  var menu = document.getElementById("mobile-menu");
  function setMenu(open) {
    if (!menuBtn || !menu) return;
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    menu.classList.toggle("open", open);
  }
  if (menuBtn && menu) {
    menuBtn.addEventListener("click", function () { setMenu(menuBtn.getAttribute("aria-expanded") !== "true"); });
    menu.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });
  }

  /* ---- Reveal on scroll ---- */
  var revealEls = document.querySelectorAll(".reveal, [data-observe]");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---- Reduced motion: stop the travelling dot ---- */
  if (reduce) {
    document.querySelectorAll("svg.route").forEach(function (svg) {
      if (svg.pauseAnimations) svg.pauseAnimations();
    });
  }

  /* ---- Cursor spotlight ---- */
  document.querySelectorAll(".spot").forEach(function (card) {
    card.addEventListener("pointermove", function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty("--mx", e.clientX - r.left + "px");
      card.style.setProperty("--my", e.clientY - r.top + "px");
    });
  });

  /* ---- Statement: words light up on scroll ---- */
  var thesis = document.querySelector("[data-words]");
  var words = [];
  if (thesis && !reduce) {
    (function wrap(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var s = document.createElement("span");
            s.className = "w"; s.textContent = part; words.push(s); frag.appendChild(s);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1) { wrap(child); }
      });
    })(thesis);
  }
  function updateThesis() {
    if (!words.length) return;
    var r = thesis.getBoundingClientRect(), vh = window.innerHeight;
    var p = clamp((vh * 0.82 - r.top) / (r.height + vh * 0.28), 0, 1);
    var n = words.length, span = 5;
    for (var i = 0; i < n; i++) {
      words[i].style.opacity = (0.16 + 0.84 * clamp((p * (n + span) - i) / span, 0, 1)).toFixed(3);
    }
  }

  /* ---- Hero window settles flat ---- */
  var win = document.querySelector(".window");
  function updateWindow() {
    if (!win || reduce) return;
    var r = win.getBoundingClientRect(), vh = window.innerHeight;
    win.style.setProperty("--p", clamp(1 - (r.top - vh * 0.18) / (vh * 0.75), 0, 1).toFixed(3));
  }

  /* ---- Journey: active step follows the viewport ---- */
  var steps = Array.prototype.slice.call(document.querySelectorAll(".step"));
  var dots = Array.prototype.slice.call(document.querySelectorAll(".dots li"));
  function updateSteps() {
    if (!steps.length) return;
    var mid = window.innerHeight * 0.5, best = 0, bestD = Infinity;
    steps.forEach(function (el, i) {
      var r = el.getBoundingClientRect();
      var d = Math.abs((r.top + r.height / 2) - mid);
      if (d < bestD) { bestD = d; best = i; }
    });
    steps.forEach(function (el, i) { el.classList.toggle("on", i === best); });
    dots.forEach(function (el, i) { el.classList.toggle("on", i === best); });
  }

  function onScroll() {
    if (navShell) navShell.classList.toggle("scrolled", window.scrollY > 24);
    updateThesis(); updateWindow(); updateSteps();
  }
  var ticking = false;
  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { onScroll(); ticking = false; });
  }, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  /* ---- Signup forms: submit in place, fall back to a normal POST ---- */
  document.querySelectorAll("form[data-ajax]").forEach(function (form) {
    if (!(window.fetch && window.FormData)) return;
    var btn = form.querySelector("button[type=submit]");
    var status = form.parentNode.querySelector(".form-status") || form.querySelector(".form-status");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var label = btn.textContent;
      btn.disabled = true; btn.textContent = "Joining…";
      status.className = status.className.replace(/\b(ok|err)\b/g, "").trim();
      status.textContent = "";
      fetch(form.action, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } })
        .then(function (res) {
          if (!res.ok) throw new Error("bad response");
          form.reset();
          status.className += " ok";
          status.textContent = "You're on the list. We'll email you when early access opens.";
        })
        .catch(function () {
          status.className += " err";
          status.textContent = "Something went wrong. Please try again, or email support@cyvara.co.";
        })
        .then(function () { btn.disabled = false; btn.textContent = label; });
    });
  });
  /* ---- Pricing: monthly / yearly toggle ---- */
  document.querySelectorAll(".plan[data-billing]").forEach(function (plan) {
    plan.querySelectorAll("[data-billing-set]").forEach(function (b) {
      b.addEventListener("click", function () {
        plan.setAttribute("data-billing", b.getAttribute("data-billing-set"));
        plan.querySelectorAll("[data-billing-set]").forEach(function (o) {
          var on = o === b;
          o.classList.toggle("on", on);
          o.setAttribute("aria-pressed", String(on));
        });
      });
    });
  });
})();
