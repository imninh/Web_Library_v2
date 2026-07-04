/* ============================================================
   Librumi — Sign in / Register
   ============================================================ */
(function () {
  "use strict";
  window.Pages = window.Pages || {};

  window.Pages.auth = async function () {
    var html =
    '<section class="wrap section" style="max-width:520px">' +
    '  <div style="text-align:center;margin-bottom:26px" data-rev>' +
    '    <span class="eyebrow">Librumi</span>' +
    '    <h1 class="section-title split-title" style="font-size:34px;margin-top:6px"><span class="linew">Welcome back</span></h1>' +
    '  </div>' +
    '  <div class="form-card" data-rev>' +
    '    <div class="chips" style="margin-bottom:22px;justify-content:center">' +
    '      <button class="chip active" data-tab="login">Sign in</button>' +
    '      <button class="chip" data-tab="register">Register</button>' +
    '    </div>' +
    '    <div id="auth-forms">' +
    '      <form id="form-login">' +
    '        <div class="form-row"><label class="field-lbl">Username</label><input class="inp" name="username" autocomplete="username"/></div>' +
    '        <div class="form-row"><label class="field-lbl">Password</label><input class="inp" name="password" type="password" autocomplete="current-password"/></div>' +
    '        <button class="btn-lime" type="submit" style="width:100%;justify-content:center;padding:13px">Sign in</button>' +
    '        <p style="text-align:center;color:var(--ink-soft);font-size:13px;margin:16px 0 0">Demo: <b>admin/admin123</b> or <b>user/user123</b></p>' +
    '      </form>' +
    '      <form id="form-register" style="display:none">' +
    '        <div class="form-row"><label class="field-lbl">Username</label><input class="inp" name="username"/></div>' +
    '        <div class="form-row"><label class="field-lbl">Password (≥ 6 characters)</label><input class="inp" name="password" type="password"/></div>' +
    '        <div class="form-row"><label class="field-lbl">Full name (optional)</label><input class="inp" name="full_name"/></div>' +
    '        <button class="btn-lime" type="submit" style="width:100%;justify-content:center;padding:13px">Create account</button>' +
    '      </form>' +
    '    </div>' +
    '  </div>' +
    '</section>';

    return {
      html: html,
      mount: function (root) {
        var login = root.querySelector("#form-login");
        var reg = root.querySelector("#form-register");
        root.querySelectorAll(".chip[data-tab]").forEach(function (chip) {
          chip.addEventListener("click", function () {
            root.querySelectorAll(".chip[data-tab]").forEach(function (c) { c.classList.remove("active"); });
            chip.classList.add("active");
            var t = chip.getAttribute("data-tab");
            login.style.display = t === "login" ? "" : "none";
            reg.style.display = t === "register" ? "" : "none";
          });
        });
        login.addEventListener("submit", async function (e) {
          e.preventDefault();
          var u = login.username.value.trim(), p = login.password.value;
          if (!u || !p) return U.toast("Enter all fields.", "error");
          try {
            await window.Store.login(u, p);
            U.toast("Signed in successfully!", "success");
            U.go(window.Store.isAdmin() ? "/admin" : "/account");
          } catch (err) { U.toast(err.message || "Wrong username or password.", "error"); }
        });
        reg.addEventListener("submit", async function (e) {
          e.preventDefault();
          var u = reg.username.value.trim(), p = reg.password.value;
          if (u.length < 3) return U.toast("Username is too short.", "error");
          if (p.length < 6) return U.toast("Password must be at least 6 characters.", "error");
          try {
            await window.Store.register({ username: u, password: p, full_name: reg.full_name.value.trim() || undefined });
            U.toast("Account created successfully!", "success");
            U.go("/account");
          } catch (err) { U.toast(err.message, "error"); }
        });
      }
    };
  };
})();
