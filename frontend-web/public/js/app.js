/* ============================================================
   Librumi - App shell & Router (SPA, hash-based, tự viết)
   ============================================================ */
(function () {
  "use strict";
  var $app = document.getElementById("app");
  var $nav = document.getElementById("nav");
  var $footer = document.getElementById("footer");

  /* ---------- Parse hash -> route ---------- */
  function parse() {
    var h = (location.hash || "#/").replace(/^#/, "");
    var qi = h.indexOf("?");
    var pathOnly = qi >= 0 ? h.slice(0, qi) : h;
    var parts = pathOnly.split("/").filter(Boolean);   // ["book","3"] (no query)
    var name = parts[0] || "home";
    return { name: name, params: parts.slice(1), raw: h };
  }

  var ROUTES = {
    home:    function (c) { return window.Pages.home(c); },
    catalog: function (c) { return window.Pages.catalog(c); },
    book:    function (c) { return window.Pages.book(c); },
    login:   function (c) { return window.Pages.auth(c); },
    account: function (c) { return window.Pages.account(c); },
    admin:   function (c) { return window.Pages.admin(c); },
    about:   function (c) { return window.Pages.about(c); }
  };

  /* ---------- Nav ---------- */
  function renderNav() {
    var s = window.Store;
    var right = "";
    if (s.isAdmin())
      right += '<a data-nav="/admin" class="btn-ghost">Admin</a>';
    if (s.isLoggedIn())
      right += '<button data-action="logout" class="btn-lime">' + U.esc(s.user.username) + ' · Log out</button>';
    else
      right += '<button data-nav="/login" class="btn-lime">Sign in</button>';

    $nav.innerHTML =
      '<div class="nav-inner wrap">' +
      '  <nav class="nav-left">' +
      '    <a data-nav="/">Home</a>' +
      '    <a data-nav="/catalog">Catalog</a>' +
      '    <a data-nav="/about">Contact</a>' +
      '  </nav>' +
      '  <a data-nav="/" class="brand">LIBRUMI<span>.</span></a>' +
      '  <div class="nav-right">' +
      '    <a data-nav="/catalog" class="icon-btn" title="Search books" aria-label="Search">' +
      '      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg></a>' +
      '    <a data-nav="' + (s.isLoggedIn() ? "/account" : "/login") + '" class="icon-btn" title="Account" aria-label="Account">' +
      '      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6"/></svg></a>' +
      right +
      '  </div>' +
      '</div>';
  }

  /* ---------- Footer (4 cột + social) ---------- */
  function renderFooter() {
    var socialIcon = function (label, path) {
      return '<a href="#" aria-label="' + label + '" title="' + label + '">' +
        '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + path + '</svg></a>';
    };
    var fb = '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>';
    var ig = '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/>';
    var tw = '<path d="M22 5.9a8 8 0 0 1-2.4.7 4 4 0 0 0 1.8-2.2 8 8 0 0 1-2.6 1 4 4 0 0 0-6.8 3.6A11 11 0 0 1 3 4.6a4 4 0 0 0 1.2 5.3A4 4 0 0 1 2.5 9v.1a4 4 0 0 0 3.2 4 4 4 0 0 1-1.8.07 4 4 0 0 0 3.7 2.8A8 8 0 0 1 2 17.5a11 11 0 0 0 6 1.7c7.2 0 11.2-6 11.2-11.2v-.5A8 8 0 0 0 22 5.9z"/>';
    var yt = '<path d="M22 8.4a2.5 2.5 0 0 0-1.8-1.8C18.6 6 12 6 12 6s-6.6 0-8.2.6A2.5 2.5 0 0 0 2 8.4 26 26 0 0 0 1.5 12c0 1.3.2 2.6.5 3.6a2.5 2.5 0 0 0 1.8 1.8c1.6.6 8.2.6 8.2.6s6.6 0 8.2-.6a2.5 2.5 0 0 0 1.8-1.8c.3-1 .5-2.3.5-3.6a26 26 0 0 0-.5-3.6z"/><path d="m10 15 5-3-5-3z" fill="currentColor"/>';

    $footer.innerHTML =
      '<div class="wrap foot-inner">' +
      '  <div class="foot-col foot-brand">' +
      '    <span class="brand">LIBRUMI<span>.</span></span>' +
      '    <p>A public digital library - borrow good books the easy way, always free and always friendly.</p>' +
      '    <div class="foot-social">' + socialIcon("Facebook", fb) + socialIcon("Instagram", ig) + socialIcon("Twitter", tw) + socialIcon("YouTube", yt) + '</div>' +
      '  </div>' +
      '  <div class="foot-col">' +
      '    <h4>Explore</h4>' +
      '    <a data-nav="/catalog">Catalog</a>' +
      '    <a data-nav="/about">About</a>' +
      '    <a data-nav="/about#contact">Contact</a>' +
      '  </div>' +
      '  <div class="foot-col">' +
      '    <h4>Support</h4>' +
      '    <a data-nav="/login">Sign in</a>' +
      '    <a data-nav="/account">My account</a>' +
      '    <a data-nav="/about#contact">FAQ</a>' +
      '  </div>' +
      '  <div class="foot-col foot-col--hours">' +
      '    <h4>Visit us</h4>' +
      '    <div class="foot-hours">' +
      '      <div><span>Mon - Fri</span>08:00 - 20:00</div>' +
      '      <div><span>Sat</span>09:00 - 18:00</div>' +
      '      <div><span>Sun</span>09:00 - 17:00</div>' +
      '      <div style="margin-top:8px;opacity:.85">C7 · HUST · 1 Dai Co Viet<br>Hai Ba Trung, Hanoi<br>(084) 24 1234 5678</div>' +
      '    </div>' +
      '  </div>' +
      '</div>' +
      '<div class="wrap foot-bottom">© ' + new Date().getFullYear() + ' Librumi - Made with ♥ for readers.</div>';
  }

  /* ---------- Navigate ---------- */
  var navigating = false;
  async function navigate() {
    if (navigating) return; navigating = true;
    var ctx = parse();
    var fn = ROUTES[ctx.name] || ROUTES.home;
    $app.innerHTML = '<div class="page-loading"><span class="spinner"></span></div>';
    try {
      var view = await fn(ctx);
      var html = typeof view === "string" ? view : view.html;
      $app.innerHTML = '<div class="route-fade">' + html + '</div>';
      if (view && view.mount) view.mount($app.querySelector(".route-fade"), ctx);
    } catch (e) {
      console.error(e);
      $app.innerHTML = '<div class="wrap section"><h2 class="font-head">Something went wrong</h2><p>' + U.esc(e.message || "Could not load this page.") + '</p></div>';
    }
    renderNav();
    window.scrollTo(0, 0);
    if (window.Anim) window.Anim.refresh($app);
    navigating = false;
  }

  /* ---------- Global click delegation ---------- */
  document.addEventListener("click", function (e) {
    var nav = e.target.closest("[data-nav]");
    if (nav) {
      e.preventDefault();
      var to = nav.getAttribute("data-nav");
      var hashPart = "";
      var hi = to.indexOf("#");
      if (hi >= 0) { hashPart = to.slice(hi + 1); to = to.slice(0, hi); }
      if (("#" + to) === location.hash || (to === "/" && (location.hash === "" || location.hash === "#/"))) {
        // same page -> just scroll to section if present
        if (hashPart) { var t = document.getElementById(hashPart); if (t) t.scrollIntoView({ behavior: "smooth" }); }
      } else {
        location.hash = "#" + to;
        if (hashPart) window.__scrollTo = hashPart;
      }
      return;
    }
    var act = e.target.closest("[data-action]");
    if (act) {
      var action = act.getAttribute("data-action");
      if (action === "logout") {
        e.preventDefault();
        window.Store.logout().then(function () { U.toast("Signed out."); renderNav(); U.go("/"); });
      }
    }
  });

  window.addEventListener("hashchange", function () {
    navigate().then(function () {
      if (window.__scrollTo) { var t = document.getElementById(window.__scrollTo); if (t) t.scrollIntoView({ behavior: "smooth" }); window.__scrollTo = null; }
    });
  });

  /* ---------- Promotional popup after 1 minute (coursework) + cookie ---------- */
  function schedulePromo() {
    if (U.getCookie("librumi_promo_closed") === "1") return;
    setTimeout(function () { showPromo(); }, 60 * 1000); // exactly after 1 minute
  }
  async function showPromo() {
    if (U.getCookie("librumi_promo_closed") === "1") return;
    var res = await window.Store.books({ featured: 1 });
    var book = (res.items || [])[0]; if (!book) return;
    var root = document.getElementById("modal-root");
    var cov = book.cover || ["#93a163", "#84924f"];
    var coverBg = book.image
      ? "background:#e9e9e4 center/cover no-repeat;background-image:url('" + U.esc(book.image) + "')"
      : "background:linear-gradient(150deg," + cov[0] + "," + cov[1] + ")";
    root.innerHTML =
      '<div class="modal-overlay" data-close-promo>' +
      '  <div class="promo pop-anim" role="dialog" aria-label="Featured book">' +
      '    <button class="promo-x" data-close-promo aria-label="Close">✕</button>' +
      '    <div class="promo-cover" style="' + coverBg + '">' +
      '       <div class="sticker sticker--coral" aria-label="Featured">Feat<br>ured</div>' +
      '       ' + (book.image ? '' : '<span>' + U.esc(book.title) + '</span>') +
      '    </div>' +
      '    <div class="promo-body">' +
      '      <span class="eyebrow">Featured today</span>' +
      '      <h3 class="font-head">' + U.esc(book.title) + '</h3>' +
      '      <p>' + U.esc(U.truncate(book.description, 130)) + '</p>' +
      '      <button class="btn-lime" data-nav="/book/' + book.id + '" data-close-promo-soft>View & borrow now ' + U.arrow("#1b3a31", 18) + '</button>' +
      '    </div>' +
      '  </div>' +
      '</div>';
    root.querySelectorAll("[data-close-promo]").forEach(function (el) {
      el.addEventListener("click", function (ev) {
        if (ev.target.closest("[data-close-promo-soft]")) return;
        U.setCookie("librumi_promo_closed", "1", 30); // do not show again next time
        root.innerHTML = "";
      });
    });
    var goBtn = root.querySelector("[data-close-promo-soft]");
    if (goBtn) goBtn.addEventListener("click", function () { root.innerHTML = ""; });
  }

  /* ---------- Boot ---------- */
  (async function boot() {
    renderFooter();
    await window.Store.init();
    window.Store.bumpView();
    await navigate();
    schedulePromo();
    if (!window.Store.online) {
      U.toast("Preview mode (backend not connected).", "info");
    }
  })();
})();
