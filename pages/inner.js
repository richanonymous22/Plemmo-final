/* ==========================================================================
   PLEMMO — Inner-page shared behaviour
   Nav scroll state, mobile menu, reveal-on-scroll, FAQ accordion,
   tab/selector switching helper and the global enquiry modal.
   ========================================================================== */
(function () {
  'use strict';

  /* ── Nav scroll state ── */
  var nav = document.getElementById('nav');
  if (nav) {
    window.addEventListener('scroll', function () {
      nav.classList.toggle('scrolled', window.scrollY > 20);
    }, { passive: true });
  }

  /* ── Mobile menu ── */
  var burger = document.querySelector('.burger');
  var mobileMenu = document.getElementById('mobile-menu');
  if (burger && mobileMenu) {
    var openMenu = function () { mobileMenu.classList.add('open'); document.body.style.overflow = 'hidden'; };
    var closeMenu = function () { mobileMenu.classList.remove('open'); document.body.style.overflow = ''; };
    burger.addEventListener('click', openMenu);
    mobileMenu.querySelector('.mm-backdrop').addEventListener('click', closeMenu);
    mobileMenu.querySelector('.mm-close').addEventListener('click', closeMenu);
    mobileMenu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeMenu); });
  }

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Reading progress bar ── */
  var bar = document.createElement('div');
  bar.className = 'scroll-progress';
  document.body.appendChild(bar);
  var updateBar = function () {
    var h = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + '%';
  };
  window.addEventListener('scroll', updateBar, { passive: true });
  window.addEventListener('resize', updateBar);
  updateBar();

  /* ── Ambient hero orbs ── */
  var hero = document.querySelector('.hero');
  if (hero && !reduceMotion) {
    ['a', 'b'].forEach(function (k) {
      var o = document.createElement('span');
      o.className = 'orb ' + k;
      hero.insertBefore(o, hero.firstChild);
    });
  }

  /* ── Reveal on scroll (with light stagger for grid children) ── */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

  /* ── Animated number counters (elements with [data-count]) ── */
  var fmt = function (n) { return Math.round(n).toLocaleString('en-GB'); };
  var runCount = function (el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var prefix = el.getAttribute('data-prefix') || '';
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduceMotion) { el.textContent = prefix + fmt(target) + suffix; return; }
    var t0 = performance.now(), dur = 1400;
    el.classList.add('counting');
    (function step(t) {
      var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + fmt(target * e) + suffix;
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  };
  var cio = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { runCount(e.target); cio.unobserve(e.target); } });
  }, { threshold: 0.5 });
  document.querySelectorAll('[data-count]').forEach(function (el) { cio.observe(el); });

  /* ── Keyboard-accessible tabs (arrow keys move between tabs in a row) ── */
  document.querySelectorAll('.tabs').forEach(function (group) {
    var tabs = Array.prototype.slice.call(group.querySelectorAll('.tab'));
    tabs.forEach(function (tab, i) {
      tab.setAttribute('tabindex', '0');
      tab.setAttribute('role', 'button');
      tab.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); tab.click(); }
        else if (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft') {
          ev.preventDefault();
          var n = ev.key === 'ArrowRight' ? (i + 1) % tabs.length : (i - 1 + tabs.length) % tabs.length;
          tabs[n].focus();
        }
      });
    });
  });

  /* ── Mobile sticky quote bar (auto-built from the page's primary service) ── */
  (function () {
    var primaryTrigger = document.querySelector('.nav-cta [data-enquiry], .nav-cta a.btn-solid');
    var service = primaryTrigger ? primaryTrigger.getAttribute('data-service') : null;
    var hasModal = document.getElementById('enquiry-modal');
    var phone = (document.querySelector('a[href^="tel:"]') || {}).getAttribute
      ? document.querySelector('a[href^="tel:"]').getAttribute('href') : 'tel:02079460958';
    var wrap = document.createElement('div');
    wrap.className = 'sticky-cta';
    var quoteBtn = hasModal
      ? '<a href="#" class="btn btn-solid" data-enquiry ' + (service ? 'data-service="' + service + '"' : '') + '>Get a Free Quote</a>'
      : '<a href="#enquiry" class="btn btn-solid">Get a Free Quote</a>';
    wrap.innerHTML = '<a href="' + phone + '" class="btn btn-ghost" aria-label="Call Plemmo"><iconify-icon icon="ph:phone-call-duotone"></iconify-icon></a>' + quoteBtn;
    document.body.appendChild(wrap);
    document.body.classList.add('has-sticky-cta');
    /* its [data-enquiry] trigger is wired by the modal block below */
    var toggleSticky = function () { wrap.classList.toggle('show', window.scrollY > 600); };
    window.addEventListener('scroll', toggleSticky, { passive: true });
    toggleSticky();
  })();

  /* ── FAQ accordion ── */
  document.querySelectorAll('.faq-item').forEach(function (item) {
    var q = item.querySelector('.faq-q');
    if (!q) return;
    q.addEventListener('click', function () {
      var open = item.classList.contains('open');
      var parent = item.closest('.faq-grid') || document;
      parent.querySelectorAll('.faq-item').forEach(function (i) {
        i.classList.remove('open');
        var a = i.querySelector('.faq-a'); if (a) a.style.maxHeight = null;
      });
      if (!open) {
        item.classList.add('open');
        var a = item.querySelector('.faq-a'); if (a) a.style.maxHeight = a.scrollHeight + 'px';
      }
    });
  });

  /* ── Global enquiry modal ── */
  var modal = document.getElementById('enquiry-modal');
  if (modal) {
    var form = modal.querySelector('#enquiry-form');
    var formWrap = modal.querySelector('#enquiry-form-wrap');
    var successWrap = modal.querySelector('#enquiry-success');
    var serviceSelect = modal.querySelector('#enq-service');
    var productField = modal.querySelector('#enq-product');
    var lastFocused = null;

    var openModal = function (opts) {
      opts = opts || {};
      lastFocused = document.activeElement;
      if (formWrap) formWrap.style.display = '';
      if (successWrap) successWrap.style.display = 'none';
      if (opts.service && serviceSelect) serviceSelect.value = opts.service;
      if (productField) productField.value = opts.product || '';
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
      var first = modal.querySelector('input, select, textarea, button');
      if (first) setTimeout(function () { first.focus(); }, 60);
    };
    var closeModal = function () {
      modal.classList.remove('open');
      document.body.style.overflow = '';
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    };

    /* Any element with [data-enquiry] opens the modal.
       Optional data-service / data-product prefill the form. */
    document.querySelectorAll('[data-enquiry]').forEach(function (trigger) {
      trigger.addEventListener('click', function (e) {
        e.preventDefault();
        openModal({ service: trigger.getAttribute('data-service'), product: trigger.getAttribute('data-product') });
      });
    });

    modal.querySelector('.modal-backdrop').addEventListener('click', closeModal);
    modal.querySelectorAll('[data-close]').forEach(function (b) { b.addEventListener('click', closeModal); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
    });

    /* Focus trap */
    modal.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab' || !modal.classList.contains('open')) return;
      var f = modal.querySelectorAll('a[href], button:not([disabled]), input, select, textarea');
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (formWrap) formWrap.style.display = 'none';
        if (successWrap) successWrap.style.display = 'block';
      });
    }

    /* Expose for inline callers if needed */
    window.PlemmoModal = { open: openModal, close: closeModal };
  }
})();
