/* Trang Giới thiệu & Liên hệ (kèm form góp ý) */
(function () {
  "use strict";
  window.Pages = window.Pages || {};

  function statCard(v, label, bg, fg) {
    return '<div data-rev="scale" style="background:' + bg + ';border-radius:var(--r-md);padding:24px 20px">' +
      '<div class="font-head" style="font-weight:800;font-size:30px;color:' + fg + '"><span data-count="' + v + '">0</span></div>' +
      '<div style="font-size:13px;color:' + fg + ';opacity:.75;margin-top:4px">' + U.esc(label) + '</div></div>';
  }

  window.Pages.about = async function () {
    var s = await window.Store.statsSummary();
    var html =
    '<section class="wrap section">' +
    '  <div style="max-width:680px" data-rev="left">' +
    '    <span class="eyebrow">About us</span>' +
    '    <h1 class="section-title split-title" style="text-align:left;font-size:46px;margin:8px 0 16px"><span class="linew">A library</span><span class="linew">for everyone.</span></h1>' +
    '    <p style="font-size:18px;line-height:1.7;color:var(--ink-soft)">Librumi is a public digital library on a mission to bring great books closer to the community. We believe borrowing books should be simple, free, and friendly.</p>' +
    '  </div>' +
    '  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:36px" class="about-stats">' +
        statCard(s.total_books, "Titles", "rgba(207,224,33,.18)", "#5f6a11") +
        statCard(s.total_copies, "Copies", "rgba(147,161,99,.2)", "#4c5a2b") +
        statCard(s.total_reviews, "Reviews", "rgba(232,115,90,.14)", "#b1442c") +
        statCard(s.view_count, "Visits", "rgba(27,58,49,.06)", "#1b3a31") +
    '  </div>' +

    /* ---- Contact ---- */
    '  <div id="contact" style="display:grid;grid-template-columns:0.9fr 1.1fr;gap:44px;align-items:start;margin-top:64px" class="contact-wrap">' +
    '    <div data-rev>' +
    '      <h2 class="section-title split-title" style="text-align:left;font-size:30px"><span class="linew">Get in touch</span></h2>' +
    '      <p style="color:var(--ink-soft);line-height:1.7;margin-top:12px">Have a question, feedback, or a partnership idea? Drop us a few lines - the Librumi team is always listening.</p>' +
    '      <ul class="contact-lines" style="list-style:none;padding:0;margin:22px 0 0;display:flex;flex-direction:column;gap:12px;color:var(--ink)">' +
    '        <li style="display:flex;align-items:center;gap:12px">' +
    '          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>' +
    '          <span>C7 Building · Hanoi University of Science and Technology · 1 Dai Co Viet, Hai Ba Trung, Hanoi</span></li>' +
    '        <li style="display:flex;align-items:center;gap:12px">' +
    '          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>' +
    '          <a href="mailto:hello@librumi.vn" style="color:inherit;text-decoration:none">hello@librumi.vn</a></li>' +
    '        <li style="display:flex;align-items:center;gap:12px">' +
    '          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>' +
    '          <span>(084) 24 1234 5678</span></li>' +
    '      </ul>' +

    /* ---- Opening hours ---- */
    '      <div class="hours-card" data-rev style="margin-top:22px">' +
    '        <h4>Opening hours</h4>' +
    '        <div class="hours-row"><span class="hd">Mon - Fri</span><span class="ht">08:00 - 20:00</span></div>' +
    '        <div class="hours-row"><span class="hd">Saturday</span><span class="ht">09:00 - 18:00</span></div>' +
    '        <div class="hours-row"><span class="hd">Sunday</span><span class="ht">09:00 - 17:00</span></div>' +
    '        <div class="hours-row closed"><span class="hd">Public holidays</span><span class="ht">Closed</span></div>' +
    '      </div>' +

    /* ---- Real map via OpenStreetMap embed (HUST - C7 building) ---- */
    '      <div class="real-map" data-rev style="margin-top:18px">' +
    '        <iframe title="Librumi location map" loading="lazy" src="https://www.openstreetmap.org/export/embed.html?bbox=105.8410%2C21.0025%2C105.8490%2C21.0085&amp;layer=mapnik&amp;marker=21.0055%2C105.8455"></iframe>' +
    '        <div class="rm-label">' +
    '          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>' +
    '          Librumi · C7 Building · HUST' +
    '        </div>' +
    '      </div>' +
    '    </div>' +
    '    <div class="form-card" data-rev>' +
    '      <div class="form-row"><label class="field-lbl">Full name</label><input class="inp" id="ct-name"/></div>' +
    '      <div class="form-row"><label class="field-lbl">Email</label><input class="inp" id="ct-email" type="email"/></div>' +
    '      <div class="form-row"><label class="field-lbl">Subject</label><select class="inp" id="ct-subject"><option value="general">General question</option><option value="feedback">Feedback</option><option value="partner">Partnership</option></select></div>' +
    '      <div class="form-row"><label class="field-lbl">Message</label><textarea class="inp" id="ct-message" rows="4"></textarea></div>' +
    '      <button class="btn-lime" id="ct-send" style="width:100%;justify-content:center;padding:13px">Send message</button>' +
    '    </div>' +
    '  </div>' +
    '</section>';

    return {
      html: html,
      mount: function (root) {
        root.querySelector("#ct-send").addEventListener("click", async function () {
          var name = root.querySelector("#ct-name").value.trim();
          var email = root.querySelector("#ct-email").value.trim();
          var msg = root.querySelector("#ct-message").value.trim();
          if (!name || !email || !msg) return U.toast("Fill in your name, email and message.", "error");
          if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return U.toast("Invalid email.", "error");
          try {
            await window.Store.contact({ name: name, email: email, subject: root.querySelector("#ct-subject").value, message: msg });
            U.toast("Thanks! We have received your message.", "success");
            root.querySelector("#ct-name").value = ""; root.querySelector("#ct-email").value = ""; root.querySelector("#ct-message").value = "";
          } catch (e) { U.toast(e.message, "error"); }
        });
      }
    };
  };
})();
