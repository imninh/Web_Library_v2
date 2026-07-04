/* ============================================================
   Librumi — Home + Catalog pages
   ============================================================ */
(function () {
  "use strict";
  window.Pages = window.Pages || {};

  function coverStyle(b) {
    if (b.image) return "background:#e9e9e4 center/cover no-repeat;background-image:url('" + U.esc(b.image) + "')";
    var c = b.cover || ["#93a163", "#84924f"];
    return "background:linear-gradient(150deg," + c[0] + "," + c[1] + ")";
  }

  function bookCard(b) {
    var inStock = (b.stock || 0) > 0;
    return '' +
      '<article class="book-card" data-nav="/book/' + b.id + '" data-rev>' +
      '  <div class="book-cover" style="' + coverStyle(b) + '">' +
      '     <span class="cat">' + U.esc(b.category) + '</span>' +
      (b.featured ? '<span class="feat-badge">Featured</span>' : '') +
      (b.image ? '' : '<span class="ct">' + U.esc(b.title) + '</span>') +
      '  </div>' +
      '  <div class="book-info">' +
      '     <div class="bt">' + U.esc(U.truncate(b.title, 42)) + '</div>' +
      '     <div class="ba">' + U.esc(b.author) + '</div>' +
      '     <div class="bmeta">' + U.stars(b.rating, 14) +
      '        <span class="badge-stock ' + (inStock ? "badge-in" : "badge-out") + '">' +
             (inStock ? b.stock + " in" : "Out") + '</span>' +
      '     </div>' +
      '  </div>' +
      '</article>';
  }

  /* ================= HOME ================= */
  window.Pages.home = async function () {
    var cats = await window.Store.categories();
    var rev = await window.Store.reviews(9);
    var revItems = (rev.items || []).slice(0, 3);
    var revPalette = ["#93a163", "#e8735a", "#4a6c8c", "#a0553f", "#6b7a8f", "#527a5b"];
    var reviewsHtml = revItems.length
      ? revItems.map(function (r, i) { return review(r.name, U.ago(r.created_at), U.truncate(r.content, 150), r.rating, revPalette[i % revPalette.length]); }).join("")
      : '<div class="tst-card" data-rev style="grid-column:1/-1;text-align:center;color:var(--ink-soft)">No reviews yet — be the first to review a book!</div>';
    var sum = rev.summary || { count: 0, average: 0 };
    var summaryHtml = sum.count > 0
      ? '<div data-rev style="text-align:center;margin-top:30px;font-family:var(--font-head);font-weight:800;font-size:22px;color:var(--ink)">' + sum.average + ' <span style="letter-spacing:2px">★★★★★</span>' +
        '<div style="font-family:var(--font-body);font-weight:500;font-size:13px;color:var(--ink-soft);margin-top:4px">Based on ' + U.num(sum.count) + ' reader review' + (sum.count > 1 ? 's' : '') + '</div></div>'
      : '';

    var html =
    /* ---- HERO (video + Readers/Kids toggle) ---- */
    '<div style="padding:14px 14px 0">' +
    '<section class="hero" id="hero" data-mode="readers">' +
    '  <div class="hero-teal"></div>' +
    '  <div class="hero-ghost" data-parallax="0.08"><span>LIBRUMI</span></div>' +
    '  <div class="hero-clips">' +
    '    <video class="hero-vid hero-vid--readers" autoplay loop muted playsinline preload="metadata"><source src="assets/adult_alpha_2160p.webm" type="video/webm"></video>' +
    '    <video class="hero-vid hero-vid--kids" autoplay loop muted playsinline preload="metadata"><source src="assets/child_alpha_2160p.webm" type="video/webm"></video>' +
    '  </div>' +
    '  <div class="hero-copy hero-copy--readers">' +
    '    <span class="eyebrow" style="color:rgba(255,255,255,.85)">Public Digital Library</span>' +
    '    <h1 class="split-title"><span class="linew">Borrow good books,</span><span class="linew">the easy way.</span></h1>' +
    '    <p>Reserve a copy online, pick it up when you are ready, and return it when you are done — no fees, no fuss.</p>' +
    '  </div>' +
    '  <div class="hero-copy hero-copy--kids">' +
    '    <span class="eyebrow" style="color:rgba(255,255,255,.85)">Little Readers&#39; Corner</span>' +
    '    <h1 style="font-family:var(--font-head);font-weight:800;font-size:52px;line-height:1.02;letter-spacing:-.02em;color:var(--cream);margin:0">Big stories for<br>little readers.</h1>' +
    '    <p>Picture books, first chapters and bedtime favourites — all ready to reserve for your young reader.</p>' +
    '  </div>' +
    '  <div class="hero-foot">' +
    '    <button class="btn-cream" data-magnetic="0.3" data-nav="/catalog"><span id="hero-cta">Browse the catalog</span> <span class="pill">' + U.arrow("#1b3a31", 20) + '</span></button>' +
    '    <div class="hero-toggle">' +
    '      <button class="hero-tg active" data-mode="readers" title="For readers" aria-label="For readers">' +
    '        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1b3a31" stroke-width="1.9"><path d="M12 6C10 4.5 6 4.3 3 5v13c3-.7 7-.5 9 1 2-1.5 6-1.7 9-1V5c-3-.7-7-.5-9 1Z"/><path d="M12 6v13"/></svg></button>' +
    '      <button class="hero-tg" data-mode="kids" title="For little readers" aria-label="For little readers">' +
    '        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1b3a31" stroke-width="1.9"><circle cx="12" cy="12" r="9"/><path d="M8.5 10h.01M15.5 10h.01"/><path d="M8.5 14.5c.9 1 2.1 1.5 3.5 1.5s2.6-.5 3.5-1.5"/></svg></button>' +
    '    </div>' +
    '  </div>' +
    '</section>' +
    '</div>' +

    /* ---- FILTER STRIP ---- */
    '<section class="wrap" style="margin-top:34px">' +
    '  <h2 class="section-title split-title" style="margin-bottom:22px"><span class="linew">Find the <span class="hl">right read</span> for you</span></h2>' +
    '  <div class="filter-strip" data-rev>' +
    '    <div class="field">' +
    '      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8a978c" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg>' +
    '      <input id="home-search" placeholder="Search by title or author…"/>' +
    '    </div>' +
    '    <div class="divider"></div>' +
    '    <select id="home-cat" class="inp" style="border:none;background:transparent;width:auto">' +
          cats.map(function (c) { return '<option value="' + U.esc(c) + '">' + U.esc(c === "All" ? "All categories" : c) + '</option>'; }).join("") +
    '    </select>' +
    '    <button class="btn-lime" id="home-see" style="border-radius:16px;padding:14px 22px">See suggestions ' + U.arrow("#1b3a31", 16) + '</button>' +
    '  </div>' +
    '</section>' +

    /* ---- CATALOG on home ---- */
    '<section class="wrap section" id="home-catalog">' +
    '  <div data-rev style="display:flex;justify-content:space-between;align-items:flex-end;gap:24px;flex-wrap:wrap;margin-bottom:26px">' +
    '    <h2 class="section-title" style="text-align:left;margin:0;font-size:40px;line-height:1.05">Made for<br>curious minds.</h2>' +
    '    <p style="font-size:16px;line-height:1.55;color:var(--ink-soft);max-width:360px;margin:0">Every title below is stocked as physical copies. Reserve one and we\'ll hold it at the desk for you.</p>' +
    '  </div>' +
    '  <div class="chips" id="home-chips" data-rev style="margin-bottom:26px">' +
        cats.map(function (c, i) { return '<button class="chip' + (i === 0 ? " active" : "") + '" data-cat="' + U.esc(c) + '">' + U.esc(c) + '</button>'; }).join("") +
    '  </div>' +
    '  <div id="home-grid" class="book-grid stagger"></div>' +
    '</section>' +

    /* ---- BENEFITS (numbered) ---- */
    '<section class="section" style="background:#f0ece1;margin-top:20px">' +
    '  <div class="wrap">' +
    '    <h2 class="section-title split-title"><span class="linew">Why borrow with Librumi?</span></h2>' +
    '    <div style="display:flex;justify-content:center;margin:0 0 40px">' +
    '      <svg width="150" height="26" viewBox="0 0 150 26" fill="none"><path data-draw d="M4 18C40 6 110 6 146 15" stroke="#e8735a" stroke-width="3.5" stroke-linecap="round"/></svg>' +
    '    </div>' +
    '    <div class="benefit-grid stagger">' +
          benefit("1", "Completely free", "No membership fees and no surprise late charges. A public library in the truest sense.") +
          benefit("2", "Reserve online", "Hold a copy in just a few clicks and pick it up at the desk whenever suits you.") +
          benefit("3", "A rich collection", "From fiction and science to cooking and technology — there is always a book for you.") +
          benefit("4", "Friendly reminders", "Clear due dates and gentle nudges so returning on time is effortless.") +
    '    </div>' +
    '  </div>' +
    '</section>' +

    /* ---- REVIEWS ---- */
    '<section class="wrap section">' +
    '  <h2 class="section-title split-title"><span class="linew">Loved by our readers</span></h2>' +
    '  <div class="tst-grid stagger" style="margin-top:30px">' + reviewsHtml + '</div>' +
       summaryHtml +
    '</section>' +

    /* ---- FAQ (2-col) ---- */
    '<section class="wrap section faq-2col">' +
    '  <div data-rev="left">' +
    '    <h2 class="section-title" style="text-align:left;font-size:38px;line-height:1.1;margin:0">You have<br>questions?<br><span class="hl">We have answers.</span></h2>' +
    '    <p style="font-size:15px;line-height:1.6;color:var(--ink-soft);margin:22px 0 0;max-width:320px">Everything you need to know about borrowing, returns and your library card.</p>' +
    '  </div>' +
    '  <div class="faq" data-rev style="margin:0">' +
        faq("Is borrowing free?", "Completely free. You only need an account and a valid reader profile.") +
        faq("How long can I keep a book?", "By default each loan has a due date you choose when reserving, and you may be reminded as it approaches.") +
        faq("Can I reserve for my child?", "Yes — switch the hero to the Little Readers' Corner, or filter the catalog for children's titles.") +
        faq("How do I become an administrator?", "Admin accounts are granted by the library. Demo account: admin / admin123.") +
    '  </div>' +
    '</section>';

    return { html: html, mount: mountHome };
  };

  function benefit(num, title, body) {
    return '<div class="why-card" data-rev>' +
      '<div class="bnum">' + num + '</div>' +
      '<h3>' + U.esc(title) + '</h3><p>' + U.esc(body) + '</p></div>';
  }
  function review(name, when, text, rate, bg) {
    var initial = (name || "?").trim().charAt(0).toUpperCase();
    return '<div class="tst-card" data-rev>' +
      '<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">' +
      '<div class="rv-avatar" style="background:' + bg + '">' + U.esc(initial) + '</div>' +
      '<div><div class="tst-who" style="font-size:15px">' + U.esc(name) + '</div><div style="font-size:12px;color:var(--ink-soft)">' + U.esc(when) + '</div></div></div>' +
      U.stars(rate, 15) + '<p style="margin:10px 0 0">' + U.esc(text) + '</p></div>';
  }
  function faq(q, a) {
    return '<div class="faq-item"><div class="faq-q">' + U.esc(q) + '<span class="chev">+</span></div><div class="faq-a">' + U.esc(a) + '</div></div>';
  }

  function mountHome(root) {
    // Hero Readers/Kids toggle (cross-fade video + copy + gradient + CTA)
    var hero = root.querySelector("#hero");
    var cta = root.querySelector("#hero-cta");
    var heroCtaBtn = cta && cta.closest("[data-nav]");
    root.querySelectorAll(".hero-tg").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var mode = btn.getAttribute("data-mode");
        if (hero.getAttribute("data-mode") === mode) return;
        hero.setAttribute("data-mode", mode);
        root.querySelectorAll(".hero-tg").forEach(function (b) { b.classList.toggle("active", b === btn); });
        if (cta) cta.textContent = mode === "kids" ? "Explore kids' books" : "Browse the catalog";
        if (heroCtaBtn) heroCtaBtn.setAttribute("data-nav", mode === "kids" ? "/catalog?category=" + encodeURIComponent("Children's Books") : "/catalog");

        // On Kids mode: activate the Children's Books chip in home-catalog + scroll to it
        var targetCat = mode === "kids" ? "Children's Books" : "All";
        var chip = root.querySelector('#home-chips .chip[data-cat="' + targetCat + '"]');
        if (chip && !chip.classList.contains("active")) chip.click();
        if (mode === "kids") {
          var section = root.querySelector("#home-catalog");
          if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });

    // Filter strip -> catalog page
    var search = root.querySelector("#home-search");
    var cat = root.querySelector("#home-cat");
    function doSearch() { U.go("/catalog?search=" + encodeURIComponent(search.value.trim()) + "&category=" + encodeURIComponent(cat.value)); }
    root.querySelector("#home-see").addEventListener("click", doSearch);
    search.addEventListener("keydown", function (e) { if (e.key === "Enter") doSearch(); });

    // Catalog-on-home: category tabs -> filter grid
    var grid = root.querySelector("#home-grid");
    async function loadGrid(category) {
      grid.innerHTML = '<div class="page-loading" style="grid-column:1/-1;min-height:180px"><span class="spinner"></span></div>';
      var res = await window.Store.books(category && category !== "All" ? { category: category } : {});
      var items = (res.items || []).slice(0, 8);
      grid.classList.remove("is-bound", "is-in");
      grid.innerHTML = items.length ? items.map(bookCard).join("") : '<p style="grid-column:1/-1;color:var(--ink-soft)">No titles here yet.</p>';
      if (window.Anim) window.Anim.refresh(grid.parentNode);
      grid.classList.add("is-in");
    }
    root.querySelectorAll("#home-chips .chip").forEach(function (chip) {
      chip.addEventListener("click", function () {
        root.querySelectorAll("#home-chips .chip").forEach(function (c) { c.classList.remove("active"); });
        chip.classList.add("active"); loadGrid(chip.getAttribute("data-cat"));
      });
    });
    loadGrid("All");

    // FAQ accordion
    root.querySelectorAll(".faq-item").forEach(function (it) {
      it.querySelector(".faq-q").addEventListener("click", function () { it.classList.toggle("open"); });
    });
  }

  /* ================= CATALOG ================= */
  window.Pages.catalog = async function (ctx) {
    var qs = {}; var qi = ctx.raw.indexOf("?");
    if (qi >= 0) new URLSearchParams(ctx.raw.slice(qi + 1)).forEach(function (v, k) { qs[k] = v; });
    var cats = await window.Store.categories();
    var active = qs.category || "All";

    var html =
    '<section class="wrap" style="padding-top:34px">' +
    '  <span class="eyebrow">Collection</span>' +
    '  <h1 class="section-title split-title" style="text-align:left;font-size:44px;margin:6px 0 20px"><span class="linew">Browse the whole library</span></h1>' +
    '  <div class="filter-strip" data-rev style="margin-bottom:20px">' +
    '    <div class="field"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8a978c" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg>' +
    '      <input id="cat-search" placeholder="Search by title or author…" value="' + U.esc(qs.search || "") + '"/></div>' +
    '  </div>' +
    '  <div class="chips" id="cat-chips" style="margin-bottom:26px">' +
        cats.map(function (c) { return '<button class="chip' + (c === active ? " active" : "") + '" data-cat="' + U.esc(c) + '">' + U.esc(c) + '</button>'; }).join("") +
    '  </div>' +
    '  <div id="cat-grid" class="book-grid stagger"></div>' +
    '</section>';

    return {
      html: html,
      mount: function (root) {
        var grid = root.querySelector("#cat-grid");
        var searchEl = root.querySelector("#cat-search");
        var state = { search: qs.search || "", category: active };
        async function load() {
          grid.innerHTML = '<div class="page-loading" style="grid-column:1/-1;min-height:200px"><span class="spinner"></span></div>';
          var res = await window.Store.books(state);
          var items = res.items || [];
          grid.classList.remove("is-bound", "is-in");
          grid.innerHTML = items.length ? items.map(bookCard).join("") : '<p style="grid-column:1/-1;color:var(--ink-soft)">No matching books found.</p>';
          if (window.Anim) window.Anim.refresh(grid.parentNode);
          grid.classList.add("is-in");
        }
        searchEl.addEventListener("input", U.debounce(function () { state.search = searchEl.value.trim(); load(); }, 250));
        root.querySelectorAll("#cat-chips .chip").forEach(function (chip) {
          chip.addEventListener("click", function () {
            root.querySelectorAll("#cat-chips .chip").forEach(function (c) { c.classList.remove("active"); });
            chip.classList.add("active"); state.category = chip.getAttribute("data-cat"); load();
          });
        });
        load();
      }
    };
  };
})();
