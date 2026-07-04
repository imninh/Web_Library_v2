/* ============================================================
   Librumi — API client (tự viết, chỉ dùng fetch)
   Nói chuyện với backend Node/Express tại /api.
   Token lưu localStorage + gửi kèm Authorization: Bearer (cho cả web & mobile).
   Web cũng dùng cookie httpOnly do server set.
   ============================================================ */
(function () {
  "use strict";
  var BASE = "/api";
  var TOKEN_KEY = "librumi_token";

  function token() { try { return localStorage.getItem(TOKEN_KEY); } catch (e) { return null; } }
  function setToken(t) { try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch (e) {} }

  async function request(method, path, body, isForm) {
    var headers = {};
    var t = token();
    if (t) headers["Authorization"] = "Bearer " + t;
    var opts = { method: method, headers: headers, credentials: "include" };
    if (body != null) {
      if (isForm) { opts.body = body; }
      else { headers["Content-Type"] = "application/json"; opts.body = JSON.stringify(body); }
    }
    var res, data;
    try {
      res = await fetch(BASE + path, opts);
    } catch (netErr) {
      var e = new Error("Không kết nối được máy chủ."); e.offline = true; throw e;
    }
    var ct = res.headers.get("content-type") || "";
    data = ct.indexOf("application/json") >= 0 ? await res.json() : await res.text();
    if (!res.ok) {
      var err = new Error((data && data.error) || ("Lỗi " + res.status));
      err.status = res.status; err.data = data; throw err;
    }
    return data;
  }

  var api = {
    online: null,               // null = chưa biết, true/false sau ping
    get:   function (p) { return request("GET", p); },
    post:  function (p, b) { return request("POST", p, b); },
    put:   function (p, b) { return request("PUT", p, b); },
    patch: function (p, b) { return request("PATCH", p, b); },
    del:   function (p) { return request("DELETE", p); },
    upload: function (p, formData) { return request("POST", p, formData, true); },
    token: token,
    setToken: setToken,
    async ping() {
      try { await request("GET", "/health"); this.online = true; }
      catch (e) { this.online = false; }
      return this.online;
    }
  };

  window.api = api;
})();
