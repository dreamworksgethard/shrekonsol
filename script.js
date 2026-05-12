const CONFIG = {
  name: "Shrek Symbol",
  symbol: "$SHREK",
  chain: "SOL",
  /** Paste your Solana mint here (base58). */
  contractAddress: "6Jtiy6qHWRr41YoyDQUtZhtNahv99Xd1qrC3Re7Epump",
  supply: "1.000.000.000",
  buyTax: "0%",
  sellTax: "0%",
  lpBadge: "Burned",
  ownershipBadge: "Renounced",
  network: "Solana",
  links: {
    /** Pump.fun — set to your coin page when live, e.g. https://pump.fun/coin/<mint> */
    dex: "https://pump.fun/coin/6Jtiy6qHWRr41YoyDQUtZhtNahv99Xd1qrC3Re7Epump",
    /** DexScreener pair or token URL — replace with your pair when live. */
    chart: "https://dexscreener.com/solana/6Jtiy6qHWRr41YoyDQUtZhtNahv99Xd1qrC3Re7Epump",
    explorer: "https://solscan.io/",
    x: "https://x.com/ShrekOfSol",
    tg: "https://t.me/shreksol",
  },
};

const $ = (sel, root = document) => root.querySelector(sel);

/** Updated in initScrollFx; used by scroll reveals */
const scrollState = { y: 0, dirDown: true };

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
function setHref(id, value) {
  const el = document.getElementById(id);
  if (el && value) el.href = value;
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {}
  }
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.cssText = "position:fixed;left:-9999px;opacity:0";
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try { ok = document.execCommand("copy"); } catch {}
  document.body.removeChild(ta);
  return ok;
}

/* Toast */
let toastTimer = null;
function toast(msg) {
  const el = $("#toast");
  const text = $("#toast-text");
  if (!el || !text) return;
  text.textContent = msg;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 1700);
}

/* Contract display + copy */
function formatAddress(addr) {
  if (!addr || addr.length < 12) return addr;
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

function initCopyButton() {
  const caEl = $("#ca");
  const buttons = document.querySelectorAll("[data-copy-mint]");
  if (!buttons.length) return;

  const addr = CONFIG.contractAddress;
  const isMobile = () => window.matchMedia("(max-width: 560px)").matches;
  const applyLabel = () => {
    if (caEl) caEl.textContent = isMobile() ? formatAddress(addr) : addr;
  };
  applyLabel();
  window.addEventListener("resize", applyLabel, { passive: true });

  const flashCopied = (btn) => {
    btn.classList.add("is-copied");
    const label = btn.querySelector("span");
    const prev = label?.textContent;
    if (label) label.textContent = "Copied";
    setTimeout(() => {
      btn.classList.remove("is-copied");
      if (label && prev != null) label.textContent = prev;
    }, 1500);
  };

  buttons.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const ok = await copyText(addr);
      toast(ok ? "Mint address copied" : "Copy failed");
      if (ok) flashCopied(btn);
    });
  });
}

/* Mobile drawer */
function initBurger() {
  const burger = $("#burger");
  const mobile = $("#mobile");
  const scrim = $("#mobile-scrim");
  if (!burger || !mobile || !scrim) return;

  const setOpen = (open) => {
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    mobile.setAttribute("aria-hidden", open ? "false" : "true");
    scrim.classList.toggle("is-visible", open);
    document.body.style.overflow = open ? "hidden" : "";
  };

  burger.addEventListener("click", () => {
    const open = burger.getAttribute("aria-expanded") !== "true";
    setOpen(open);
  });

  mobile.addEventListener("click", (e) => {
    if (e.target.closest("a[href^='#']")) setOpen(false);
  });

  scrim.addEventListener("click", () => setOpen(false));

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
  });

  const mq = window.matchMedia("(min-width: 961px)");
  mq.addEventListener?.("change", (e) => { if (e.matches) setOpen(false); });
}

/* Smooth scroll for in-page anchors (accounts for sticky header) */
function initSmoothScroll() {
  document.body.addEventListener("click", (e) => {
    const a = e.target.closest?.("a[href^='#']");
    if (!a) return;
    const href = a.getAttribute("href");
    if (!href || href === "#") return;
    const target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    const headerH = document.querySelector(".topbar")?.offsetHeight || 0;
    const top = target.getBoundingClientRect().top + window.scrollY - headerH + 1;
    window.scrollTo({ top, behavior: "smooth" });
    history.replaceState(null, "", href);
  });
}

