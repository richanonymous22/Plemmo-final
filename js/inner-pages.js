/* ==========================================================================
   PLEMMO — INNER-PAGE INTERACTIONS
   --------------------------------------------------------------------------
   Vanilla JS (no dependencies) powering the inner-page design system.
   Shared by: card-machines / business-funding / epos-systems /
              digital-signage / about-us / contact-us.

   Everything is feature-detected and null-safe, so a page only needs the
   markup for the components it actually uses. All behaviour respects
   prefers-reduced-motion.

   Modules:
     1. Sticky header shadow on scroll
     2. Mobile navigation (hamburger)
     3. FAQ accordions (smooth open/close)
     4. Tabs
     5. Quiz / checker panels (multi-step)
     6. Modals (fade/scale, focus + ESC handling)
     7. Scroll reveal (IntersectionObserver)
   ========================================================================== */
(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function on(el, evt, fn) { if (el) el.addEventListener(evt, fn); }
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $all(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /* ---------------------------------------------------------------------- *
   * 1. STICKY HEADER SHADOW
   * ---------------------------------------------------------------------- */
  function initHeader() {
    var header = $('.ip-header');
    if (!header) return;
    var onScroll = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------------------------------------------------------------------- *
   * 2. MOBILE NAVIGATION
   * ---------------------------------------------------------------------- */
  function initMobileNav() {
    var burger = $('.ip-burger');
    var nav = $('.ip-mobile-nav');
    if (!burger || !nav) return;

    var closeBtn = $('[data-mobile-close]', nav);

    function setOpen(open) {
      nav.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('ip-no-scroll', open);
    }

    on(burger, 'click', function () {
      setOpen(!nav.classList.contains('is-open'));
    });
    on(closeBtn, 'click', function () { setOpen(false); });

    // Close when a link is tapped
    $all('a', nav).forEach(function (a) {
      on(a, 'click', function () { setOpen(false); });
    });

    // ESC closes
    on(document, 'keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) setOpen(false);
    });
  }

  /* ---------------------------------------------------------------------- *
   * 3. FAQ ACCORDIONS
   * ---------------------------------------------------------------------- */
  function initFaq() {
    var items = $all('.ip-faq__item');
    if (!items.length) return;

    items.forEach(function (item) {
      var q = $('.ip-faq__q', item);
      var a = $('.ip-faq__a', item);
      if (!q || !a) return;

      var allowMulti = item.closest('.ip-faq') &&
        item.closest('.ip-faq').hasAttribute('data-allow-multiple');

      q.setAttribute('aria-expanded', 'false');

      on(q, 'click', function () {
        var isOpen = item.classList.contains('is-open');

        if (!allowMulti) {
          $all('.ip-faq__item.is-open', item.closest('.ip-faq')).forEach(function (other) {
            if (other !== item) {
              other.classList.remove('is-open');
              other.querySelector('.ip-faq__a').style.maxHeight = '0px';
              var oq = other.querySelector('.ip-faq__q');
              if (oq) oq.setAttribute('aria-expanded', 'false');
            }
          });
        }

        item.classList.toggle('is-open', !isOpen);
        q.setAttribute('aria-expanded', String(!isOpen));
        a.style.maxHeight = isOpen ? '0px' : a.scrollHeight + 'px';
      });
    });

    // Recompute open panel heights on resize
    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        $all('.ip-faq__item.is-open .ip-faq__a').forEach(function (a) {
          a.style.maxHeight = a.scrollHeight + 'px';
        });
      }, 120);
    });
  }

  /* ---------------------------------------------------------------------- *
   * 4. TABS
   * ---------------------------------------------------------------------- */
  function initTabs() {
    $all('[data-tabs]').forEach(function (group) {
      var tabs = $all('.ip-tab', group);
      var panels = $all('.ip-tab-panel', group);

      tabs.forEach(function (tab) {
        on(tab, 'click', function () {
          var target = tab.getAttribute('data-tab');
          tabs.forEach(function (t) {
            var active = t === tab;
            t.classList.toggle('is-active', active);
            t.setAttribute('aria-selected', String(active));
          });
          panels.forEach(function (p) {
            p.classList.toggle('is-active', p.getAttribute('data-panel') === target);
          });
        });
      });
    });
  }

  /* ---------------------------------------------------------------------- *
   * 5. QUIZ / CHECKER PANELS (multi-step)
   * ---------------------------------------------------------------------- */
  function initCheckers() {
    $all('[data-checker]').forEach(function (checker) {
      var steps = $all('.ip-checker__step', checker);
      var bar = $('.ip-checker__bar i', checker);
      var label = $('.ip-checker__step-label', checker);
      if (!steps.length) return;

      var index = 0;

      function render() {
        steps.forEach(function (s, i) { s.classList.toggle('is-active', i === index); });
        if (bar) bar.style.width = ((index + 1) / steps.length * 100) + '%';
        if (label) label.textContent = 'Step ' + (index + 1) + ' of ' + steps.length;
      }

      function go(to) {
        index = Math.max(0, Math.min(steps.length - 1, to));
        render();
      }

      // [data-next] advances; [data-prev] goes back; option buttons advance + mark selected
      $all('[data-next]', checker).forEach(function (btn) {
        on(btn, 'click', function () { go(index + 1); });
      });
      $all('[data-prev]', checker).forEach(function (btn) {
        on(btn, 'click', function () { go(index - 1); });
      });
      $all('.ip-checker__step .ip-option', checker).forEach(function (opt) {
        on(opt, 'click', function () {
          var siblings = $all('.ip-option', opt.closest('.ip-checker__options') || checker);
          siblings.forEach(function (s) { s.classList.remove('is-selected'); });
          opt.classList.add('is-selected');
          if (!opt.hasAttribute('data-no-advance')) {
            setTimeout(function () { go(index + 1); }, 180);
          }
        });
      });

      render();
    });
  }

  /* ---------------------------------------------------------------------- *
   * 6. MODALS
   * ---------------------------------------------------------------------- */
  function initModals() {
    var lastFocused = null;

    function open(modal) {
      if (!modal) return;
      lastFocused = document.activeElement;
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('ip-no-scroll');
      var focusable = modal.querySelector('input, textarea, button, [href]');
      if (focusable) focusable.focus();
    }
    function close(modal) {
      if (!modal) return;
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('ip-no-scroll');
      if (lastFocused) lastFocused.focus();
    }

    // Triggers
    $all('[data-modal-open]').forEach(function (trigger) {
      on(trigger, 'click', function (e) {
        e.preventDefault();
        open(document.getElementById(trigger.getAttribute('data-modal-open')));
      });
    });

    // Close buttons + backdrop
    $all('.ip-modal').forEach(function (modal) {
      $all('[data-modal-close]', modal).forEach(function (btn) {
        on(btn, 'click', function () { close(modal); });
      });
      on(modal, 'click', function (e) {
        if (e.target === modal) close(modal);
      });
    });

    on(document, 'keydown', function (e) {
      if (e.key === 'Escape') {
        var openModal = $('.ip-modal.is-open');
        if (openModal) close(openModal);
      }
    });
  }

  /* ---------------------------------------------------------------------- *
   * 7. SCROLL REVEAL
   * ---------------------------------------------------------------------- */
  function initReveal() {
    var els = $all('.ip-reveal');
    if (!els.length) return;

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------------------------------------------------------------------- *
   * BOOT
   * ---------------------------------------------------------------------- */
  function init() {
    initHeader();
    initMobileNav();
    initFaq();
    initTabs();
    initCheckers();
    initModals();
    initReveal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
