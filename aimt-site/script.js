"use strict";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* Loader */
window.addEventListener("load", () => {
  const loader = $("#loader");
  if (!loader) return;
  setTimeout(() => loader.classList.add("is-hidden"), 350);
});

/* Sticky offset helper: header height (includes nav + announce) */
function getStickyOffset() {
  const header = $("#header");
  return header?.offsetHeight || 0;
}

/* Header scroll style */
const header = $("#header");
window.addEventListener("scroll", () => {
  header.classList.toggle("is-scrolled", window.scrollY > 8);
}, { passive: true });

/* Mobile nav toggle */
const navToggle = $("#navToggle");
const navMenu = $("#navMenu");

function closeMenu() {
  navMenu.classList.remove("is-open");
  navToggle?.setAttribute("aria-expanded", "false");
}
function openMenu() {
  navMenu.classList.add("is-open");
  navToggle?.setAttribute("aria-expanded", "true");
}

navToggle?.addEventListener("click", () => {
  navMenu.classList.contains("is-open") ? closeMenu() : openMenu();
});

/* Close mobile menu on anchor click */
$$(".nav__link[href^='#']").forEach(a => {
  a.addEventListener("click", () => {
    if (window.innerWidth <= 720) closeMenu();
  });
});

/* Close mobile menu on outside click */
document.addEventListener("click", (e) => {
  if (window.innerWidth > 720) return;
  if (!navMenu.classList.contains("is-open")) return;
  const clickedInside = navMenu.contains(e.target) || navToggle.contains(e.target);
  if (!clickedInside) closeMenu();
});

/* Smooth scroll with header offset */
function scrollToHash(hash) {
  const target = document.querySelector(hash);
  if (!target) return;
  const top = target.getBoundingClientRect().top + window.scrollY - (getStickyOffset() - 10);
  window.scrollTo({ top, behavior: "smooth" });
}

document.addEventListener("click", (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const href = a.getAttribute("href");
  if (!href || href === "#") return;
  const target = document.querySelector(href);
  if (!target) return;
  e.preventDefault();
  scrollToHash(href);
  history.pushState(null, "", href);
});

/* Dropdown toggle on mobile */
const ddButtons = $$(".nav__link--dd");
ddButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const item = btn.closest(".nav__item--dd");
    const isOpen = item.classList.toggle("is-open");
    btn.setAttribute("aria-expanded", String(isOpen));

    if (window.innerWidth <= 720) {
      $$(".nav__item--dd").forEach(other => {
        if (other !== item) {
          other.classList.remove("is-open");
          other.querySelector(".nav__link--dd")?.setAttribute("aria-expanded", "false");
        }
      });
    }
  });
});

/* Scroll reveal */
const revealEls = $$(".reveal");
const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add("in-view");
  });
}, { threshold: 0.12 });
revealEls.forEach(el => io.observe(el));

/* Counters */
const counterEls = $$("[data-counter]");
let countersStarted = false;

function animateCounter(el, to) {
  const duration = 1200;
  const start = performance.now();
  const from = 0;

  function tick(now) {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = String(Math.round(from + (to - from) * eased));
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

const counterObs = new IntersectionObserver((entries) => {
  if (countersStarted) return;
  if (!entries.some(e => e.isIntersecting)) return;
  countersStarted = true;
  counterEls.forEach(el => animateCounter(el, Number(el.getAttribute("data-counter") || "0")));
}, { threshold: 0.25 });

const home = $("#home");
if (home) counterObs.observe(home);

/* Course search + filter */
const courseSearch = $("#courseSearch");
const courseFilter = $("#courseFilter");
const courseCount = $("#courseCount");
const noCoursesNote = $("#noCoursesNote");
const courses = $$(".course");

function normalize(s) { return (s || "").toLowerCase().trim(); }

function applyCourseFilters() {
  const q = normalize(courseSearch?.value);
  const f = courseFilter?.value || "all";
  let visible = 0;

  courses.forEach(card => {
    const dept = card.getAttribute("data-dept");
    const title = normalize(card.getAttribute("data-title") || card.textContent);
    const matchDept = (f === "all") || (dept === f);
    const matchQuery = !q || title.includes(q);
    const show = matchDept && matchQuery;

    card.hidden = !show;
    if (show) visible++;
  });

  if (courseCount) courseCount.textContent = String(visible);
  if (noCoursesNote) noCoursesNote.hidden = visible !== 0;
}

if (courses.length) {
  applyCourseFilters();
  courseSearch?.addEventListener("input", applyCourseFilters);
  courseFilter?.addEventListener("change", applyCourseFilters);
}

/* Navbar search -> academics */
const navCourseSearch = $("#navCourseSearch");
const navSearchBtn = $("#navSearchBtn");

function navSearchToAcademics() {
  const q = navCourseSearch?.value || "";
  scrollToHash("#academics");
  setTimeout(() => {
    if (courseSearch) {
      courseSearch.value = q;
      courseSearch.focus();
      applyCourseFilters();
    }
  }, 350);
}

navSearchBtn?.addEventListener("click", navSearchToAcademics);
navCourseSearch?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    navSearchToAcademics();
    if (window.innerWidth <= 720) closeMenu();
  }
});

