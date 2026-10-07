/* ==========================================================================
   PLEMMO — quiz-fluid.js

   Progressive enhancement for the five recommendation engines (card machine,
   EPOS, finance, energy, signage). They were built independently but share
   one shape: a step body that is re-rendered wholesale on every answer, with
   tiles, a stepper strip, and a back/continue footer.

   This adds the fluid behaviour to all five without touching their logic:
     · instant feedback on pointer-down rather than on click
     · steps that enter from the direction you are travelling, so going
       back looks like going back
     · results that materialise rather than appearing

   It attaches by observing the step container, so it keeps working when the
   engines re-render and needs no co-operation from their app.js. If this
   file fails to load, the engines behave exactly as they did before.
   ========================================================================== */
(function (w, d) {
  'use strict';

  var F = w.Fluid;
  if (!F) return;

  /* Each engine namespaces its markup with a short prefix. */
  var ENGINES = [
    { body: 'cmeBody', p: 'cme' },
    { body: 'epBody',  p: 'ep'  },
    { body: 'fnBody',  p: 'fn'  },
    { body: 'enBody',  p: 'en'  },
    { body: 'sgBody',  p: 'sg'  }
  ];

  function enhance(cfg) {
    var body = d.getElementById(cfg.body);
    if (!body) return;

    var p = cfg.p;
    var lastStep = -1;

    /* The stepper strip tells us which step we are on, which tells us which
       way the user is travelling. Direction matters: a panel that arrives
       from the right on the way forward must arrive from the left on the way
       back, or the flow stops feeling like a place you can move through. */
    function currentStep() {
      var pills = body.querySelectorAll('.' + p + '-pill');
      for (var i = 0; i < pills.length; i++) {
        if (pills[i].classList.contains('active')) return i;
      }
      return lastStep;
    }

    function animateIn() {
      var step = currentStep();
      var dir = lastStep === -1 ? 0 : (step >= lastStep ? 1 : -1);
      lastStep = step;

      var q = body.querySelector('.' + p + '-q');
      var tiles = body.querySelectorAll('.' + p + '-tile');
      var foot = body.querySelector('.' + p + '-foot');

      /* Press feedback lands on every tile and footer button, every render. */
      Array.prototype.forEach.call(tiles, function (t) {
        if (t.__fl) return;
        t.__fl = true;
        F.pressable(t, { scale: 0.96 });
        t.addEventListener('pointerdown', function () { F.haptic(7); });
      });
      Array.prototype.forEach.call(body.querySelectorAll('button'), function (b) {
        if (b.__fl || b.classList.contains(p + '-tile')) return;
        b.__fl = true;
        F.pressable(b, { scale: 0.97 });
      });

      if (!F.motionOK() || dir === 0) return;

      /* The question leads, travelling along the axis of movement. */
      if (q) slideIn(q, dir * 26, 0.44, 0);

      /* Tiles follow in a short stagger. Capped, so a step with twelve
         options doesn't make the last one arrive noticeably late. */
      Array.prototype.forEach.call(tiles, function (t, i) {
        slideIn(t, dir * 20, 0.46, Math.min(i, 7) * 38);
      });

      if (foot) slideIn(foot, 0, 0.5, 90);
    }

    function slideIn(el, fromX, response, delay) {
      /* Skip elements the user is mid-press on — stealing an element out
         from under a finger is exactly the kind of interruption that breaks
         the illusion of direct manipulation. */
      if (el.classList.contains('fl-pressed')) return;
      var sx = new F.Spring({ from: 0, response: response, damping: 1.0 });
      var so = new F.Spring({ from: 0, response: response * 0.8, damping: 1.0 });
      el.style.willChange = 'transform, opacity';
      sx.onUpdate = paint; so.onUpdate = paint;
      function paint() {
        el.style.opacity = Math.min(1, so.value).toFixed(3);
        el.style.transform = 'translate3d(' + (sx.value * fromX).toFixed(2) + 'px,0,0)';
      }
      sx.set(1); so.set(0); paint();
      setTimeout(function () {
        sx.to(0); so.to(1);
        so.onRest = function () { el.style.transform = ''; el.style.willChange = 'auto'; };
      }, delay || 0);
    }

    /* The engines replace the step body wholesale, so watch for that rather
       than trying to hook each of their render paths. */
    var pending = null;
    var mo = new MutationObserver(function () {
      /* A single render fires several mutations; coalesce to one pass. */
      if (pending) return;
      pending = w.requestAnimationFrame(function () { pending = null; animateIn(); });
    });
    mo.observe(body, { childList: true });

    animateIn();
  }

  /* ── results ───────────────────────────────────────────────────────────
     The results panel is the payoff of the whole flow, so it materialises —
     scale and opacity together — rather than simply being there. */
  function enhanceResults() {
    var host = d.getElementById('resultsBody');
    if (!host) return;
    var mo = new MutationObserver(function () {
      if (!F.motionOK()) return;
      var cards = host.children;
      Array.prototype.forEach.call(cards, function (c, i) {
        if (c.__flShown) return;
        c.__flShown = true;
        var s = new F.Spring({ from: 0, response: 0.55, damping: 1.0 });
        c.style.willChange = 'transform, opacity';
        s.onUpdate = function (v) {
          c.style.opacity = Math.min(1, v * 1.4).toFixed(3);
          c.style.transform = 'translate3d(0,' + ((1 - v) * 22).toFixed(2) + 'px,0) scale(' + (0.97 + v * 0.03).toFixed(4) + ')';
        };
        s.onRest = function () { c.style.transform = ''; c.style.willChange = 'auto'; };
        s.set(0);
        setTimeout(function () { s.to(1); }, Math.min(i, 6) * 70);
      });
    });
    mo.observe(host, { childList: true });
  }

  function init() {
    ENGINES.forEach(enhance);
    enhanceResults();
    /* The engines' own nav and sticky bars get the shared material treatment. */
    var nav = d.getElementById('nav');
    if (nav) F.scrollEdge(nav);
  }

  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', init);
  else init();

})(window, document);
