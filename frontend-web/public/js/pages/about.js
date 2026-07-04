/* ============================================================
   Librumi — About & Contact (with feedback form — coursework)
   ============================================================ */
(function () {
  "use strict";
  window.Pages = window.Pages || {};

  function statCard(v, label, bg, fg) {
    return '<div data-rev="scale" style="background:' + bg + ';border-radius:var(--r-md);padding:24px 20px">' +
      '<div class="font-head" style="font-weight:800;font-size:30px;color:' + fg + '"><span data-count="' + v + '">0</span></div>' +
      '<div style="font-size:13px;color:' + fg + ';opacity:.75;margin-top:4px">' + U.esc(label) + '</div></div>';
  }

  window.Pages.about = async function () {
    var views = await window.Store.views();
    var html =
    '<section class="wrap section">' +
    '  <div style="max-width:680px" data-rev="left">' +
    '    <span class="eyebrow">About us</span>' +
    '    <h1 class="section-title split-title" style="text-align:left;font-size:46px;margin:8px 0 16px"><span class="linew">A library</span><span class="linew">for everyone.</span></h1>' +
    '    <p style="font-size:18px;line-height:1.7;color:var(--ink-soft)">Librumi is a public digital library on a mission to bring great books closer to the community. We believe borrowing books should be simple, free, and friendly.</p>' +
    '  </div>' +
    '  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:36px" class="about-stats">' +
        statCard(8, "Titles", "rgba(207,224,33,.18)", "#5f6a11") +
        statCard(24, "Copies", "rgba(147,161,99,.2)", "#4c5a2b") +
        statCard(120, "Readers", "rgba(232,115,90,.14)", "#b1442c") +
        statCard(views, "Visits", "rgba(27,58,49,.06)", "#1b3a31") +
    '  </div>' +

    /* ---- Contact ---- */
    '  <div id="contact" style="display:grid;grid-template-columns:0.9fr 1.1fr;gap:44px;align-items:start;margin-top:64px" class="contact-wrap">' +
    '    <div data-rev>' +
    '      <h2 class="section-title split-title" style="text-align:left;font-size:30px"><span class="linew">Get in touch</span></h2>' +
    '      <p style="color:var(--ink-soft);line-height:1.7;margin-top:12px">Have a question, feedback, or a partnership idea? Drop us a few lines — the Librumi team is always listening.</p>' +
    '      <div style="margin-top:20px;line-height:2;color:var(--ink)">📍 123 Book Street, Hanoi<br>✉️ hello@librumi.vn<br>☎️ (024) 1234 5678</div>' +
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
