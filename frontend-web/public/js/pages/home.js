/* Trang chủ + Danh mục */
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
    var revItems = (rev.items || []).slice(0, 9);
    var revPalette = ["#93a163", "#e8735a", "#4a6c8c", "#a0553f", "#6b7a8f", "#527a5b"];
    var reviewsHtml = revItems.length
      ? revItems.map(function (r, i) { return review(r.name, U.ago(r.created_at), U.truncate(r.content, 180), r.rating, revPalette[i % revPalette.length]); }).join("")
      : '<div class="tst-card" style="text-align:center;color:var(--ink-soft);flex:0 0 100%">No reviews yet - be the first to share.</div>';
    var sum = rev.summary || { count: 0, average: 0 };

    var html =
    /* ---- HERO (video + Readers/Kids toggle) ---- */
    '<div style="padding:14px 14px 0">' +
    '<section class="hero" id="hero" data-mode="readers">' +
    '  <div class="hero-teal"></div>' +
    '  <div class="hero-ghost" data-parallax="0.08"><span>LIBRUMI</span></div>' +
    '  <img class="hero-tia" src="assets/Tia.png" alt="" aria-hidden="true" width="535" height="449">' +
    '  <div class="hero-clips">' +
    '    <video class="hero-vid hero-vid--readers" autoplay loop muted playsinline preload="auto"><source src="assets/adult_alpha.webm" type="video/webm"></video>' +
    '    <video class="hero-vid hero-vid--kids" autoplay loop muted playsinline preload="auto"><source src="assets/child_alpha.webm" type="video/webm"></video>' +
    '  </div>' +
    '  <div class="hero-copy hero-copy--readers">' +
    '    <span class="eyebrow" style="color:rgba(255,255,255,.85)">Public Digital Library</span>' +
    '    <h1 class="split-title"><span class="linew">Borrow good books,</span><span class="linew">the easy way.</span></h1>' +
    '    <p>Reserve a copy online, pick it up when you are ready, and return it when you are done - no fees, no fuss.</p>' +
    '  </div>' +
    '  <div class="hero-copy hero-copy--kids">' +
    '    <span class="eyebrow" style="color:rgba(255,255,255,.85)">Little Readers&#39; Corner</span>' +
    '    <h1 style="font-family:var(--font-head);font-weight:800;font-size:clamp(40px,6vw,64px);line-height:1.02;letter-spacing:-.02em;color:var(--cream);margin:0">Big stories for<br>little readers.</h1>' +
    '    <p>Picture books, first chapters and bedtime favourites - all ready to reserve for your young reader.</p>' +
    '  </div>' +
    '  <div class="sticker" style="top:22px;right:30px" aria-label="Always free">Always<br>free</div>' +
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

    /* ---- MARQUEE 1 (dưới hero) ---- */
    marqueeHtml(false) +

    /* ---- CATEGORY TILES + FILTER STRIP ---- */
    '<section class="wrap" style="margin-top:22px">' +
    '  <h2 class="section-title split-title" style="margin-bottom:6px"><span class="linew">Explore <span class="hl">the library</span></span></h2>' +
    '  <p class="section-sub">Browse by category, or search for a title directly below.</p>' +
    '  <div class="cat-tiles" data-rev>' + catTilesHtml() + '</div>' +
    '  <div class="filter-strip" data-rev style="margin-top:26px">' +
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

    /* ---- IDEAL BOOK FINDER (wizard 3 bước) ---- */
    '<section class="wrap" style="margin-top:20px">' +
    '  <div class="ideal-finder" data-rev>' + idealFinderHtml() + '</div>' +
    '</section>' +

    /* ---- CATALOG on home (carousel) ---- */
    '<section class="wrap section" id="home-catalog">' +
    '  <div class="carousel-head" data-rev>' +
    '    <div>' +
    '      <h2 class="section-title" style="text-align:left;margin:0 0 6px;font-size:40px;line-height:1.05">Made for<br>curious minds.</h2>' +
    '      <p style="font-size:16px;line-height:1.55;color:var(--ink-soft);max-width:380px;margin:0">Every title below is stocked as physical copies. Reserve one and we\'ll hold it at the desk.</p>' +
    '    </div>' +
    '    <div class="carousel-nav">' +
    '      <button class="carousel-arrow" data-carousel="prev" aria-label="Scroll left">←</button>' +
    '      <button class="carousel-arrow" data-carousel="next" aria-label="Scroll right">→</button>' +
    '    </div>' +
    '  </div>' +
    '  <div class="chips" id="home-chips" data-rev style="margin-bottom:22px">' +
        cats.map(function (c, i) { return '<button class="chip' + (i === 0 ? " active" : "") + '" data-cat="' + U.esc(c) + '">' + U.esc(c) + '</button>'; }).join("") +
    '  </div>' +
    '  <div id="home-grid" class="book-carousel stagger"></div>' +
    '</section>' +

    /* ---- WAVE (chuyển vào benefits) ---- */
    '<div class="wave" aria-hidden="true" style="color:#f0ece1;background:var(--bg)">' +
    '  <svg viewBox="0 0 1440 46" preserveAspectRatio="none"><path fill="currentColor" d="M0,46 C240,10 480,50 720,26 C960,4 1200,42 1440,20 L1440,46 Z"/></svg>' +
    '</div>' +

    /* ---- BENEFITS (SVG icons + sticker) ---- */
    '<section class="section" style="background:#f0ece1;position:relative">' +
    '  <div class="sticker sticker--coral sticker--sm" style="top:-24px;right:8%">New<br>arrivals</div>' +
    '  <div class="wrap">' +
    '    <h2 class="section-title split-title"><span class="linew">Made with love for readers</span></h2>' +
    '    <div style="display:flex;justify-content:center;margin:0 0 40px">' +
    '      <svg width="150" height="26" viewBox="0 0 150 26" fill="none"><path data-draw d="M4 18C40 6 110 6 146 15" stroke="#e8735a" stroke-width="3.5" stroke-linecap="round"/></svg>' +
    '    </div>' +
    '    <div class="benefit-grid stagger">' +
          benefit("1", "Completely free", "No membership fees and no surprise late charges. A public library in the truest sense.") +
          benefit("2", "Reserve online", "Hold a copy in just a few clicks and pick it up at the desk whenever suits you.") +
          benefit("3", "A rich collection", "From fiction and science to cooking and technology - there is always a book for you.") +
          benefit("4", "Friendly reminders", "Clear due dates and gentle nudges so returning on time is effortless.") +
    '    </div>' +
    '  </div>' +
    '</section>' +

    /* ---- WAVE (chuyển ra khỏi benefits) ---- */
    '<div class="wave wave--flip" aria-hidden="true" style="color:#f0ece1;background:var(--bg)">' +
    '  <svg viewBox="0 0 1440 46" preserveAspectRatio="none"><path fill="currentColor" d="M0,46 C240,10 480,50 720,26 C960,4 1200,42 1440,20 L1440,46 Z"/></svg>' +
    '</div>' +

    /* ---- REVIEWS (badge + carousel) ---- */
    '<section class="wrap section">' +
    '  <div class="carousel-head" data-rev>' +
    '    <div>' +
    '      <h2 class="section-title split-title" style="text-align:left;margin:0 0 6px"><span class="linew">Loved by our readers</span></h2>' +
    '      <p style="color:var(--ink-soft);margin:0;max-width:520px">Real thoughts from readers who have borrowed with Librumi.</p>' +
    '    </div>' +
    '    <div class="carousel-nav">' +
    '      <button class="carousel-arrow" data-rv-carousel="prev" aria-label="Scroll left">←</button>' +
    '      <button class="carousel-arrow" data-rv-carousel="next" aria-label="Scroll right">→</button>' +
    '    </div>' +
    '  </div>' +
    '  <div class="reviews-google" data-rev>' +
    '    <div class="rv-badge">' +
    '      <div class="rv-badge-num">' + (sum.average || 0) + '</div>' +
    '      <div class="rv-badge-stars">★★★★★</div>' +
    '      <div class="rv-badge-lbl">Based on ' + U.num(sum.count || 0) + ' review' + ((sum.count || 0) === 1 ? '' : 's') + '</div>' +
    '      <div class="rv-badge-foot">Reader rating</div>' +
    '    </div>' +
    '    <div class="rv-carousel-wrap">' +
    '      <div class="rv-carousel" id="rv-carousel">' + reviewsHtml + '</div>' +
    '    </div>' +
    '  </div>' +
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
        faq("Can I reserve for my child?", "Yes - switch the hero to the Little Readers' Corner, or filter the catalog for children's titles.") +
        faq("What if the book I want is out of stock?", "Each book page shows live stock. If a title is out, check back in a few days - copies return quickly.") +
    '  </div>' +
    '</section>' +

    /* ---- MARQUEE 2 (đảo chiều, trước footer) ---- */
    marqueeHtml(true);

    return { html: html, mount: mountHome };
  };

  /* ---- Category tiles ---- */
  function tileGlyph(kind) {
    var svg = {
      book:   '<svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#1b3a31" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h6a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4z"/><path d="M20 4h-6a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h7z"/></svg>',
      rocket: '<svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#1b3a31" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3c4 0 7 3 7 7l-6 6-4-4z"/><path d="M11 12l-3 3-3-1 1-3 3-1"/><path d="M8 16l-3 3M13 4l-3 3"/></svg>',
      chef:   '<svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#1b3a31" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 12a4 4 0 1 1 3-6.9A4 4 0 0 1 15 5.1 4 4 0 1 1 18 12v3H6z"/><path d="M6 15h12v3a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z"/></svg>',
      atom:   '<svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#1b3a31" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="1.6" fill="#1b3a31"/><ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-60 12 12)"/></svg>',
      feather:'<svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#1b3a31" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 4c-4 0-11 2-13 11l-3 5 5-3c9-2 11-9 11-13z"/><path d="M6 20l7-7"/></svg>'
    };
    return svg[kind] || svg.book;
  }
  function catTilesHtml() {
    var tiles = [
      { cat: "Fiction",   sub: "Stories & novels",     tile: "var(--tile-1)", glyph: "book"    },
      { cat: "Sci-Fi",    sub: "Worlds beyond",        tile: "var(--tile-4)", glyph: "rocket"  },
      { cat: "Cooking",   sub: "Recipes & flavours",   tile: "var(--tile-5)", glyph: "chef"    },
      { cat: "Science",   sub: "Curious minds",        tile: "var(--tile-3)", glyph: "atom"    },
      { cat: "Poetry",    sub: "Rhythm & verse",       tile: "var(--tile-2)", glyph: "feather" }
    ];
    return tiles.map(function (t) {
      return '<button class="cat-tile" style="background:' + t.tile + '" data-nav="/catalog?category=' + encodeURIComponent(t.cat) + '">' +
        '<span class="cat-glyph">' + tileGlyph(t.glyph) + '</span>' +
        '<div class="cat-name">' + U.esc(t.cat) + '</div>' +
        '<div class="cat-sub">' + U.esc(t.sub) + '</div>' +
        '</button>';
    }).join("");
  }

  /* ---- Ideal book finder ---- */
  function idealFinderHtml() {
    return '<div class="ideal-inner">' +
      '  <div class="ideal-copy">' +
      '    <span class="eyebrow">Reading assistant</span>' +
      '    <h2>Find your <span class="hl">ideal</span> book</h2>' +
      '    <p>Answer three quick questions and we\'ll hand-pick three titles from the library for you.</p>' +
      '  </div>' +
      '  <div class="ideal-wizard" id="ideal-wizard">' +
      '    <div class="ideal-steps"><span class="dot active"></span><span class="dot"></span><span class="dot"></span></div>' +
      '    <div class="ideal-step active" data-step="1">' +
      '      <h3>1. What do you feel like reading?</h3>' +
      '      <div class="ideal-choices">' +
      '        <button type="button" data-value="Fiction">Fiction</button>' +
      '        <button type="button" data-value="Science">Knowledge</button>' +
      '        <button type="button" data-value="Cooking">Cooking</button>' +
      '        <button type="button" data-value="Sci-Fi">Adventure</button>' +
      '        <button type="button" data-value="Self-help">Comfort read</button>' +
      '        <button type="button" data-value="Poetry">Poetry</button>' +
      '      </div>' +
      '      <div class="ideal-actions"><span></span><button type="button" class="btn-ghost ideal-next" disabled>Next →</button></div>' +
      '    </div>' +
      '    <div class="ideal-step" data-step="2">' +
      '      <h3>2. How much time do you have?</h3>' +
      '      <div class="ideal-choices">' +
      '        <button type="button" data-value="short">A quick evening</button>' +
      '        <button type="button" data-value="medium">A few days</button>' +
      '        <button type="button" data-value="long">A whole week</button>' +
      '      </div>' +
      '      <div class="ideal-actions"><button type="button" class="back">← Back</button><button type="button" class="btn-ghost ideal-next" disabled>Next →</button></div>' +
      '    </div>' +
      '    <div class="ideal-step" data-step="3">' +
      '      <h3>3. What mood are you after?</h3>' +
      '      <div class="ideal-choices">' +
      '        <button type="button" data-value="calm">Calm</button>' +
      '        <button type="button" data-value="deep">Deep</button>' +
      '        <button type="button" data-value="fun">Fun</button>' +
      '        <button type="button" data-value="serious">Serious</button>' +
      '      </div>' +
      '      <div class="ideal-actions"><button type="button" class="back">← Back</button><button type="button" class="btn-lime ideal-submit" disabled>See picks →</button></div>' +
      '    </div>' +
      '    <div class="ideal-result">' +
      '      <h3>Three picks for you</h3>' +
      '      <div class="ideal-books"></div>' +
      '      <div class="ideal-actions"><button type="button" class="back ideal-restart">↺ Start over</button><span></span></div>' +
      '    </div>' +
      '  </div>' +
      '</div>';
  }

  function marqueeHtml(reverse) {
    var msgs = ["LIBRUMI", "Borrow the smart way", "Always free, always fair", "One page a day", "Your public library"];
    var block = msgs.map(function (m) {
      return '<span class="marquee-item"><span class="mq-star"></span>' + U.esc(m) + '</span>';
    }).join("");
    return '<div class="marquee' + (reverse ? ' marquee--reverse' : '') + '" aria-hidden="true">' +
      '<div class="marquee-track">' + block + block + '</div></div>';
  }
  function benefit(num, title, body) {
    var glyphs = {
      "1": { color: "var(--lime-soft)", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="#1b3a31" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-8-4.6-8-11a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6.4-8 11-10 11z"/></svg>' },
      "2": { color: "var(--sky-soft)", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="#1b3a31" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="15" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/><circle cx="12" cy="15" r="1.6" fill="#1b3a31"/></svg>' },
      "3": { color: "var(--butter-soft)", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="#1b3a31" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h6a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4z"/><path d="M20 4h-6a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h7z"/></svg>' },
      "4": { color: "var(--rose-soft)", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="#1b3a31" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0v4l2 3H4l2-3z"/><path d="M10 18a2 2 0 0 0 4 0"/></svg>' }
    };
    var g = glyphs[num] || glyphs["1"];
    return '<div class="why-card" data-rev>' +
      '<div class="bblob" style="background:' + g.color + '">' + g.svg + '</div>' +
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
    // Reset body class when re-entering home (hero defaults to readers)
    document.body.classList.remove("hero-kids");
    root.querySelectorAll(".hero-tg").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var mode = btn.getAttribute("data-mode");
        if (hero.getAttribute("data-mode") === mode) return;
        hero.setAttribute("data-mode", mode);
        document.body.classList.toggle("hero-kids", mode === "kids");
        root.querySelectorAll(".hero-tg").forEach(function (b) { b.classList.toggle("active", b === btn); });
        if (cta) cta.textContent = mode === "kids" ? "Explore kids' books" : "Browse the catalog";
        if (heroCtaBtn) heroCtaBtn.setAttribute("data-nav", mode === "kids" ? "/catalog?category=" + encodeURIComponent("Children's Books") : "/catalog");

        // On Kids mode: activate the Children's Books chip in home-catalog (no scroll)
        var targetCat = mode === "kids" ? "Children's Books" : "All";
        var chip = root.querySelector('#home-chips .chip[data-cat="' + targetCat + '"]');
        if (chip && !chip.classList.contains("active")) chip.click();
      });
    });

    // Filter strip -> catalog page
    var search = root.querySelector("#home-search");
    var cat = root.querySelector("#home-cat");
    function doSearch() { U.go("/catalog?search=" + encodeURIComponent(search.value.trim()) + "&category=" + encodeURIComponent(cat.value)); }
    root.querySelector("#home-see").addEventListener("click", doSearch);
    search.addEventListener("keydown", function (e) { if (e.key === "Enter") doSearch(); });

    // Catalog-on-home: category tabs -> filter carousel
    var grid = root.querySelector("#home-grid");
    async function loadGrid(category) {
      grid.innerHTML = '<div class="page-loading" style="flex:0 0 100%;min-height:180px"><span class="spinner"></span></div>';
      var res = await window.Store.books(category && category !== "All" ? { category: category } : {});
      var items = (res.items || []).slice(0, 12);
      grid.classList.remove("is-bound", "is-in");
      grid.innerHTML = items.length ? items.map(bookCard).join("") : '<p style="flex:0 0 100%;color:var(--ink-soft)">No titles in this category yet.</p>';
      if (window.Anim) window.Anim.refresh(grid.parentNode);
      grid.classList.add("is-in");
      grid.scrollLeft = 0;
      updateBookArrows();
    }
    root.querySelectorAll("#home-chips .chip").forEach(function (chip) {
      chip.addEventListener("click", function () {
        root.querySelectorAll("#home-chips .chip").forEach(function (c) { c.classList.remove("active"); });
        chip.classList.add("active"); loadGrid(chip.getAttribute("data-cat"));
      });
    });

    // Book carousel arrows (prev/next + disabled state)
    var bookPrev = root.querySelector('[data-carousel="prev"]');
    var bookNext = root.querySelector('[data-carousel="next"]');
    function updateBookArrows() {
      if (!bookPrev || !bookNext) return;
      var atStart = grid.scrollLeft < 4;
      var atEnd = grid.scrollLeft + grid.clientWidth >= grid.scrollWidth - 4;
      bookPrev.disabled = atStart;
      bookNext.disabled = atEnd;
    }
    if (bookPrev) bookPrev.addEventListener("click", function () { grid.scrollBy({ left: -grid.clientWidth * 0.85, behavior: "smooth" }); });
    if (bookNext) bookNext.addEventListener("click", function () { grid.scrollBy({ left: grid.clientWidth * 0.85, behavior: "smooth" }); });
    grid.addEventListener("scroll", updateBookArrows);
    window.addEventListener("resize", updateBookArrows);

    loadGrid("All");

    // Review carousel arrows
    var rvCarousel = root.querySelector("#rv-carousel");
    var rvPrev = root.querySelector('[data-rv-carousel="prev"]');
    var rvNext = root.querySelector('[data-rv-carousel="next"]');
    function updateRvArrows() {
      if (!rvCarousel || !rvPrev || !rvNext) return;
      var atStart = rvCarousel.scrollLeft < 4;
      var atEnd = rvCarousel.scrollLeft + rvCarousel.clientWidth >= rvCarousel.scrollWidth - 4;
      rvPrev.disabled = atStart;
      rvNext.disabled = atEnd;
    }
    if (rvPrev) rvPrev.addEventListener("click", function () { rvCarousel.scrollBy({ left: -rvCarousel.clientWidth * 0.85, behavior: "smooth" }); });
    if (rvNext) rvNext.addEventListener("click", function () { rvCarousel.scrollBy({ left: rvCarousel.clientWidth * 0.85, behavior: "smooth" }); });
    if (rvCarousel) { rvCarousel.addEventListener("scroll", updateRvArrows); setTimeout(updateRvArrows, 60); }

    // Ideal finder wizard
    mountIdealFinder(root);

    // FAQ accordion
    root.querySelectorAll(".faq-item").forEach(function (it) {
      it.querySelector(".faq-q").addEventListener("click", function () { it.classList.toggle("open"); });
    });
  }

  function mountIdealFinder(root) {
    var wiz = root.querySelector("#ideal-wizard");
    if (!wiz) return;
    var state = { step: 1, choice: { 1: null, 2: null, 3: null } };
    var steps = wiz.querySelectorAll(".ideal-step");
    var dots = wiz.querySelectorAll(".ideal-steps .dot");
    var result = wiz.querySelector(".ideal-result");

    function show(step) {
      state.step = step;
      steps.forEach(function (s) { s.classList.toggle("active", +s.dataset.step === step); });
      dots.forEach(function (d, i) { d.classList.toggle("active", i < step); });
      result.classList.remove("active");
    }

    wiz.querySelectorAll(".ideal-choices button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var parent = btn.closest(".ideal-choices");
        parent.querySelectorAll("button").forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        var step = +btn.closest(".ideal-step").dataset.step;
        state.choice[step] = btn.dataset.value;
        var stepEl = btn.closest(".ideal-step");
        var nx = stepEl.querySelector(".ideal-next") || stepEl.querySelector(".ideal-submit");
        if (nx) nx.disabled = false;
      });
    });

    wiz.querySelectorAll(".ideal-next").forEach(function (btn) {
      btn.addEventListener("click", function () { if (!btn.disabled) show(state.step + 1); });
    });
    wiz.querySelectorAll(".back").forEach(function (btn) {
      if (btn.classList.contains("ideal-restart")) return;
      btn.addEventListener("click", function () { show(state.step - 1); });
    });

    var submit = wiz.querySelector(".ideal-submit");
    if (submit) submit.addEventListener("click", async function () {
      var category = state.choice[1];
      var time = state.choice[2];
      var mood = state.choice[3];
      var res = await window.Store.books(category ? { category: category } : {});
      var all = (res.items || []);
      // Điểm cho từng cuốn: rating là base + mood/time weights
      var scored = all.map(function (b) {
        var s = (b.rating || 0);
        if (mood === "calm" || mood === "deep") s += (b.rating || 0) * 0.5;
        else if (mood === "fun") s += (b.borrow_count || 0) * 0.03;
        else if (mood === "serious") s += (b.borrow_count || 0) * 0.015 + (b.rating || 0) * 0.3;
        if (time === "short") s += (b.borrow_count || 0) * 0.02;              // popular quick reads
        else if (time === "long") s += (b.featured ? 1.2 : 0) + (b.rating || 0) * 0.2;  // depth
        return { b: b, score: s };
      });
      scored.sort(function (a, b) { return b.score - a.score; });
      var items = scored.slice(0, 3).map(function (x) { return x.b; });
      var reason = "Ranked by " + (category ? category + " · " : "") + (time === "short" ? "quick read" : time === "long" ? "deep read" : "medium read") + " · " + (mood || "any mood") + ".";
      var container = wiz.querySelector(".ideal-books");
      container.innerHTML = items.length ? items.map(function (b) {
        var cov = b.image
          ? "background:#e9e9e4 center/cover;background-image:url('" + U.esc(b.image) + "')"
          : "background:linear-gradient(150deg," + (b.cover || ["#93a163", "#84924f"])[0] + "," + (b.cover || ["#93a163", "#84924f"])[1] + ")";
        return '<div class="ideal-book" data-nav="/book/' + b.id + '">' +
          '<div class="ib-mini" style="' + cov + '">' + (b.image ? "" : '<span>' + U.esc(U.truncate(b.title, 26)) + '</span>') + '</div>' +
          '<div class="ib-title">' + U.esc(U.truncate(b.title, 30)) + '</div>' +
          '<div class="ib-author">' + U.esc(b.author) + '</div>' +
          '</div>';
      }).join("") : '<div style="grid-column:1/-1;color:var(--ink-soft);text-align:center;padding:24px">No matches for this selection yet.</div>';
      // Ghi lý do gợi ý (transparent về logic ranking)
      var reasonEl = wiz.querySelector(".ideal-reason");
      if (!reasonEl) {
        reasonEl = document.createElement("div");
        reasonEl.className = "ideal-reason";
        reasonEl.style.cssText = "font-size:11.5px;color:var(--ink-soft);margin:-4px 0 12px;font-style:italic";
        container.parentNode.insertBefore(reasonEl, container.nextSibling);
      }
      reasonEl.textContent = reason;
      steps.forEach(function (s) { s.classList.remove("active"); });
      result.classList.add("active");
    });

    var restart = wiz.querySelector(".ideal-restart");
    if (restart) restart.addEventListener("click", function () {
      wiz.querySelectorAll(".ideal-choices button").forEach(function (b) { b.classList.remove("active"); });
      wiz.querySelectorAll(".ideal-next, .ideal-submit").forEach(function (b) { b.disabled = true; });
      state.choice = { 1: null, 2: null, 3: null };
      show(1);
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
