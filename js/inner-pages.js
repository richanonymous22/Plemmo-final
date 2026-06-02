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
   * 8. DIGITAL SIGNAGE PAGE (scoped — only runs on that page)
   *    - signage type selector updates the recommendation panel
   *    - quote triggers prefill service/product into the modal
   *    - quote form shows a success state
   * ---------------------------------------------------------------------- */
  function initSignage() {
    var page = $('.digital-signage-page');
    if (!page) return;

    /* Recommendation data keyed by signage type */
    var recs = {
      'digital-menu-boards': {
        icon: 'solar:clipboard-list-linear', title: 'For cafés & takeaways',
        text: 'Digital Menu Boards are perfect for showcasing your menu, promotions and prices with style and clarity.',
        list: ['Boost impulse orders', 'Easy to update anytime', 'Increase average spend'],
        best: '32” Digital Menu Board Package', price: '£350', unit: '/screen', size: '32"',
        service: 'Digital Menu Boards', btn: 'View Menu Board Packages'
      },
      'window-displays': {
        icon: 'solar:window-frame-linear', title: 'For high-street visibility',
        text: 'Window displays help your storefront stand out in direct sunlight and attract passing customers.',
        list: ['Visible from outside', 'Promote offers 24/7', 'Built for high-footfall locations'],
        best: 'High Brightness Window Display', price: 'From £1,770', unit: '', size: '43"',
        service: 'Window Displays', btn: 'View Window Displays'
      },
      'advertising-screens': {
        icon: 'solar:monitor-linear', title: 'For offers and promotions',
        text: 'Advertising screens help promote campaigns, products and seasonal messages inside your business.',
        list: ['Dynamic promotions', 'Professional visuals', 'Flexible content updates'],
        best: 'Professional Advertising Display', price: 'From £650', unit: '', size: '32"',
        service: 'Advertising Screens', btn: 'View Advertising Screens'
      },
      'shopfront-signs': {
        icon: 'solar:shop-2-linear', title: 'For brand presence',
        text: 'Custom shopfront signs help your business look professional and easy to recognise.',
        list: ['Built around your brand', 'Material and lighting options', 'Site survey recommended'],
        best: 'Custom Shopfront Signage', price: 'Quote based', unit: '', size: 'Custom',
        service: 'Shopfront Signs', btn: 'Enquire About Shopfront Signs'
      },
      'neon-signs': {
        icon: 'solar:bolt-linear', title: 'For atmosphere and attention',
        text: 'LED neon signs add personality, atmosphere and memorable visual moments to your space.',
        list: ['Custom colours', 'Logo and text options', 'Great for social media appeal'],
        best: 'Custom LED Neon Sign', price: 'Quote based', unit: '', size: 'Custom',
        service: 'LED Neon Signs', btn: 'Enquire About Neon Signs'
      },
      'outdoor-displays': {
        icon: 'solar:cloud-sun-linear', title: 'For all-weather visibility',
        text: 'Outdoor screens help businesses advertise in high-impact locations, day and night.',
        list: ['Weather-resistant options', 'High visibility', 'Built for outdoor environments'],
        best: 'Outdoor Digital Advertising Display', price: 'From £2,960', unit: '', size: '43"',
        service: 'Outdoor Displays', btn: 'View Outdoor Displays'
      },
      'touch-kiosks': {
        icon: 'solar:cursor-square-linear', title: 'For interactive customer experiences',
        text: 'Touch kiosks help customers browse, order, check in or interact with your business independently.',
        list: ['Interactive experience', 'Self-service options', 'Ideal for hospitality and retail'],
        best: 'Android Touch Screen Kiosk', price: 'From £2,290', unit: '', size: '43"',
        service: 'Touch Kiosks', btn: 'View Touch Kiosks'
      }
    };

    var picks = $all('.ds-pick', page);
    var elIcon = $('#ds-rec-icon');
    var elTitle = $('#ds-rec-title');
    var elText = $('#ds-rec-text');
    var elList = $('#ds-rec-list');
    var elBest = $('#ds-rec-best');
    var elPrice = $('#ds-rec-price');
    var elUnit = $('#ds-rec-unit');
    var elSize = $('#ds-rec-thumb-size');
    var elBtn = $('#ds-rec-btn');

    function applyRec(type) {
      var r = recs[type];
      if (!r) return;
      if (elIcon) elIcon.setAttribute('icon', r.icon);
      if (elTitle) elTitle.textContent = r.title;
      if (elText) elText.textContent = r.text;
      if (elList) {
        elList.innerHTML = r.list.map(function (item) {
          return '<li><iconify-icon icon="solar:check-circle-linear"></iconify-icon> ' + item + '</li>';
        }).join('');
      }
      if (elBest) elBest.textContent = r.best;
      if (elPrice) elPrice.textContent = r.price;
      if (elUnit) elUnit.textContent = r.unit;
      if (elSize) elSize.textContent = r.size;
      if (elBtn) {
        elBtn.setAttribute('data-service', r.service);
        elBtn.innerHTML = r.btn + ' <iconify-icon icon="solar:arrow-right-linear"></iconify-icon>';
      }
    }

    picks.forEach(function (pick) {
      on(pick, 'click', function () {
        picks.forEach(function (p) { p.classList.remove('is-selected'); p.setAttribute('aria-pressed', 'false'); });
        pick.classList.add('is-selected');
        pick.setAttribute('aria-pressed', 'true');
        applyRec(pick.getAttribute('data-type'));
      });
    });

    /* Prefill the signage quote modal from any trigger's data-service / data-product */
    var serviceField = $('#ds-service');
    var productField = $('#ds-product');
    $all('[data-modal-open="signage-quote"]').forEach(function (trigger) {
      on(trigger, 'click', function () {
        var svc = trigger.getAttribute('data-service');
        var prod = trigger.getAttribute('data-product');
        if (svc && serviceField) {
          Array.prototype.forEach.call(serviceField.options, function (o) {
            if (o.value === svc || o.text === svc) serviceField.value = o.value;
          });
        }
        if (productField) productField.value = prod || '';
      });
    });

    /* Quote form -> success state */
    var form = $('#ds-quote-form');
    var success = $('#ds-quote-success');
    if (form && success) {
      on(form, 'submit', function (e) {
        e.preventDefault();
        if (!form.checkValidity()) { form.reportValidity(); return; }
        form.classList.add('ip-hide');
        success.classList.remove('ip-hide');
      });
    }
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
    initSignage();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
