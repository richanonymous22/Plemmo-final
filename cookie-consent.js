/* ==========================================================================
   PLEMMO — cookie consent banner (self-contained, sitewide, inline-styled).
   Loaded on every page. Stores the visitor's choice in localStorage and
   exposes window.plemmoConsent ('all' | 'essential') plus a
   window.plemmoResetCookieConsent() helper for the Cookie Policy page.
   Non-essential scripts (e.g. analytics) must be gated on the 'plemmo:consent'
   event / window.plemmoConsent === 'all' before they are loaded.
   ========================================================================== */
(function () {
  if (window.__plemmoCookie) return;
  window.__plemmoCookie = true;

  var KEY = 'plemmo-cookie-consent';
  var inPages = /\/pages\//.test(location.pathname);
  var policyHref = (inPages ? '' : 'pages/') + 'cookie-policy.html';

  function read() {
    try { var s = localStorage.getItem(KEY); return s ? JSON.parse(s).choice : null; }
    catch (e) { return null; }
  }
  function write(choice) {
    try { localStorage.setItem(KEY, JSON.stringify({ choice: choice, ts: Date.now(), v: 1 })); }
    catch (e) {}
    window.plemmoConsent = choice;
    try { document.dispatchEvent(new CustomEvent('plemmo:consent', { detail: { choice: choice } })); }
    catch (e) {}
  }

  // Allow the Cookie Policy page to let visitors change their mind.
  window.plemmoResetCookieConsent = function () {
    try { localStorage.removeItem(KEY); } catch (e) {}
    location.reload();
  };

  var existing = read();
  if (existing) { window.plemmoConsent = existing; return; }

  function build() {
    var b = document.createElement('div');
    b.setAttribute('role', 'dialog');
    b.setAttribute('aria-label', 'Cookie consent');
    b.style.cssText = 'position:fixed;left:16px;right:16px;bottom:16px;z-index:1000;max-width:560px;margin:0 auto;background:rgba(18,22,14,.97);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);border:1px solid rgba(255,255,255,.18);border-radius:24px;box-shadow:0 30px 70px rgba(0,0,0,.55);padding:22px 24px;font-family:Inter,system-ui,sans-serif;transform:translateY(170%);transition:transform .5s cubic-bezier(.16,1,.3,1)';
    b.innerHTML =
      '<h4 style="font-family:\'Space Grotesk\',Inter,sans-serif;font-size:16px;color:#fff;margin:0 0 8px">We value your privacy</h4>' +
      '<p style="font-size:13px;color:#9aa48d;line-height:1.6;margin:0 0 16px">We use essential cookies to make this site work. With your consent we may also use non-essential cookies to understand how the site is used and improve it. You can change your choice at any time. See our <a href="' + policyHref + '" style="color:#c6ff00;text-decoration:underline">Cookie Policy</a>.</p>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap">' +
        '<button type="button" data-c="essential" style="flex:1;min-width:140px;cursor:pointer;font-family:Inter,sans-serif;font-weight:600;font-size:14px;padding:12px 18px;border-radius:12px;border:1.5px solid rgba(255,255,255,.22);background:transparent;color:#fff">Reject non-essential</button>' +
        '<button type="button" data-c="all" style="flex:1;min-width:140px;cursor:pointer;font-family:Inter,sans-serif;font-weight:700;font-size:14px;padding:12px 18px;border-radius:12px;border:none;background:#c6ff00;color:#0a0c08">Accept all</button>' +
      '</div>';
    document.body.appendChild(b);
    requestAnimationFrame(function () { requestAnimationFrame(function () { b.style.transform = 'none'; }); });
    b.addEventListener('click', function (e) {
      var t = e.target.closest('[data-c]');
      if (!t) return;
      write(t.getAttribute('data-c'));
      b.style.transform = 'translateY(170%)';
      setTimeout(function () { if (b.parentNode) b.parentNode.removeChild(b); }, 520);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
