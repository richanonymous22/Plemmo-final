/* ==========================================================================
   PLEMMO — results-polish.js

   Presentation layer for the recommendation results (spec §79, §80, §84).
   Presentation ONLY: it never reorders, filters, re-ranks or hides a result,
   and every piece of required information stays reachable. It changes what
   arrives first, not what is there.

   Three jobs:
     §80  Give the leading recommendation a clear visual hierarchy — "Your
          match" — and separate the rest under "Other options", so a page of
          near-identical cards becomes an answer followed by alternatives.
     §79  Fold long feature lists behind a disclosure. The owner documents
          carry a lot of detail per package; dumping forty features into a
          card makes the pricing impossible to find. Everything is one tap
          away and expanded state persists per card.
     §84  Keep touch targets and stacking usable on a phone (CSS side).

   Like quiz-fluid.js this attaches by observing the results container, so
   the engines' app.js files stay untouched and it degrades to a no-op if it
   fails to load.
   ========================================================================== */
(function (w, d) {
  'use strict';

  var F = w.Fluid;
  if (!F) return;

  /* Every engine namespaces its result cards with its own short prefix. */
  var CARD_SEL = '.cme-card, .ep-card, .fn-card, .en-card, .dsg-card, .sg-card';

  /* Below this many features a list is readable as-is; folding it would add
     a tap for no benefit. */
  var FOLD_AFTER = 5;

  function enhance(host) {
    var cards = host.querySelectorAll(CARD_SEL);
    if (!cards.length) return;

    Array.prototype.forEach.call(cards, function (card, i) {
      /* §80 — hierarchy. The first result is the answer; the rest are
         alternatives. The engines already mark their top card, so this adds
         the visual weight rather than deciding the order. */
      card.classList.toggle('fl-res-match', i === 0);
      card.classList.toggle('fl-res-alt', i > 0);

      if (i === 1 && !host.querySelector('.fl-res-divider')) {
        var div = d.createElement('div');
        div.className = 'fl-res-divider';
        div.innerHTML = '<span>Other options</span>';
        card.parentNode.insertBefore(div, card);
      }

      foldFeatures(card);
    });

    if (!host.querySelector('.fl-res-matchlabel') && cards[0]) {
      var lab = d.createElement('div');
      lab.className = 'fl-res-matchlabel';
      lab.innerHTML = '<span>Your match</span>';
      cards[0].parentNode.insertBefore(lab, cards[0]);
    }
  }

  /* §79 — progressive disclosure over the feature list. */
  function foldFeatures(card) {
    if (card.__flFolded) return;
    var lists = card.querySelectorAll('ul');
    if (!lists.length) return;

    Array.prototype.forEach.call(lists, function (ul) {
      var items = ul.children;
      if (items.length <= FOLD_AFTER) return;

      card.__flFolded = true;
      var hidden = [];
      for (var i = FOLD_AFTER; i < items.length; i++) hidden.push(items[i]);

      var wrap = d.createElement('div');
      wrap.className = 'fl-res-more';
      wrap.setAttribute('aria-hidden', 'true');
      var inner = d.createElement('ul');
      inner.className = ul.className;
      hidden.forEach(function (li) { inner.appendChild(li); });
      wrap.appendChild(inner);
      ul.parentNode.insertBefore(wrap, ul.nextSibling);

      var btn = d.createElement('button');
      btn.type = 'button';
      btn.className = 'fl-res-toggle';
      btn.setAttribute('aria-expanded', 'false');
      var count = hidden.length;
      function label(open) {
        return open
          ? 'Show less <iconify-icon icon="ph:caret-up-bold"></iconify-icon>'
          : 'View all features <span>+' + count + '</span> <iconify-icon icon="ph:caret-down-bold"></iconify-icon>';
      }
      btn.innerHTML = label(false);
      wrap.parentNode.insertBefore(btn, wrap.nextSibling);
      F.pressable(btn, { scale: 0.98 });

      /* Height is not a compositor-friendly property, but a disclosure is
         genuinely a size change and faking it with scaleY would distort the
         text. It's user-initiated, short, and on a small element. */
      var open = false;
      var s = new F.Spring({ from: 0, response: 0.4, damping: 1.0, epsilon: 0.5 });
      s.onUpdate = function (v) {
        wrap.style.height = Math.max(0, v).toFixed(1) + 'px';
        wrap.style.opacity = Math.min(1, v / Math.max(1, inner.scrollHeight * 0.5)).toFixed(3);
      };
      s.onRest = function (v) { if (v > 0) wrap.style.height = 'auto'; };
      wrap.style.height = '0px';
      wrap.style.overflow = 'hidden';

      btn.addEventListener('click', function () {
        open = !open;
        btn.setAttribute('aria-expanded', String(open));
        btn.innerHTML = label(open);
        wrap.setAttribute('aria-hidden', String(!open));
        /* Measure from the live box so an interrupted toggle re-targets from
           where it actually is rather than jumping. */
        if (wrap.style.height === 'auto') wrap.style.height = wrap.scrollHeight + 'px';
        s.to(open ? inner.scrollHeight : 0);
        F.haptic(6);
      });
    });
  }

  function init() {
    var host = d.getElementById('resultsBody');
    if (!host) return;
    var pending = null;
    new MutationObserver(function () {
      if (pending) return;
      pending = w.requestAnimationFrame(function () { pending = null; enhance(host); });
    }).observe(host, { childList: true, subtree: true });
    enhance(host);
  }

  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', init);
  else init();

})(window, document);
