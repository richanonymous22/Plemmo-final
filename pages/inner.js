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

  /* ── Reveal on scroll ── */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

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
