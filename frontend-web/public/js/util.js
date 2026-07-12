/* Tiện ích dùng chung */
(function () {
  "use strict";
  var U = {};

  /* escape HTML chống XSS khi nhúng dữ liệu người dùng */
  U.esc = function (s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  };

  /* rút gọn text */
  U.truncate = function (s, n) { s = String(s || ""); return s.length > n ? s.slice(0, n - 1) + "…" : s; };

  /* format số */
  U.num = function (n) { return Number(n || 0).toLocaleString("en-US"); };

  /* relative time e.g. "2 weeks ago" (SQLite datetime is UTC) */
  U.ago = function (iso) {
    if (!iso) return "";
    var d = new Date(iso.indexOf("T") < 0 ? iso.replace(" ", "T") + "Z" : iso);
    if (isNaN(d)) return "";
    var s = Math.floor((Date.now() - d.getTime()) / 1000);
    if (s < 60) return "just now";
    var units = [["year", 31536000], ["month", 2592000], ["week", 604800], ["day", 86400], ["hour", 3600], ["minute", 60]];
    for (var i = 0; i < units.length; i++) {
      var n = Math.floor(s / units[i][1]);
      if (n >= 1) return n + " " + units[i][0] + (n > 1 ? "s" : "") + " ago";
    }
    return "just now";
  };

  /* ngày dd/mm/yyyy */
  U.date = function (iso) {
    if (!iso) return "";
    var d = new Date(iso); if (isNaN(d)) return "";
    return d.toLocaleDateString("vi-VN");
  };

  /* Cookie (dùng cho popup "không hiện lại") */
  U.setCookie = function (name, value, days) {
    var exp = "";
    if (days) { var d = new Date(); d.setTime(d.getTime() + days * 864e5); exp = "; expires=" + d.toUTCString(); }
    document.cookie = name + "=" + encodeURIComponent(value) + exp + "; path=/; SameSite=Lax";
  };
  U.getCookie = function (name) {
    var m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
    return m ? decodeURIComponent(m[1]) : null;
  };

  /* Toast */
  U.toast = function (msg, type) {
    var root = document.getElementById("toast-root");
    if (!root) return;
    var t = document.createElement("div");
    t.className = "toast toast-anim toast--" + (type || "info");
    t.textContent = msg;
    root.appendChild(t);
    setTimeout(function () {
      t.style.transition = "opacity .3s, transform .3s";
      t.style.opacity = "0"; t.style.transform = "translateY(10px)";
      setTimeout(function () { t.remove(); }, 320);
    }, 3200);
  };

  /*  ngôi sao đánh giá (SVG) */
  U.stars = function (rating, size) {
    size = size || 15; rating = Math.round(rating || 0);
    var out = "";
    for (var i = 1; i <= 5; i++) {
      var on = i <= rating;
      out += '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="' +
        (on ? "#e8b23a" : "none") + '" stroke="' + (on ? "#e8b23a" : "#c9cdc7") +
        '" stroke-width="1.6"><path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 18.1 5.9 21.4l1.4-6.8L2.2 9.9l6.9-.8z"/></svg>';
    }
    return '<span class="stars" style="display:inline-flex;gap:2px;vertical-align:middle">' + out + "</span>";
  };

  /* mũi tên (dùng nhiều nơi) */
  U.arrow = function (color, w) {
    color = color || "#1b3a31"; w = w || 20;
    return '<svg width="' + w + '" height="' + w + '" viewBox="0 0 24 24" fill="none" stroke="' + color +
      '" stroke-width="2.4"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  };

  /* điều hướng hash */
  U.go = function (path) { location.hash = "#" + path; };

  /* debounce */
  U.debounce = function (fn, ms) {
    var t; return function () { var a = arguments, c = this; clearTimeout(t); t = setTimeout(function () { fn.apply(c, a); }, ms); };
  };

  /* Generic modal*/
  U.modal = function (html, opts) {
    opts = opts || {};
    var root = document.getElementById("modal-root");
    root.innerHTML =
      '<div class="modal-overlay" data-modal-overlay>' +
      '  <div class="modal-card pop-anim ' + (opts.wide ? "modal-wide" : "") + '" role="dialog" aria-modal="true">' +
      '    <button class="promo-x" data-modal-close aria-label="Close">✕</button>' + html +
      '  </div>' +
      '</div>';
    function close() { root.innerHTML = ""; }
    root.querySelector("[data-modal-close]").addEventListener("click", close);
    root.querySelector("[data-modal-overlay]").addEventListener("click", function (e) { if (e.target === this) close(); });
    if (opts.mount) opts.mount(root.querySelector(".modal-card"), close);
    return close;
  };

  /* date helpers for <input type=date> */
  U.addDays = function (days) { var d = new Date(); d.setDate(d.getDate() + days); return d.toISOString().slice(0, 10); };

  window.U = U;
})();
