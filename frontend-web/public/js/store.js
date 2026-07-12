/* Store: state phía client + lớp dữ liệu (API thật, hoặc mock khi offline) */
(function () {
  "use strict";

  /*Mock data (preview only, used when offline) */
  var COVERS = [
    ["#93a163", "#84924f"], ["#e8735a", "#c9553d"], ["#4a6c8c", "#35506b"],
    ["#b9852f", "#8a611f"], ["#6b7a8f", "#4c5766"], ["#a0553f", "#7d3f2d"],
    ["#527a5b", "#3b5a42"], ["#8a6d9e", "#664f78"]
  ];
  function mkBook(i, t, a, cat, desc, stock, feat) {
    return {
      id: i, title: t, author: a, category: cat, description: desc,
      image: "", cover: COVERS[i % COVERS.length],
      total_stock: stock, stock: stock, borrow_count: (i * 7) % 40,
      featured: feat ? 1 : 0, year: 2015 + (i % 9), rating: 4 + ((i * 3) % 10) / 10
    };
  }
  var MOCK_BOOKS = [
    mkBook(1, "The Quiet Library", "Mara Ellison", "Fiction", "A tender novel about slow afternoons in a public library and the lives that cross over its pages.", 4, true),
    mkBook(2, "Roots & Recipes", "Do Lan Huong", "Cooking", "A family food journey across three generations, with recipes lovingly kept and passed down.", 3, false),
    mkBook(3, "Signals in the Dark", "R. Okonkwo", "Sci-Fi", "When a strange signal echoes back from the Kuiper belt, humanity has to redefine what 'home' means.", 2, true),
    mkBook(4, "Small Habits, Big Calm", "J. Andersen", "Self-help", "A practical guide to building tiny habits for a calmer, steadier mind every day.", 5, false),
    mkBook(5, "The Cartographer's Daughter", "Lucia Ferro", "Fiction", "A story about an unfinished map and the daughter who sets out to complete her father's journey.", 3, false),
    mkBook(6, "Green City", "Team Habitat", "Science", "An optimistic, well-grounded look at the green cities of the coming decade.", 2, true),
    mkBook(7, "Letters to the Moon", "Ha-eun Kim", "Poetry", "A modern poetry collection about distance, light, and coming home.", 6, false),
    mkBook(8, "The Debugging Mind", "P. S. Rao", "Technology", "Not just about code - about thinking systematically when everything seems to make no sense.", 4, false)
  ];
  var MOCK_COMMENTS = {
    1: [
      { id: 1, name: "Lena N.", email: "l@x.com", content: "A book that makes me want to return to the library every weekend. Warm prose, lovely imagery, and a pace that's just right to feel at peace.", rating: 5, created_at: "2026-06-20" },
      { id: 2, name: "Martin T.", email: "m@x.com", content: "The plot is gentle but the aftertaste lingers for a long time, especially the passages describing quiet afternoons in the old library.", rating: 4, created_at: "2026-06-22" }
    ]
  };

  /* Store */
  var Store = {
    online: false,
    user: null,                 // { id, username, role, profile_complete, account_status, ... }
    _catalog: MOCK_BOOKS.slice(),

    async init() {
      this.online = await window.api.ping();
      if (this.online) { try { await this.refreshMe(); } catch (e) {} }
    },

    isAdmin: function () { return this.user && this.user.role === "admin"; },
    isLoggedIn: function () { return !!this.user; },

    /* Auth */
    async refreshMe() {
      if (!this.online) return this.user;
      var r = await window.api.get("/auth/me");
      this.user = r && r.user ? r.user : null;
      return this.user;
    },
    async login(username, password) {
      if (!this.online) { // preview: simulate
        var admin = username === "admin";
        this.user = { id: admin ? 1 : 2, username: username, role: admin ? "admin" : "user", profile_complete: false, account_status: "active", current_borrow_count: 0, overdue_count: 0 };
        return { success: true, user: this.user };
      }
      var r = await window.api.post("/auth/login", { username: username, password: password });
      if (r.token) window.api.setToken(r.token);
      await this.refreshMe();
      return r;
    },
    async register(payload) {
      if (!this.online) { this.user = { id: 3, username: payload.username, role: "user", profile_complete: false, account_status: "active" }; return { success: true }; }
      var r = await window.api.post("/auth/register", payload);
      if (r.token) window.api.setToken(r.token);
      await this.refreshMe();
      return r;
    },
    async logout() {
      try { if (this.online) await window.api.post("/auth/logout", {}); } catch (e) {}
      window.api.setToken(null); this.user = null;
    },

    /* Books */
    async books(params) {
      params = params || {};
      if (this.online) {
        var q = new URLSearchParams(params).toString();
        return window.api.get("/books" + (q ? "?" + q : ""));
      }
      var list = this._catalog.slice();
      if (params.featured) list = list.filter(function (b) { return b.featured; });
      if (params.category && params.category !== "All") list = list.filter(function (b) { return b.category === params.category; });
      if (params.search) {
        var s = params.search.toLowerCase();
        list = list.filter(function (b) { return (b.title + " " + b.author).toLowerCase().indexOf(s) >= 0; });
      }
      return { items: list, total: list.length, page: 1, limit: list.length };
    },
    async book(id) {
      if (this.online) return window.api.get("/books/" + id);
      return this._catalog.find(function (b) { return b.id == id; }) || null;
    },
    async categories() {
      if (this.online) return window.api.get("/categories");
      var set = {}; this._catalog.forEach(function (b) { set[b.category] = 1; });
      return ["All"].concat(Object.keys(set));
    },
    async comments(bookId) {
      if (this.online) return window.api.get("/books/" + bookId + "/comments");
      return { items: MOCK_COMMENTS[bookId] || [] };
    },
    async addComment(bookId, payload) {
      if (this.online) return window.api.post("/books/" + bookId + "/comments", payload);
      var c = Object.assign({ id: Date.now(), created_at: new Date().toISOString() }, payload);
      (MOCK_COMMENTS[bookId] = MOCK_COMMENTS[bookId] || []).unshift(c);
      return c;
    },

    /* Contact */
    async contact(payload) {
      if (this.online) return window.api.post("/contact", payload);
      return { ok: true };
    },

    /* View stats */
    async views() {
      if (this.online) { try { return (await window.api.get("/stats/views")).view_count || 0; } catch (e) { return 0; } }
      return 18423;
    },
    async statsSummary() {
      if (this.online) {
        try { return await window.api.get("/stats/summary"); }
        catch (e) { return { view_count: 0, total_books: 0, total_copies: 0, total_reviews: 0 }; }
      }
      return { view_count: 18423, total_books: 8, total_copies: 24, total_reviews: 12 };
    },
    async bumpView() {
      if (this.online) { try { await window.api.post("/stats/views", {}); } catch (e) {} }
    },

    /* Reviews (public, cross-book) */
    async reviews(limit) {
      if (this.online) { try { return await window.api.get("/reviews?limit=" + (limit || 9)); } catch (e) { return { items: [], summary: { count: 0, average: 0 } }; } }
      return {
        items: [
          { name: "Grace A.", rating: 5, created_at: "2026-06-20T00:00:00Z", content: "So convenient. I reserve a book in the evening and pick it up the next morning in two minutes." },
          { name: "Henry P.", rating: 5, created_at: "2026-06-03T00:00:00Z", content: "Beautiful interface, fast search. My kid loves the little readers' section." },
          { name: "Thu H.", rating: 4, created_at: "2026-05-30T00:00:00Z", content: "No more late-fee worries. Clear reminders and returning is easy." }
        ],
        summary: { count: 570, average: 4.8 }
      };
    },

    /* Loans (user) */
    async requestLoan(bookId, due_date) {
      if (this.online) return window.api.post("/loans", { items: [{ id: bookId }], due_date: due_date });
      return { success: true, created: 1 };
    },

    /* Admin */
    async adminBooks() { return (await this.books({ limit: 100 })).items || []; },
    async createBook(p) { return window.api.post("/books", p); },
    async updateBook(id, p) { return window.api.put("/books/" + id, p); },
    async deleteBook(id) { return window.api.del("/books/" + id); },
    async adminComments() { return (await window.api.get("/admin/comments")).items || []; },
    async setCommentVisibility(id, hidden) { return window.api.patch("/comments/" + id + "/visibility", { hidden: hidden }); },
    async deleteComment(id) { return window.api.del("/comments/" + id); },
    async adminLoans() { return (await window.api.get("/admin/loans")).items || []; },
    async setLoanStatus(id, status, reason) { return window.api.patch("/admin/loans/" + id + "/status", { status: status, reason: reason }); },
    async deleteLoan(id) { return window.api.del("/admin/loans/" + id); },
    async adminContacts() { return (await window.api.get("/admin/contacts")).items || []; }
  };

  window.Store = Store;
})();
