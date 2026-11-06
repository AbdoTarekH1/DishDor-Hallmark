(function () {
  "use strict";

  document.documentElement.classList.add("js");

  /* ---- masthead drawer ---- */
  var header = document.getElementById("siteHeader");
  var toggle = document.getElementById("navToggle");
  var panel = document.getElementById("navPanel");

  function closeMenu(returnFocus) {
    if (!header || !toggle) return;
    header.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "فتح القائمة");
    if (returnFocus) toggle.focus();
  }

  if (header && toggle && panel) {
    toggle.addEventListener("click", function () {
      var open = header.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "إغلاق القائمة" : "فتح القائمة");
    });

    panel.addEventListener("click", function (event) {
      if (event.target.closest("a")) closeMenu(false);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && header.classList.contains("is-open")) closeMenu(true);
    });

    document.addEventListener("click", function (event) {
      if (!header.classList.contains("is-open")) return;
      if (!header.contains(event.target)) closeMenu(false);
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 1024) closeMenu(false);
    });
  }

  /* ---- reveal ---- */
  var revealables = document.querySelectorAll(".reveal");
  if (revealables.length) {
    if ("IntersectionObserver" in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        });
      }, { rootMargin: "0px 0px -10% 0px", threshold: 0.1 });
      revealables.forEach(function (el) { observer.observe(el); });
    } else {
      revealables.forEach(function (el) { el.classList.add("is-in"); });
    }
  }

  /* ---- menu viewer ---- */
  var menuDialog = document.getElementById("menuDialog");
  var menuTriggers = document.querySelectorAll("[data-menu-open]");

  if (menuDialog && typeof menuDialog.showModal === "function") {
    menuTriggers.forEach(function (trigger) {
      trigger.addEventListener("click", function (event) {
        event.preventDefault();
        menuDialog.showModal();
      });
    });

    var menuClose = menuDialog.querySelector("[data-menu-close]");
    if (menuClose) menuClose.addEventListener("click", function () { menuDialog.close(); });

    menuDialog.addEventListener("click", function (event) {
      if (event.target === menuDialog) menuDialog.close();
    });
  }

  /* ---- gallery lightbox ---- */
  var lightbox = document.getElementById("lightbox");
  var lightboxImage = document.getElementById("lightboxImage");
  var lightboxCount = document.getElementById("lightboxCount");
  var slides = Array.prototype.slice.call(document.querySelectorAll("[data-lightbox]"));
  var current = 0;
  var lastTrigger = null;

  function showSlide(index) {
    if (!slides.length || !lightboxImage) return;
    current = (index + slides.length) % slides.length;
    var trigger = slides[current];
    var thumb = trigger.querySelector("img");
    lightboxImage.src = trigger.getAttribute("href");
    lightboxImage.alt = thumb ? thumb.alt : "";
    if (lightboxCount) lightboxCount.textContent = (current + 1) + " من " + slides.length;
  }

  if (lightbox && lightboxImage && typeof lightbox.showModal === "function") {
    slides.forEach(function (trigger, index) {
      trigger.addEventListener("click", function (event) {
        event.preventDefault();
        lastTrigger = trigger;
        showSlide(index);
        lightbox.showModal();
      });
    });

    var prev = lightbox.querySelector("[data-lightbox-prev]");
    var next = lightbox.querySelector("[data-lightbox-next]");
    var close = lightbox.querySelector("[data-lightbox-close]");

    if (prev) prev.addEventListener("click", function () { showSlide(current - 1); });
    if (next) next.addEventListener("click", function () { showSlide(current + 1); });
    if (close) close.addEventListener("click", function () { lightbox.close(); });

    lightbox.addEventListener("keydown", function (event) {
      if (event.key === "ArrowLeft") { event.preventDefault(); showSlide(current - 1); }
      if (event.key === "ArrowRight") { event.preventDefault(); showSlide(current + 1); }
    });

    lightbox.addEventListener("click", function (event) {
      if (event.target === lightbox) lightbox.close();
    });

    lightbox.addEventListener("close", function () {
      lightboxImage.src = "";
      if (lastTrigger) lastTrigger.focus();
    });
  }

  /* ---- active section in the masthead ---- */
  var navLinks = document.querySelectorAll(".masthead-nav a[href^='#']");
  if (navLinks.length && "IntersectionObserver" in window) {
    var sections = {};
    navLinks.forEach(function (link) {
      var id = link.getAttribute("href").slice(1);
      var section = document.getElementById(id);
      if (section) sections[id] = link;
    });

    var navObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (link) { link.removeAttribute("aria-current"); });
        if (sections[entry.target.id]) sections[entry.target.id].setAttribute("aria-current", "true");
      });
    }, { rootMargin: "-45% 0px -50% 0px" });

    Object.keys(sections).forEach(function (id) {
      navObserver.observe(document.getElementById(id));
    });
  }

  /* ---- year ---- */
  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
