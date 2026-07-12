/* Trang chi tiết sách (theo id) + bình luận/đánh giá */
(function () {
  "use strict";
  window.Pages = window.Pages || {};

  function openBorrowModal(b) {
    U.modal(
      '<h3>Borrow &ldquo;' + U.esc(b.title) + '&rdquo;</h3>' +
      '<p style="color:var(--ink-soft);margin:0 0 18px">Choose a return date. Your request will be sent to the library for approval.</p>' +
      '<div class="form-row"><label class="field-lbl">Return by</label><input class="inp" type="date" id="bm-due" min="' + U.addDays(1) + '" value="' + U.addDays(14) + '"></div>' +
      '<button class="btn-lime" id="bm-confirm" style="width:100%;justify-content:center;padding:13px">Send request</button>',
      { mount: function (card, close) {
        card.querySelector("#bm-confirm").addEventListener("click", async function () {
          var due = card.querySelector("#bm-due").value;
          if (!due) return U.toast("Please choose a return date.", "error");
          try {
            await window.Store.requestLoan(b.id, due);
            close();
            U.toast("Borrow request sent - awaiting admin approval.", "success");
          } catch (e) {
            U.toast(e.message, "error");
            if (e.status === 403 && /profile/i.test(e.message)) { close(); U.go("/account"); }
          }
        });
      } }
    );
  }

  function cover(b) {
    if (b.image) return "background:#e9e9e4 center/cover no-repeat;background-image:url('" + U.esc(b.image) + "')";
    var c = b.cover || ["#93a163", "#84924f"];
    return "background:linear-gradient(150deg," + c[0] + "," + c[1] + ")";
  }

  function relatedCard(b) {
    var inStock = (b.stock || 0) > 0;
    return '<article class="book-card" data-nav="/book/' + b.id + '">' +
      '  <div class="book-cover" style="' + cover(b) + '">' +
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

  function commentItem(c) {
    return '<div class="tst-card" data-rev style="margin-bottom:14px">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px">' +
      '<div class="tst-who">' + U.esc(c.name) + '</div>' + U.stars(c.rating, 15) + '</div>' +
      '<p style="margin:10px 0 6px">' + U.esc(c.content) + '</p>' +
      '<div style="font-size:12px;color:var(--ink-soft)">' + U.date(c.created_at) + '</div></div>';
  }

  window.Pages.book = async function (ctx) {
    var id = ctx.params[0];
    var b = await window.Store.book(id);
    if (!b) return { html: '<div class="wrap section"><h2 class="font-head">Book not found</h2><a class="btn-ghost" data-nav="/catalog">← Back to catalog</a></div>' };
    var cRes = await window.Store.comments(id);
    var comments = cRes.items || [];
    var inStock = (b.stock || 0) > 0;
    // Related books (same category, excluding current)
    var related = [];
    try {
      var relRes = await window.Store.books({ category: b.category });
      related = (relRes.items || []).filter(function (x) { return String(x.id) !== String(b.id); }).slice(0, 8);
    } catch (e) {}
    // Rating average from comments
    var ratingAvg = comments.length
      ? (comments.reduce(function (s, c) { return s + (c.rating || 0); }, 0) / comments.length)
      : (b.rating || 0);
    var ratingRound = Math.round(ratingAvg * 10) / 10;

    var html =
    '<section class="wrap" style="padding-top:28px">' +
    '  <a class="btn-ghost" data-nav="/catalog" style="margin-bottom:22px">← Catalog</a>' +
    '  <div style="display:grid;grid-template-columns:0.9fr 1.3fr;gap:44px;align-items:start;margin-top:14px">' +
    '    <div class="book-cover" data-rev="left" style="' + cover(b) + ';aspect-ratio:3/4;border-radius:var(--r-lg);align-items:flex-end;padding:22px">' +
          (b.image ? '' : '<span class="ct" style="font-size:26px">' + U.esc(b.title) + '</span>') + '</div>' +
    '    <div data-rev>' +
    '      <span class="eyebrow">' + U.esc(b.category) + '</span>' +
    '      <h1 class="section-title" style="text-align:left;font-size:40px;margin:8px 0 6px">' + U.esc(b.title) + '</h1>' +
    '      <div style="color:var(--ink-soft);font-size:17px;margin-bottom:8px">by <b>' + U.esc(b.author) + '</b>' + (b.year ? ' · ' + b.year : '') + '</div>' +
    '      <div class="book-rating-badge" data-rev>' +
    '        <div class="brb-num">' + ratingRound.toFixed(1) + '</div>' +
    '        <div class="brb-meta">' +
    '          <div class="brb-stars">★★★★★</div>' +
    '          <div class="brb-lbl">Based on ' + comments.length + ' review' + (comments.length === 1 ? '' : 's') + '</div>' +
    '        </div>' +
    '        <span class="badge-stock ' + (inStock ? "badge-in" : "badge-out") + '" style="margin-left:12px">' + (inStock ? b.stock + " copies available" : "Out of stock") + '</span>' +
    '      </div>' +
    '      <p style="line-height:1.7;font-size:16px;max-width:560px">' + U.esc(b.description) + '</p>' +
    '      <div style="display:flex;gap:12px;margin-top:24px;align-items:center;flex-wrap:wrap">' +
          (window.Store.isAdmin()
            ? '<span class="badge-stock badge-out" style="padding:11px 16px">Admins manage the library and can\'t borrow books.</span>'
            : '<button class="btn-dark" id="borrow-btn" data-magnetic="0.25"' + (inStock ? "" : " disabled style=\"opacity:.5;cursor:not-allowed\"") + '>' + (inStock ? "Request to borrow" : "Out of stock") + '</button>') +
    '        <button class="btn-ghost" data-nav="/catalog">More books</button>' +
    '      </div>' +
    '    </div>' +
    '  </div>' +

    /* Reviews */
    '  <div style="margin-top:56px;display:grid;grid-template-columns:1fr 1fr;gap:44px;align-items:start" class="reviews-wrap">' +
    '    <div>' +
    '      <h2 class="section-title split-title" style="text-align:left;font-size:28px"><span class="linew">Comments & ratings</span></h2>' +
    '      <div id="comment-list" style="margin-top:20px">' +
            (comments.length ? comments.map(commentItem).join("") : '<p style="color:var(--ink-soft)">No comments yet. Be the first!</p>') +
    '      </div>' +
    '    </div>' +
    '    <div class="form-card" data-rev>' +
    '      <h3 class="font-head" style="margin:0 0 4px">Write a review</h3>' +
    '      <p style="color:var(--ink-soft);font-size:13.5px;margin:0 0 18px">Content must be at least 100 characters.</p>' +
    '      <div class="form-row"><label class="field-lbl">Your name</label><input class="inp" id="rv-name"/></div>' +
    '      <div class="form-row"><label class="field-lbl">Email</label><input class="inp" id="rv-email" type="email"/></div>' +
    '      <div class="form-row"><label class="field-lbl">Rating</label><div id="rv-stars" class="rate-pick" style="display:flex;gap:6px;font-size:26px;cursor:pointer;color:#c9cdc7">' +
            "★★★★★".split("").map(function (_, i) { return '<span data-star="' + (i + 1) + '">★</span>'; }).join("") + '</div></div>' +
    '      <div class="form-row"><label class="field-lbl">Content</label><textarea class="inp" id="rv-content" rows="4"></textarea>' +
    '        <div style="font-size:12px;color:var(--ink-soft);margin-top:4px"><span id="rv-count">0</span>/100</div></div>' +
    '      <button class="btn-lime" id="rv-submit" style="width:100%;justify-content:center;padding:13px">Submit review</button>' +
    '    </div>' +
    '  </div>' +

    /* CROSS-SELL: sách cùng thể loại */
    (related.length ?
      '  <div class="carousel-wrap" data-rev style="margin-top:60px">' +
      '    <div class="carousel-head">' +
      '      <div>' +
      '        <span class="eyebrow">Same category</span>' +
      '        <h2 class="section-title" style="text-align:left;font-size:30px;margin:6px 0 0">More in <span class="hl">' + U.esc(b.category) + '</span></h2>' +
      '      </div>' +
      '      <div class="carousel-nav">' +
      '        <button class="carousel-arrow" data-carousel="prev" aria-label="Scroll left">←</button>' +
      '        <button class="carousel-arrow" data-carousel="next" aria-label="Scroll right">→</button>' +
      '      </div>' +
      '    </div>' +
      '    <div class="book-carousel" id="related-carousel">' + related.map(relatedCard).join("") + '</div>' +
      '  </div>' : '') +
    '</section>';

    return {
      html: html,
      mount: function (root) {
        // borrow
        var borrow = root.querySelector("#borrow-btn");
        if (borrow && !borrow.disabled) borrow.addEventListener("click", function () {
          if (!window.Store.isLoggedIn()) { U.toast("Please sign in to borrow books.", "info"); U.go("/login"); return; }
          openBorrowModal(b);
        });
        // star picker
        var rating = 0;
        var stars = root.querySelectorAll("#rv-stars span");
        function paint(n) { stars.forEach(function (s, i) { s.style.color = i < n ? "#e8b23a" : "#c9cdc7"; }); }
        stars.forEach(function (s) {
          s.addEventListener("mouseenter", function () { paint(+s.getAttribute("data-star")); });
          s.addEventListener("click", function () { rating = +s.getAttribute("data-star"); paint(rating); });
        });
        root.querySelector("#rv-stars").addEventListener("mouseleave", function () { paint(rating); });
        // char count
        var content = root.querySelector("#rv-content");
        var count = root.querySelector("#rv-count");
        content.addEventListener("input", function () { count.textContent = content.value.trim().length; });
        // Cross-sell carousel arrows
        var relCarousel = root.querySelector("#related-carousel");
        if (relCarousel) {
          var relPrev = root.querySelector('[data-carousel="prev"]');
          var relNext = root.querySelector('[data-carousel="next"]');
          function updateRelArrows() {
            var atStart = relCarousel.scrollLeft < 4;
            var atEnd = relCarousel.scrollLeft + relCarousel.clientWidth >= relCarousel.scrollWidth - 4;
            if (relPrev) relPrev.disabled = atStart;
            if (relNext) relNext.disabled = atEnd;
          }
          if (relPrev) relPrev.addEventListener("click", function () { relCarousel.scrollBy({ left: -relCarousel.clientWidth * 0.85, behavior: "smooth" }); });
          if (relNext) relNext.addEventListener("click", function () { relCarousel.scrollBy({ left: relCarousel.clientWidth * 0.85, behavior: "smooth" }); });
          relCarousel.addEventListener("scroll", updateRelArrows);
          window.addEventListener("resize", updateRelArrows);
          setTimeout(updateRelArrows, 60);
        }
        // submit
        root.querySelector("#rv-submit").addEventListener("click", async function () {
          var name = root.querySelector("#rv-name").value.trim();
          var email = root.querySelector("#rv-email").value.trim();
          var text = content.value.trim();
          if (!name || !email) return U.toast("Enter your name and email.", "error");
          if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return U.toast("Invalid email.", "error");
          if (!rating) return U.toast("Pick a star rating.", "error");
          if (text.length < 100) return U.toast("Content must be at least 100 characters (currently " + text.length + ").", "error");
          try {
            var c = await window.Store.addComment(id, { name: name, email: email, content: text, rating: rating });
            var list = root.querySelector("#comment-list");
            if (list.querySelector("p")) list.innerHTML = "";
            list.insertAdjacentHTML("afterbegin", commentItem(c));
            window.Anim.refresh(list);
            root.querySelector("#rv-name").value = ""; root.querySelector("#rv-email").value = "";
            content.value = ""; count.textContent = "0"; rating = 0; paint(0);
            U.toast("Thanks! Your review is now public.", "success");
          } catch (e) { U.toast(e.message, "error"); }
        });
      }
    };
  };
})();
