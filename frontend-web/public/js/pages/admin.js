/* Trang quản trị: lượt xem, quản lý sách, bình luận, phiếu mượn, liên hệ */
(function () {
  "use strict";
  window.Pages = window.Pages || {};
  var S = function () { return window.Store; };

  /* icon set (stroke, inherits currentColor) */
  var IC = {
    views: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20"/>',
    chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.5A8 8 0 1 1 21 12Z"/>',
    loans: '<path d="M3 8h13l-3-3M21 16H8l3 3"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    alert: '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17h.01"/>',
    box: '<path d="M3 7l9-4 9 4-9 4z"/><path d="M3 7v10l9 4 9-4V7"/><path d="M12 11v10"/>',
    star: '<path d="M12 3l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 18.1 5.9 21.6l1.4-6.8L2.2 10.1l6.9-.8z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>'
  };
  function svg(name, color, size) {
    return '<svg width="' + (size || 20) + '" height="' + (size || 20) + '" viewBox="0 0 24 24" fill="none" stroke="' + (color || "currentColor") + '" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + IC[name] + '</svg>';
  }
  function kpi(icon, tint, color, value, label) {
    return '<div class="kpi" data-rev>' +
      '<div class="kpi-ic" style="background:' + tint + '">' + svg(icon, color, 22) + '</div>' +
      '<div><div class="kpi-num" data-count="' + value + '">0</div><div class="kpi-lbl">' + U.esc(label) + '</div></div></div>';
  }
  function attn(dot, n, label) {
    return '<div class="attn-item"><span class="attn-dot" style="background:' + dot + '"></span>' +
      '<div><div class="attn-num">' + n + '</div><div class="attn-lbl">' + U.esc(label) + '</div></div></div>';
  }
  function spinner() { return '<div class="page-loading" style="min-height:160px"><span class="spinner"></span></div>'; }
  function offlineNote() { return '<div class="admin-panel" style="padding:26px;color:var(--ink-soft)">Admin management needs the backend running (currently preview mode).</div>'; }

  window.Pages.admin = async function () {
    var s = S();
    if (!s.isAdmin()) {
      return { html: '<section class="wrap section" style="text-align:center"><h2 class="section-title">Admin area</h2><p class="section-sub">You need to sign in with an admin account (demo: admin/admin123).</p><div style="display:flex;justify-content:center"><button class="btn-lime" data-nav="/login">Sign in as admin</button></div></section>' };
    }

    var summary = { view_count: 0, total_books: 0, total_comments: 0, total_loans: 0, needs_attention: {} };
    if (s.online) { try { summary = await window.api.get("/admin/summary"); } catch (e) {} }
    else {
      var res = await s.books({});
      summary = { view_count: await s.views(), total_books: res.total, total_comments: 2, total_loans: 0, needs_attention: { pending_loans: 0, overdue_loans: 0, out_of_stock_books: 0, new_reviews: 2 } };
    }
    var na = summary.needs_attention || {};

    var navItem = function (tab, icon, label) {
      return '<button class="admin-navbtn" data-tab="' + tab + '">' + svg(icon, "currentColor", 19) + '<span>' + label + '</span></button>';
    };

    var html =
    '<section class="wrap section">' +
    '  <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:16px;flex-wrap:wrap;margin-bottom:26px" data-rev>' +
    '    <div><span class="eyebrow">Dashboard</span>' +
    '      <h1 class="section-title" style="text-align:left;font-size:34px;margin:6px 0 0">Librumi admin</h1></div>' +
    '    <div style="font-size:13.5px;color:var(--ink-soft)">Signed in as <b>' + U.esc(s.user.username) + '</b></div>' +
    '  </div>' +

    /* KPI row */
    '  <div class="kpi-grid stagger">' +
        kpi("views", "rgba(207,224,33,.22)", "#5f6a11", summary.view_count || 0, "Total site views") +
        kpi("book",  "rgba(147,161,99,.22)", "#4c5a2b", summary.total_books || 0, "Titles") +
        kpi("chat",  "rgba(232,115,90,.16)", "#b1442c", summary.total_comments || 0, "Comments") +
        kpi("loans", "rgba(74,108,140,.16)", "#35506b", summary.total_loans || 0, "Loans") +
    '  </div>' +

    /* needs attention strip */
    '  <div class="attn" data-rev>' +
        attn("#e8735a", na.pending_loans || 0, "Pending") +
        attn("#b1442c", na.overdue_loans || 0, "Overdue") +
        attn("#b9852f", na.out_of_stock_books || 0, "Out of stock") +
        attn("#b9cc17", na.new_reviews || 0, "New reviews") +
    '  </div>' +

    /* management: sidebar + content */
    '  <div class="admin-work">' +
    '    <aside class="admin-side">' +
    '      <div class="admin-side-h">Manage</div>' +
          navItem("books", "book", "Books") + navItem("comments", "chat", "Comments") +
          navItem("loans", "loans", "Loans") + navItem("contacts", "mail", "Contacts") +
    '    </aside>' +
    '    <div class="admin-content" id="admin-panel"></div>' +
    '  </div>' +
    '</section>';

    return {
      html: html,
      mount: function (root) {
        var panel = root.querySelector("#admin-panel");
        var loaders = { books: booksPanel, comments: commentsPanel, loans: loansPanel, contacts: contactsPanel };
        function open(tab) {
          root.querySelectorAll(".admin-navbtn").forEach(function (c) { c.classList.toggle("active", c.getAttribute("data-tab") === tab); });
          panel.innerHTML = spinner();
          (loaders[tab] || booksPanel)(panel);
        }
        root.querySelectorAll(".admin-navbtn").forEach(function (btn) {
          btn.addEventListener("click", function () { open(btn.getAttribute("data-tab")); });
        });
        open("books");
      }
    };
  };

  /* BOOKS */
  async function booksPanel(panel) {
    if (!S().online) return void (panel.innerHTML = offlineNote());
    var books = await S().adminBooks();
    panel.innerHTML =
      '<div class="admin-panel"><div class="admin-panel-head"><h3>Books <span class="cnt">' + books.length + '</span></h3>' +
      '<button class="btn-lime" id="ab-add">+ Add book</button></div>' +
      '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Title</th><th>Author</th><th>Category</th><th>Stock</th><th>Featured</th><th></th></tr></thead><tbody>' +
      books.map(function (b) {
        return '<tr data-id="' + b.id + '"><td><b>' + U.esc(b.title) + '</b></td><td>' + U.esc(b.author) + '</td><td>' + U.esc(b.category) + '</td>' +
          '<td><b>' + b.stock + '</b><span style="color:var(--ink-soft)">/' + b.total_stock + '</span></td><td>' + (b.featured ? '<span class="st-tag st-borrowing">Yes</span>' : '<span style="color:var(--ink-soft)">-</span>') + '</td>' +
          '<td><div class="tbl-actions"><button class="btn-xs" data-edit>Edit</button><button class="btn-xs danger" data-del>Delete</button></div></td></tr>';
      }).join("") +
      '</tbody></table></div></div>';

    panel.querySelector("#ab-add").addEventListener("click", function () { bookForm(null, function () { booksPanel(panel); }); });
    panel.querySelectorAll("tr[data-id]").forEach(function (tr) {
      var id = tr.getAttribute("data-id");
      tr.querySelector("[data-edit]").addEventListener("click", function () {
        var b = books.find(function (x) { return x.id == id; });
        bookForm(b, function () { booksPanel(panel); });
      });
      tr.querySelector("[data-del]").addEventListener("click", function () {
        confirmModal("Delete this book?", "This removes the book, its copies and comments.", async function (close) {
          try { await S().deleteBook(id); close(); U.toast("Book deleted.", "success"); booksPanel(panel); }
          catch (e) { U.toast(e.message, "error"); }
        });
      });
    });
    window.Anim.refresh(panel);
  }

  function bookForm(b, onDone) {
    var isEdit = !!b;
    U.modal(
      '<h3>' + (isEdit ? "Edit book" : "Add a book") + '</h3>' +
      row("Title", '<input class="inp" id="bf-title" value="' + U.esc(b ? b.title : "") + '">') +
      row("Author", '<input class="inp" id="bf-author" value="' + U.esc(b ? b.author : "") + '">') +
      row("Category", '<input class="inp" id="bf-cat" value="' + U.esc(b ? b.category : "") + '">') +
      '<div style="display:flex;gap:12px">' +
        '<div class="form-row" style="flex:1">' + lbl("Total stock") + '<input class="inp" id="bf-stock" type="number" min="0" value="' + (b ? b.total_stock : 1) + '"></div>' +
        '<div class="form-row" style="flex:1;display:flex;flex-direction:column">' + lbl("Featured") + '<label style="display:flex;align-items:center;gap:8px;height:44px"><input type="checkbox" id="bf-feat"' + (b && b.featured ? " checked" : "") + '> Show in featured</label></div>' +
      '</div>' +
      row("Cover image URL (optional)", '<input class="inp" id="bf-img" value="' + U.esc(b ? (b.image || "") : "") + '">') +
      row("Description", '<textarea class="inp" id="bf-desc" rows="3">' + U.esc(b ? (b.description || "") : "") + '</textarea>') +
      '<button class="btn-lime" id="bf-save" style="width:100%;justify-content:center;padding:13px">' + (isEdit ? "Save changes" : "Create book") + '</button>',
      { wide: true, mount: function (card, close) {
        var saveBtn = card.querySelector("#bf-save");
        var saving = false;
        saveBtn.addEventListener("click", async function () {
          if (saving) return;
          var payload = {
            title: card.querySelector("#bf-title").value.trim(),
            author: card.querySelector("#bf-author").value.trim(),
            category: card.querySelector("#bf-cat").value.trim(),
            total_stock: parseInt(card.querySelector("#bf-stock").value, 10) || 0,
            featured: card.querySelector("#bf-feat").checked,
            image: card.querySelector("#bf-img").value.trim(),
            description: card.querySelector("#bf-desc").value.trim()
          };
          if (!payload.title || !payload.author || !payload.category) return U.toast("Title, author and category are required.", "error");
          saving = true;
          saveBtn.disabled = true;
          var savedLabel = saveBtn.textContent;
          saveBtn.textContent = "Saving…";
          try {
            if (isEdit) await S().updateBook(b.id, payload); else await S().createBook(payload);
            close(); U.toast(isEdit ? "Book updated." : "Book created.", "success"); onDone && onDone();
          } catch (e) {
            U.toast(e.message, "error");
            saving = false;
            saveBtn.disabled = false;
            saveBtn.textContent = savedLabel;
          }
        });
      } }
    );
  }

  /* COMMENTS */
  async function commentsPanel(panel) {
    if (!S().online) return void (panel.innerHTML = offlineNote());
    var items = await S().adminComments();
    panel.innerHTML =
      '<div class="admin-panel"><div class="admin-panel-head"><h3>Comments <span class="cnt">' + items.length + '</span></h3></div>' +
      '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Book</th><th>Name</th><th>Rating</th><th>Content</th><th>Status</th><th></th></tr></thead><tbody>' +
      (items.length ? items.map(function (c) {
        return '<tr data-id="' + c.id + '"><td>' + U.esc(U.truncate(c.book_title || "", 22)) + '</td><td>' + U.esc(c.name) + '</td>' +
          '<td style="color:#e8b23a">' + "★".repeat(c.rating) + '</td><td>' + U.esc(U.truncate(c.content, 60)) + '</td>' +
          '<td><span class="st-tag ' + (c.hidden ? "st-rejected" : "st-borrowing") + '">' + (c.hidden ? "Hidden" : "Public") + '</span></td>' +
          '<td><div class="tbl-actions"><button class="btn-xs" data-vis>' + (c.hidden ? "Show" : "Hide") + '</button><button class="btn-xs danger" data-del>Delete</button></div></td></tr>';
      }).join("") : '<tr><td colspan="6" class="tbl-empty">No comments yet.</td></tr>') +
      '</tbody></table></div></div>';

    panel.querySelectorAll("tr[data-id]").forEach(function (tr) {
      var id = tr.getAttribute("data-id");
      var c = items.find(function (x) { return x.id == id; });
      tr.querySelector("[data-vis]").addEventListener("click", async function () {
        try { await S().setCommentVisibility(id, !c.hidden); U.toast("Visibility updated.", "success"); commentsPanel(panel); }
        catch (e) { U.toast(e.message, "error"); }
      });
      tr.querySelector("[data-del]").addEventListener("click", function () {
        confirmModal("Delete this comment?", "This cannot be undone.", async function (close) {
          try { await S().deleteComment(id); close(); U.toast("Comment deleted.", "success"); commentsPanel(panel); }
          catch (e) { U.toast(e.message, "error"); }
        });
      });
    });
  }

  /* LOANS */
  async function loansPanel(panel) {
    if (!S().online) return void (panel.innerHTML = offlineNote());
    var items = await S().adminLoans();
    panel.innerHTML =
      '<div class="admin-panel"><div class="admin-panel-head"><h3>Loans <span class="cnt">' + items.length + '</span></h3></div>' +
      '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Book</th><th>Borrower</th><th>Card ID</th><th>Due</th><th>Status</th><th></th></tr></thead><tbody>' +
      (items.length ? items.map(function (l) {
        var actions = "";
        if (l.status === "pending") actions = '<button class="btn-xs ok" data-approve>Approve</button><button class="btn-xs danger" data-reject>Reject</button>';
        else if (l.status === "borrowing" || l.status === "overdue") actions = '<button class="btn-xs ok" data-return>Mark returned</button>';
        else actions = '<button class="btn-xs danger" data-del>Delete</button>';
        return '<tr data-id="' + l.id + '"><td><b>' + U.esc(l.book_title || ("#" + l.book_id)) + '</b></td><td>' + U.esc(l.borrower_name || "") + '</td>' +
          '<td>' + U.esc(l.library_card_id || "—") + '</td>' +
          '<td>' + U.date(l.due_date) + '</td><td><span class="st-tag st-' + l.status + '">' + l.status + '</span></td>' +
          '<td><div class="tbl-actions">' + actions + '</div></td></tr>';
      }).join("") : '<tr><td colspan="6" class="tbl-empty">No loans yet.</td></tr>') +
      '</tbody></table></div></div>';

    panel.querySelectorAll("tr[data-id]").forEach(function (tr) {
      var id = tr.getAttribute("data-id");
      var act = async function (status, reason) {
        try { await S().setLoanStatus(id, status, reason); U.toast("Loan updated.", "success"); loansPanel(panel); }
        catch (e) { U.toast(e.message, "error"); }
      };
      var ap = tr.querySelector("[data-approve]"); if (ap) ap.addEventListener("click", function () { act("approved"); });
      var rt = tr.querySelector("[data-return]"); if (rt) rt.addEventListener("click", function () { act("returned"); });
      var rj = tr.querySelector("[data-reject]"); if (rj) rj.addEventListener("click", function () {
        U.modal('<h3>Reject request</h3>' + row("Reason (optional)", '<input class="inp" id="rj-reason" placeholder="e.g. copy reserved">') +
          '<button class="btn-lime" id="rj-ok" style="width:100%;justify-content:center;padding:13px">Reject</button>',
          { mount: function (card, close) { card.querySelector("#rj-ok").addEventListener("click", function () { close(); act("rejected", card.querySelector("#rj-reason").value.trim()); }); } });
      });
      var dl = tr.querySelector("[data-del]"); if (dl) dl.addEventListener("click", function () {
        confirmModal("Delete this loan record?", "", async function (close) {
          try { await S().deleteLoan(id); close(); U.toast("Loan deleted.", "success"); loansPanel(panel); }
          catch (e) { U.toast(e.message, "error"); }
        });
      });
    });
  }

  /* CONTACTS */
  async function contactsPanel(panel) {
    if (!S().online) return void (panel.innerHTML = offlineNote());
    var items = await S().adminContacts();
    panel.innerHTML =
      '<div class="admin-panel"><div class="admin-panel-head"><h3>Contact messages <span class="cnt">' + items.length + '</span></h3></div>' +
      '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Name</th><th>Email</th><th>Subject</th><th>Message</th><th>Date</th></tr></thead><tbody>' +
      (items.length ? items.map(function (c) {
        return '<tr><td><b>' + U.esc(c.name) + '</b></td><td>' + U.esc(c.email) + '</td><td><span class="st-tag st-returned">' + U.esc(c.subject) + '</span></td>' +
          '<td>' + U.esc(U.truncate(c.message, 70)) + '</td><td>' + U.date(c.created_at) + '</td></tr>';
      }).join("") : '<tr><td colspan="5" class="tbl-empty">No messages yet.</td></tr>') +
      '</tbody></table></div></div>';
  }

  /* helpers */
  function lbl(t) { return '<label class="field-lbl">' + U.esc(t) + '</label>'; }
  function row(label, field) { return '<div class="form-row">' + lbl(label) + field + '</div>'; }
  function confirmModal(title, body, onYes) {
    U.modal('<h3>' + U.esc(title) + '</h3>' + (body ? '<p style="color:var(--ink-soft);margin:0 0 18px">' + U.esc(body) + '</p>' : '') +
      '<div style="display:flex;gap:10px"><button class="btn-ghost" id="cf-no" style="flex:1;justify-content:center">Cancel</button><button class="btn-lime" id="cf-yes" style="flex:1;justify-content:center;padding:12px">Confirm</button></div>',
      { mount: function (card, close) {
        card.querySelector("#cf-no").addEventListener("click", close);
        card.querySelector("#cf-yes").addEventListener("click", function () { onYes(close); });
      } });
  }
})();
