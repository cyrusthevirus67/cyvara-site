/* Cyvara — flagship site interactions. No dependencies. */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var clamp = function (n, a, b) { return Math.min(b, Math.max(a, n)); };

  /* ---- Nav: condense on scroll ---- */
  var navShell = document.querySelector(".nav-shell");
  function onScrollNav() {
    if (navShell) navShell.classList.toggle("scrolled", window.scrollY > 24);
  }

  /* ---- Mobile menu ---- */
  var menuBtn = document.querySelector(".menu-btn");
  var menu = document.getElementById("mobile-menu");
  function setMenu(open) {
    if (!menuBtn || !menu) return;
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    menu.classList.toggle("open", open);
  }
  if (menuBtn && menu) {
    menuBtn.addEventListener("click", function () {
      setMenu(menuBtn.getAttribute("aria-expanded") !== "true");
    });
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) setMenu(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setMenu(false);
    });
  }

  /* ---- Reveal on scroll ---- */
  var revealEls = document.querySelectorAll(".reveal, [data-observe]");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---- Cursor spotlight on cards ---- */
  document.querySelectorAll(".spot").forEach(function (card) {
    card.addEventListener("pointermove", function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty("--mx", e.clientX - r.left + "px");
      card.style.setProperty("--my", e.clientY - r.top + "px");
    });
  });

  /* ---- Thesis: words light up as you scroll ---- */
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
            s.className = "w";
            s.textContent = part;
            words.push(s);
            frag.appendChild(s);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1) {
          wrap(child);
        }
      });
    })(thesis);
  }
  function updateThesis() {
    if (!words.length) return;
    var r = thesis.getBoundingClientRect();
    var vh = window.innerHeight;
    var p = clamp((vh * 0.82 - r.top) / (r.height + vh * 0.28), 0, 1);
    var n = words.length, span = 5;
    for (var i = 0; i < n; i++) {
      var a = clamp((p * (n + span) - i) / span, 0, 1);
      words[i].style.opacity = (0.16 + 0.84 * a).toFixed(3);
    }
  }

  /* ---- Hero window: settles flat as it scrolls into view ---- */
  var win = document.querySelector(".window");
  function updateWindow() {
    if (!win || reduce) return;
    var r = win.getBoundingClientRect();
    var vh = window.innerHeight;
    var p = clamp(1 - (r.top - vh * 0.18) / (vh * 0.75), 0, 1);
    win.style.setProperty("--p", p.toFixed(3));
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      onScrollNav(); updateThesis(); updateWindow();
      ticking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScrollNav(); updateThesis(); updateWindow();

  /* ---- Contact form: submit in place, fall back to a normal POST ---- */
  var form = document.querySelector("form[data-ajax]");
  if (form && window.fetch && window.FormData) {
    var btn = form.querySelector("button[type=submit]");
    var status = form.querySelector(".form-status");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var label = btn.textContent;
      btn.disabled = true;
      btn.textContent = "Sending…";
      status.className = "form-status";
      status.textContent = "";
      fetch(form.action, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } })
        .then(function (res) {
          if (!res.ok) throw new Error("bad response");
          form.reset();
          status.className = "form-status ok";
          status.textContent = "Thanks — your message is in. We'll reply soon.";
        })
        .catch(function () {
          status.className = "form-status err";
          status.textContent = "Something went wrong. Please try again, or email support@cyvara.co.";
        })
        .then(function () {
          btn.disabled = false;
          btn.textContent = label;
        });
    });
  }
})();