function initScrollFx() {
  const bar = $("#scrollbar");
  const topbar = $("#topbar");
  let ticking = false;
  scrollState.y = window.scrollY;

  const update = () => {
    ticking = false;
    const y = window.scrollY;
    if (Math.abs(y - scrollState.y) > 3) scrollState.dirDown = y >= scrollState.y;
    scrollState.y = y;
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const p = Math.min(1, Math.max(0, window.scrollY / max));
    if (bar) bar.style.width = `${p * 100}%`;
    if (topbar) topbar.classList.toggle("is-scrolled", window.scrollY > 12);
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  update();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", update, { passive: true });
}

/* Reveal on scroll (direction-aware: down vs up) */
function initReveal() {
  const els = document.querySelectorAll("[data-reveal]");
  if (!els.length) return;
  if (!("IntersectionObserver" in window)) {
    els.forEach((el) => el.classList.add("is-in"));
    return;
  }
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
    els.forEach((el) => {
      el.classList.add("is-in");
      el.removeAttribute("data-reveal-from");
    });
    return;
  }

  const applyExit = (el, entry) => {
    const rect = entry.boundingClientRect;
    if (rect.bottom <= 0) el.dataset.revealFrom = "up";
    else if (rect.top >= window.innerHeight) el.dataset.revealFrom = "down";
    el.classList.remove("is-in");
  };

  const applyEnter = (el) => {
    if (!el.dataset.revealFrom) el.dataset.revealFrom = scrollState.dirDown ? "down" : "up";
    el.classList.add("is-in");
  };

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const el = entry.target;
        if (entry.isIntersecting) applyEnter(el);
        else applyExit(el, entry);
      }
    },
    { threshold: 0.08, rootMargin: "0px 0px -5% 0px" }
  );
  els.forEach((el) => io.observe(el));
}

/* Subtle star canvas */
function initStars() {
  const canvas = $("#stars");
  if (!(canvas instanceof HTMLCanvasElement)) return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let w = 0, h = 0, dpr = 1, raf = 0;
  const isMobile = () => window.matchMedia("(max-width: 560px)").matches;
  const stars = [];

  const seed = () => {
    const count = isMobile() ? 55 : 90;
    stars.length = 0;
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.2 + 0.2,
        vy: Math.random() * 0.25 + 0.05,
        a: Math.random() * 0.5 + 0.2,
        tw: Math.random() * Math.PI * 2,
      });
    }
  };

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
  };

  const draw = () => {
    ctx.clearRect(0, 0, w, h);
    for (const s of stars) {
      s.y += s.vy;
      s.tw += 0.02;
      if (s.y > h + 4) {
        s.y = -4;
        s.x = Math.random() * w;
      }
      const alpha = s.a * (0.6 + 0.4 * Math.sin(s.tw));
      ctx.fillStyle = `rgba(160, 255, 220, ${alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    raf = requestAnimationFrame(draw);
  };

  resize();
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(draw);

  let rt;
  window.addEventListener("resize", () => {
    clearTimeout(rt);
    rt = setTimeout(resize, 150);
  }, { passive: true });
}

/* Lightbox */
function initLightbox() {
  const lb = $("#lightbox");
  const img = $("#lightbox-img");
  const cap = $("#lightbox-cap");
  const closeA = $("#lightbox-close");
  const closeB = $("#lightbox-x");
  if (!lb || !(img instanceof HTMLImageElement) || !cap || !closeA || !closeB) return;

  let lastFocus = null;

  const open = (src, caption, trigger) => {
    lastFocus = trigger || document.activeElement;
    img.src = src;
    img.alt = caption || "Gallery image";
    cap.textContent = caption || "";
    lb.hidden = false;
    document.body.style.overflow = "hidden";
    closeB.focus();
  };

  const close = () => {
    lb.hidden = true;
    img.src = "";
    cap.textContent = "";
    document.body.style.overflow = "";
    lastFocus?.focus?.();
  };

  document.addEventListener("click", (e) => {
    const btn = e.target.closest?.("[data-lightbox]");
    if (!btn) return;
    const src = btn.getAttribute("data-lightbox");
    if (!src) return;
    open(src, btn.getAttribute("data-caption") || "", btn);
  });

  closeA.addEventListener("click", close);
  closeB.addEventListener("click", close);
  window.addEventListener("keydown", (e) => {
    if (!lb.hidden && e.key === "Escape") close();
  });
}

/* Config into DOM */
function renderConfig() {
  setText("tok-supply", CONFIG.supply);
  setText("tok-tax", `${CONFIG.buyTax.replace("%", "")} / ${CONFIG.sellTax.replace("%", "")}`);
  setText("tok-lp", CONFIG.lpBadge);
  setText("tok-own", CONFIG.ownershipBadge);
  setText("tok-network", CONFIG.network);
  setText("tok-name", `Shrek ${CONFIG.symbol}`);

  setHref("header-x-link", CONFIG.links.x);
  setHref("header-tg-link", CONFIG.links.tg);
  setHref("mobile-x-link", CONFIG.links.x);
  setHref("mobile-tg-link", CONFIG.links.tg);
  setHref("hero-buy-link", CONFIG.links.dex);
  setHref("hero-chart-link", CONFIG.links.chart);
  setHref("tok-chart-link", CONFIG.links.chart);

  setHref("community-x-link", CONFIG.links.x);
  setHref("community-tg-link", CONFIG.links.tg);
}

renderConfig();
initCopyButton();
initBurger();
initSmoothScroll();
initScrollFx();
initReveal();
initStars();
initLightbox();
