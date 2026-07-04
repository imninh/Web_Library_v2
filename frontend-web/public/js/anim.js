/* ============================================================
   Librumi - Animation engine (TỰ VIẾT, KHÔNG DÙNG THƯ VIỆN)
   Tái hiện chuyển động của voldogfood.com bằng vanilla:
   - reveal so le, split-title (chữ theo từng từ), draw-path SVG,
     count-up, magnetic, parallax, cursor follower, scroll progress.
   Cơ chế kích hoạt: SCROLL-DRIVEN (getBoundingClientRect) thay vì chỉ
   dựa IntersectionObserver -> chắc chắn hiện nội dung, không kẹt opacity:0.
   Cổng an toàn: thêm <html class="anim-on">; nếu JS lỗi, nội dung vẫn hiện.
   API: window.Anim.refresh() gọi lại sau mỗi lần render route (SPA).
   ============================================================ */
(function () {
  "use strict";

  // Bật cổng: chỉ khi có JS mới áp trạng thái ẩn ban đầu (no-JS vẫn thấy nội dung)
  document.documentElement.classList.add("anim-on");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;
  var lerp = function (a, b, t) { return a + (b - a) * t; };

  /* Danh sách phần tử chờ kích hoạt (scroll-driven) */
  var pending = []; // {el, type}

  function inView(el, ratio) {
    var r = el.getBoundingClientRect();
    var vh = window.innerHeight || document.documentElement.clientHeight;
    if (r.height === 0 && r.width === 0) return false;
    var trigger = vh * (ratio == null ? 0.88 : ratio);
    return r.top < trigger && r.bottom > 0;
  }

  /* ---- Kích hoạt từng loại ---- */
  function activate(item) {
    var el = item.el;
    if (item.type === "rev") {
      el.classList.add("is-in");
    } else if (item.type === "stagger") {
      el.classList.add("is-in");
    } else if (item.type === "split") {
      el.querySelectorAll(".linew").forEach(function (line, li) {
        line.querySelectorAll(".word").forEach(function (word, wi) {
          word.style.setProperty("--wd", (200 * li + 42 * wi) + "ms"); // nhịp kiểu voldog
        });
      });
      el.classList.add("is-in");
    } else if (item.type === "draw") {
      el.classList.add("is-in");
    } else if (item.type === "count") {
      runCount(el);
    }
  }

  function checkPending() {
    if (!pending.length) return;
    var still = [];
    for (var i = 0; i < pending.length; i++) {
      var it = pending[i];
      var ratio = it.type === "count" ? 0.95 : (it.type === "split" ? 0.9 : 0.88);
      if (inView(it.el, ratio)) activate(it);
      else still.push(it);
    }
    pending = still;
  }

  /* ---- Count-up ---- */
  function runCount(el) {
    var target = parseFloat(el.getAttribute("data-count")) || 0;
    var suffix = el.getAttribute("data-suffix") || "";
    var dur = 1100, start = null;
    function tick(now) {
      if (start === null) start = now;
      var p = Math.min(1, (now - start) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString("en-US") + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    // fallback nếu rAF không chạy: vẫn set giá trị cuối sau 1.2s
    requestAnimationFrame(tick);
    setTimeout(function () { if (el.textContent === "0") el.textContent = target.toLocaleString("en-US") + suffix; }, 1300);
  }

  /* ---- Tách chữ cho split-title ---- */
  function splitWords(el) {
    if (el.classList.contains("is-split")) return;
    el.classList.add("is-split");
    var lines = el.querySelectorAll(".linew");
    if (!lines.length) {
      var wrap = document.createElement("span");
      wrap.className = "linew";
      while (el.firstChild) wrap.appendChild(el.firstChild);
      el.appendChild(wrap);
      lines = el.querySelectorAll(".linew");
    }
    lines.forEach(function (line) {
      // Giữ nguyên node con phức tạp (vd .hl); chỉ tách các TEXT node thành từ
      var kids = Array.prototype.slice.call(line.childNodes);
      line.textContent = "";
      kids.forEach(function (node) {
        if (node.nodeType === 3) {
          node.textContent.split(/(\s+)/).forEach(function (w) {
            if (w.trim() === "") { line.appendChild(document.createTextNode(w)); return; }
            var span = document.createElement("span"); span.className = "word";
            var inner = document.createElement("span"); inner.textContent = w;
            span.appendChild(inner); line.appendChild(span);
          });
        } else {
          var span2 = document.createElement("span"); span2.className = "word";
          span2.appendChild(node); line.appendChild(span2);
        }
      });
    });
  }

  /* ---- Bind (quét phần tử mới, tránh trùng bằng .is-bound) ---- */
  function bind(scope) {
    scope.querySelectorAll("[data-rev]:not(.is-bound)").forEach(function (el) {
      el.classList.add("is-bound"); pending.push({ el: el, type: "rev" });
    });
    scope.querySelectorAll(".stagger:not(.is-bound)").forEach(function (box) {
      box.classList.add("is-bound");
      Array.prototype.forEach.call(box.children, function (c, i) { c.style.setProperty("--sd", (i * 90) + "ms"); });
      pending.push({ el: box, type: "stagger" });
    });
    scope.querySelectorAll(".split-title:not(.is-bound)").forEach(function (el) {
      el.classList.add("is-bound"); splitWords(el); pending.push({ el: el, type: "split" });
    });
    scope.querySelectorAll("[data-draw]:not(.is-bound)").forEach(function (path) {
      path.classList.add("is-bound");
      try { path.style.setProperty("--len", Math.ceil(path.getTotalLength())); } catch (e) {}
      pending.push({ el: path, type: "draw" });
    });
    scope.querySelectorAll("[data-count]:not(.is-bound)").forEach(function (el) {
      el.classList.add("is-bound"); pending.push({ el: el, type: "count" });
    });
    bindMagnetic(scope);
    bindParallax(scope);
    // kích hoạt ngay các phần tử đã nằm trong màn hình
    checkPending();
    requestAnimationFrame(checkPending);
    setTimeout(checkPending, 60);
    setTimeout(checkPending, 300);
  }

  /* ---- Magnetic ---- */
  function bindMagnetic(scope) {
    if (isTouch) return;
    scope.querySelectorAll("[data-magnetic]:not(.mag-bound)").forEach(function (el) {
      el.classList.add("mag-bound", "magnetic");
      var str = parseFloat(el.getAttribute("data-magnetic")) || 0.3;
      el.addEventListener("mousemove", function (ev) {
        var r = el.getBoundingClientRect();
        el.style.transform = "translate(" + ((ev.clientX - r.left - r.width / 2) * str) + "px," + ((ev.clientY - r.top - r.height / 2) * str) + "px)";
      });
      el.addEventListener("mouseleave", function () { el.style.transform = ""; });
    });
  }

  /* ---- Parallax ---- */
  var parallaxEls = [];
  function bindParallax(scope) {
    scope.querySelectorAll("[data-parallax]:not(.px-bound)").forEach(function (el) {
      el.classList.add("px-bound");
      parallaxEls.push({ el: el, speed: parseFloat(el.getAttribute("data-parallax")) || 0.15, cur: 0 });
    });
  }
  function updateParallax() {
    if (reduceMotion) return;
    var vh = window.innerHeight;
    parallaxEls.forEach(function (p) {
      var r = p.el.getBoundingClientRect();
      var off = ((r.top + r.height / 2) - vh / 2) * -p.speed;
      p.cur = lerp(p.cur, off, 0.5);
      p.el.style.transform = "translate3d(0," + p.cur.toFixed(1) + "px,0)";
    });
  }

  /* ---- Cursor follower ---- */
  function initCursor() {
    if (isTouch || reduceMotion) return;
    var dot = document.createElement("div"); dot.className = "cursor-dot";
    var ring = document.createElement("div"); ring.className = "cursor-ring";
    document.body.appendChild(dot); document.body.appendChild(ring);
    var mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    addEventListener("mousemove", function (e) {
      mx = e.clientX; my = e.clientY; dot.style.left = mx + "px"; dot.style.top = my + "px";
    }, { passive: true });
    (function loop() { rx = lerp(rx, mx, 0.18); ry = lerp(ry, my, 0.18); ring.style.left = rx + "px"; ring.style.top = ry + "px"; requestAnimationFrame(loop); })();
    document.addEventListener("mouseover", function (e) { if (e.target.closest("a,button,[data-magnetic],input,select,textarea,[role=button],.chip,.book-card,.faq-q")) document.body.classList.add("cursor-hot"); });
    document.addEventListener("mouseout", function (e) { if (e.target.closest("a,button,[data-magnetic],input,select,textarea,[role=button],.chip,.book-card,.faq-q")) document.body.classList.remove("cursor-hot"); });
  }

  /* ---- Scroll progress ---- */
  function initProgress() {
    var bar = document.createElement("div"); bar.className = "scroll-progress";
    document.body.appendChild(bar);
    function upd() {
      var h = document.documentElement.scrollHeight - innerHeight;
      bar.style.width = (h > 0 ? (scrollY / h) * 100 : 0).toFixed(2) + "%";
    }
    addEventListener("scroll", upd, { passive: true });
    addEventListener("resize", upd, { passive: true });
    upd();
  }

  /* ---- Smooth scroll (OPT-IN: <body data-smooth="on">) ---- */
  function initSmoothScroll() {
    if (isTouch || reduceMotion) return;
    if (document.body.getAttribute("data-smooth") !== "on") return;
    var cur = scrollY, target = scrollY, running = false;
    function clamp(v) { return Math.max(0, Math.min(v, document.documentElement.scrollHeight - innerHeight)); }
    addEventListener("wheel", function (e) {
      if (e.ctrlKey) return; e.preventDefault();
      target = clamp(target + e.deltaY);
      if (!running) { running = true; requestAnimationFrame(step); }
    }, { passive: false });
    function step() {
      cur = lerp(cur, target, 0.12);
      if (Math.abs(target - cur) < 0.4) { running = false; scrollTo(0, target); return; }
      scrollTo(0, cur); requestAnimationFrame(step);
    }
  }

  /* ---- Vòng lặp nền (parallax) + lắng nghe scroll ---- */
  function onScroll() { checkPending(); updateParallax(); }
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll, { passive: true });
  (function bg() { updateParallax(); requestAnimationFrame(bg); })();

  /* ---- Public ---- */
  function refresh(root) { bind(root || document); }
  window.Anim = { refresh: refresh, check: checkPending, reduceMotion: reduceMotion, isTouch: isTouch };

  document.addEventListener("DOMContentLoaded", function () {
    initCursor(); initProgress(); initSmoothScroll(); refresh(document);
  });
})();
