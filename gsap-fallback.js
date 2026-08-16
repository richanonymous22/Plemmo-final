/* ==========================================================================
   PLEMMO — gsap-fallback.js

   main.js opens with gsap.registerPlugin(ScrollTrigger) inside its
   DOMContentLoaded handler. If the GSAP CDN is slow, blocked or down, that
   line throws and takes the entire handler with it — so the mobile menu,
   the quote wizard, the savings calculator, the navbar and the testimonial
   controls all stop working. The page still renders, so nothing looks
   broken; it just quietly stops responding.

   This installs a minimal stand-in when GSAP is absent, so the page stays
   fully usable and animations degrade to their finished state rather than
   taking the interactive layer down with them.

   Load order matters: this must come after the GSAP tags and before
   main.js. All three are deferred, and deferred scripts run in document
   order, so the real library wins whenever it arrives.
   ========================================================================== */
(function (w, d) {
  'use strict';

  if (w.gsap && w.ScrollTrigger) return;    /* the real thing loaded — stand down */

  var hasGsap = !!w.gsap;

  /* Properties GSAP would have tweened, mapped to how to apply the end
     state directly. Anything not listed is set as a plain CSS property. */
  var TRANSFORM_KEYS = { x: 'px', y: 'px', scale: '', rotate: 'deg', rotateY: 'deg', rotationY: 'deg' };
  var SKIP = { duration: 1, ease: 1, delay: 1, stagger: 1, onComplete: 1, onUpdate: 1, onStart: 1,
               scrollTrigger: 1, snap: 1, repeat: 1, yoyo: 1, overwrite: 1, paused: 1, immediateRender: 1 };

  function els(target) {
    if (!target) return [];
    if (typeof target === 'string') return Array.prototype.slice.call(d.querySelectorAll(target));
    if (target.nodeType) return [target];
    if (target.length != null) return Array.prototype.slice.call(target);
    return [];
  }

  /* Apply the tween's END state immediately. A finished animation is the
     correct resting state, so the page looks intentional rather than
     half-built. */
  function applyEnd(target, vars) {
    var list = els(target), tr;
    list.forEach(function (el) {
      if (!el || !el.style) return;
      tr = [];
      for (var k in vars) {
        if (!Object.prototype.hasOwnProperty.call(vars, k) || SKIP[k]) continue;
        var v = vars[k];
        if (k === 'innerHTML' || k === 'textContent') {
          /* Counters tween innerHTML to a target number; land on the number. */
          el.textContent = String(v);
        } else if (TRANSFORM_KEYS[k] != null) {
          var fn = (k === 'rotateY' || k === 'rotationY') ? 'rotateY' : (k === 'rotate' ? 'rotate' : (k === 'scale' ? 'scale' : 'translate' + k.toUpperCase()));
          tr.push(fn + '(' + v + TRANSFORM_KEYS[k] + ')');
        } else if (k in el.style) {
          el.style[k] = typeof v === 'number' && k !== 'opacity' && k !== 'zIndex' ? v + 'px' : v;
        }
      }
      if (tr.length) el.style.transform = tr.join(' ');
    });
    if (typeof vars.onComplete === 'function') { try { vars.onComplete(); } catch (e) {} }
    if (typeof vars.onUpdate === 'function') { try { vars.onUpdate(); } catch (e) {} }
    return tween();
  }

  /* A tween handle inert enough to be passed back into gsap.to() — main.js
     does that to pause the testimonial marquee on hover. */
  function tween() {
    return { kill: noop, pause: noop, play: noop, restart: noop, progress: noop,
             timeScale: noop, duration: noop, then: function (f) { try { f(); } catch (e) {} return this; } };
  }
  function noop() { return this; }

  if (!hasGsap) {
    w.gsap = {
      registerPlugin: noop,
      to: applyEnd,
      set: applyEnd,
      /* from() animates FROM a state TO the element's natural one, so doing
         nothing already leaves it exactly where it should end up. */
      from: function (t, v) { if (v && typeof v.onComplete === 'function') { try { v.onComplete(); } catch (e) {} } return tween(); },
      fromTo: function (t, f, tv) { return applyEnd(t, tv || {}); },
      timeline: function () {
        var tl = {
          to: function (t, v) { applyEnd(t, v); return tl; },
          from: function () { return tl; },
          fromTo: function (t, f, v) { applyEnd(t, v); return tl; },
          set: function (t, v) { applyEnd(t, v); return tl; },
          add: function () { return tl; }, call: function (f) { try { f(); } catch (e) {} return tl; },
          kill: noop, pause: noop, play: noop, progress: noop, timeScale: noop
        };
        return tl;
      },
      utils: {
        toArray: els,
        wrap: function (a, b) { return b; },
        clamp: function (lo, hi, v) { return Math.max(lo, Math.min(hi, v)); }
      },
      getProperty: function () { return 0; },
      killTweensOf: noop,
      ticker: { add: noop, remove: noop },
      defaults: noop
    };
  }

  /* ScrollTrigger.create is used for counters and section reveals. Back it
     with IntersectionObserver so those still fire at the right moment
     instead of all firing at once on load. */
  if (!w.ScrollTrigger) {
    w.ScrollTrigger = {
      create: function (cfg) {
        cfg = cfg || {};
        var t = cfg.trigger;
        if (typeof t === 'string') t = d.querySelector(t);
        var fire = function () {
          if (typeof cfg.onEnter === 'function') { try { cfg.onEnter(); } catch (e) {} }
        };
        if (!t || !('IntersectionObserver' in w)) { fire(); return { kill: noop, refresh: noop }; }
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) {
            if (!en.isIntersecting) return;
            fire();
            if (cfg.once !== false) io.unobserve(en.target);
          });
        }, { rootMargin: '0px 0px -12% 0px', threshold: 0.05 });
        io.observe(t);
        return { kill: function () { io.disconnect(); }, refresh: noop };
      },
      refresh: noop,
      getAll: function () { return []; },
      killAll: noop,
      update: noop,
      addEventListener: noop,
      batch: noop
    };
  }

  if (w.console && w.console.warn) {
    w.console.warn('[plemmo] GSAP unavailable — running without scroll animation. Interactive features remain active.');
  }

})(window, document);
