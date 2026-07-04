/* ============================================================
   Librumi - Account (reader profile + my loans)
   ============================================================ */
(function () {
  "use strict";
  window.Pages = window.Pages || {};

  window.Pages.account = async function () {
    var s = window.Store;
    if (!s.isLoggedIn()) {
      return { html: '<section class="wrap section" style="text-align:center"><h2 class="section-title">You are not signed in</h2><p class="section-sub">Sign in to view your profile and loans.</p><div style="display:flex;justify-content:center"><button class="btn-lime" data-nav="/login">Sign in</button></div></section>' };
    }
    var u = s.user;
    var loans = [];
    if (s.online) { try { loans = (await window.api.get("/loans/me")).items || []; } catch (e) {} }

    var html =
    '<section class="wrap section">' +
    '  <span class="eyebrow">Hello</span>' +
    '  <h1 class="section-title split-title" style="text-align:left;font-size:38px;margin:6px 0 26px"><span class="linew">' + U.esc(u.username) + '</span></h1>' +
    '  <div style="display:grid;grid-template-columns:1fr 1.2fr;gap:34px;align-items:start" class="acc-wrap">' +
    '    <div class="form-card" data-rev>' +
    '      <h3 class="font-head" style="margin:0 0 4px">Reader profile</h3>' +
    '      <p style="color:var(--ink-soft);font-size:13px;margin:0 0 18px">Complete your profile to be able to request loans.</p>' +
    '      <div class="form-row"><label class="field-lbl">Full name</label><input class="inp" id="pf-name" value="' + U.esc(u.full_name || "") + '"/></div>' +
    '      <div class="form-row"><label class="field-lbl">Library card ID</label><input class="inp" id="pf-card" value="' + U.esc(u.library_card_id || "") + '"/></div>' +
    '      <div class="form-row"><label class="field-lbl">Email</label><input class="inp" id="pf-email" type="email" value="' + U.esc(u.email || "") + '"/></div>' +
    '      <button class="btn-lime" id="pf-save" style="width:100%;justify-content:center;padding:13px">Save profile</button>' +
    '    </div>' +
    '    <div data-rev>' +
    '      <h3 class="font-head" style="margin:0 0 14px">My loans</h3>' +
    '      <div id="loan-list">' +
          (loans.length ? loans.map(loanRow).join("") :
            '<div class="tst-card" style="text-align:center;color:var(--ink-soft)">No loans yet.<br><button class="btn-ghost" data-nav="/catalog" style="margin-top:12px">Find books to borrow</button></div>') +
    '      </div>' +
    '    </div>' +
    '  </div>' +
    '</section>';

    return {
      html: html,
      mount: function (root) {
        root.querySelector("#pf-save").addEventListener("click", async function () {
          var payload = {
            full_name: root.querySelector("#pf-name").value.trim(),
            library_card_id: root.querySelector("#pf-card").value.trim(),
            email: root.querySelector("#pf-email").value.trim()
          };
          if (!payload.full_name || !payload.library_card_id || !payload.email) return U.toast("Fill in all three profile fields.", "error");
          try {
            if (s.online) await window.api.put("/profile", payload);
            Object.assign(u, payload, { profile_complete: true });
            U.toast("Profile saved.", "success");
          } catch (e) { U.toast(e.message, "error"); }
        });
      }
    };
  };

  function loanRow(l) {
    var map = { pending: ["Pending", "#b1442c"], borrowing: ["Borrowing", "#2f7d4f"], returned: ["Returned", "#5c6b62"], overdue: ["Overdue", "#b1442c"], rejected: ["Rejected", "#5c6b62"] };
    var st = map[l.status] || [l.status, "#5c6b62"];
    return '<div class="tst-card" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">' +
      '<div><b>' + U.esc(l.book_title || ("Book #" + l.book_id)) + '</b><div style="font-size:12px;color:var(--ink-soft)">Due: ' + U.date(l.due_date) + '</div></div>' +
      '<span class="badge-stock" style="color:' + st[1] + ';background:rgba(0,0,0,.05)">' + st[0] + '</span></div>';
  }
})();