/* Back to top */
const backTop = $("#backTop");
window.addEventListener("scroll", () => {
  backTop?.classList.toggle("is-visible", window.scrollY > 700);
}, { passive: true });
backTop?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

/* Active nav link highlight */
const navLinks = $$(".nav__link[href^='#']");
const sectionIds = ["#home","#about","#academics","#admissions","#placements","#life","#policies","#contact"];

function updateActiveLink() {
  const y = window.scrollY + getStickyOffset() + 20;
  let active = "#home";
  for (const id of sectionIds) {
    const el = document.querySelector(id);
    if (!el) continue;
    if (y >= el.offsetTop) active = id;
  }
  navLinks.forEach(a => a.classList.toggle("is-active", a.getAttribute("href") === active));
}
window.addEventListener("scroll", updateActiveLink, { passive: true });
updateActiveLink();

/* Contact form validation */
const contactForm = $("#contactForm");
const formStatus = $("#formStatus");

function setErr(id, msg) {
  const el = document.getElementById(id);
  if (el) el.textContent = msg || "";
}
function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}
function validPhone(phone) {
  if (!phone) return true;
  return /^[0-9+\-\s()]{7,}$/.test(phone.trim());
}

contactForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  if (formStatus) formStatus.textContent = "";

  const name = $("#name")?.value.trim() || "";
  const email = $("#email")?.value.trim() || "";
  const phone = $("#phone")?.value.trim() || "";
  const message = $("#message")?.value.trim() || "";

  let ok = true;
  setErr("errName",""); setErr("errEmail",""); setErr("errPhone",""); setErr("errMessage","");

  if (name.length < 2) { setErr("errName","Please enter your full name."); ok = false; }
  if (!validEmail(email)) { setErr("errEmail","Please enter a valid email address."); ok = false; }
  if (!validPhone(phone)) { setErr("errPhone","Please enter a valid phone number (or leave blank)."); ok = false; }
  if (message.length < 10) { setErr("errMessage","Message should be at least 10 characters."); ok = false; }

  if (!ok) { if (formStatus) formStatus.textContent = "Please fix the highlighted fields."; return; }

  if (formStatus) formStatus.textContent = "Thanks! Your message has been submitted (demo).";
  contactForm.reset();
});

/* Enquiry modal */
const modal = $("#enquiryModal");
const floatEnquire = $("#floatEnquire");
const closeModalBtn = $("#closeEnquiryModal");

function openModal() {
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden","false");
  document.body.style.overflow = "hidden";
  setTimeout(() => $("#eName")?.focus(), 40);
}
function closeModal() {
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden","true");
  document.body.style.overflow = "";
}

["openEnquiryModal","openEnquiryModal2","openEnquiryModal3"].forEach(id => {
  document.getElementById(id)?.addEventListener("click", openModal);
});
floatEnquire?.addEventListener("click", openModal);
closeModalBtn?.addEventListener("click", closeModal);

modal?.addEventListener("click", (e) => {
  if (e.target?.getAttribute?.("data-close") === "true") closeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal?.classList.contains("is-open")) closeModal();
});

/* Enquiry form */
const enquiryForm = $("#enquiryForm");
const enquiryStatus = $("#enquiryStatus");
function setE(id, msg){ const el = document.getElementById(id); if (el) el.textContent = msg || ""; }

enquiryForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  if (enquiryStatus) enquiryStatus.textContent = "";

  const n = $("#eName")?.value.trim() || "";
  const p = $("#ePhone")?.value.trim() || "";
  const pr = $("#eProgram")?.value.trim() || "";

  setE("errEName",""); setE("errEPhone",""); setE("errEProgram","");

  let ok = true;
  if (n.length < 2) { setE("errEName","Please enter your name."); ok = false; }
  if (!validPhone(p)) { setE("errEPhone","Please enter a valid phone number."); ok = false; }
  if (pr.length < 2) { setE("errEProgram","Please enter a program name."); ok = false; }

  if (!ok) { if (enquiryStatus) enquiryStatus.textContent = "Please check the details."; return; }

  if (enquiryStatus) enquiryStatus.textContent = "Submitted! Our team will contact you soon (demo).";
  enquiryForm.reset();
  setTimeout(closeModal, 850);
});

/* Register Now -> open modal */
$("#registerNow")?.addEventListener("click", openModal);

/* Academic calendar demo download */
$$("[data-download]").forEach(btn => {
  btn.addEventListener("click", () => {
    const title = btn.getAttribute("data-download") || "Academic Calendar";
    const text = `${title}\n\n(Generated demo file)\nAIMT — Ambalika Institute of Management & Technology`;
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/[^\w\s()-]/g,"").replace(/\s+/g," ").trim()}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });
});