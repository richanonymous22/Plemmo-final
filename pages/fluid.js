/* ==========================================================================
   PLEMMO — fluid.js
   A small, dependency-free motion layer built on the principles in Apple's
   "Designing Fluid Interfaces" (WWDC18).

   The whole file exists to make one thing true: motion starts from the value
   that is currently on screen, inherits the user's velocity, projects momentum
   forward, and can be grabbed and reversed at any instant.

   Springs — not transitions — are the primitive, because a spring is
   interruptible by construction: new input just moves the target and the
   motion stays continuous.

   Exposes window.Fluid = { Spring, project, rubberband, pressable, reveal,
                            Scrubber, Deck, scrollEdge, motionOK, ... }
   ========================================================================== */
(function (w, d) {
  'use strict';

  /* ── environment preferences ───────────────────────────────────────────
     Read live rather than cached: users change these mid-session. */
  function mq(q) { return w.matchMedia ? w.matchMedia(q) : { matches: false, addEventListener: function () {} }; }
  var mmMotion = mq('(prefers-reduced-motion: reduce)');
  var mmTrans = mq('(prefers-reduced-transparency: reduce)');
  var mmContrast = mq('(prefers-contrast: more)');

  function motionOK() { return !mmMotion.matches; }
  function transparencyOK() { return !mmTrans.matches; }
  function contrastBoost() { return mmContrast.matches; }

  /* Reflect preferences on <html> so CSS can respond to the same signals
     without duplicating the media queries in every component. */
  function syncPrefs() {
    var r = d.documentElement;
    r.classList.toggle('fl-reduced-motion', mmMotion.matches);
    r.classList.toggle('fl-reduced-transparency', mmTrans.matches);
    r.classList.toggle('fl-more-contrast', mmContrast.matches);
  }
  syncPrefs();
  [mmMotion, mmTrans, mmContrast].forEach(function (m) {
    if (m.addEventListener) m.addEventListener('change', syncPrefs);
  });

  /* ── the ticker ────────────────────────────────────────────────────────
     One rAF loop drives every live spring. requestAnimationFrame is the web's
     display-synced clock; running a loop per spring would desync them and
     burn frames. */
  var live = [];
  var ticking = false;
  var lastT = 0;

  function tick(now) {
    var dt = lastT ? (now - lastT) / 1000 : 1 / 60;
    lastT = now;
    /* Clamp: a backgrounded tab returns a huge dt that would explode the
       integrator. Better to lose time than to lose stability. */
    if (dt > 0.064) dt = 0.064;

    for (var i = live.length - 1; i >= 0; i--) {
      var s = live[i];
      s._step(dt);
      if (s.resting) {
        live.splice(i, 1);
        s._active = false;
        if (s.onRest) s.onRest(s.value);
      }
    }
    if (live.length) { w.requestAnimationFrame(tick); }
    else { ticking = false; lastT = 0; }
  }

  function wake() {
    if (!ticking) { ticking = true; lastT = 0; w.requestAnimationFrame(tick); }
  }

  /* ── Spring ────────────────────────────────────────────────────────────
     Parameterised the way Apple parameterises them for designers — damping
     ratio and response — not mass/stiffness/damping.

       damping  1.0  = critically damped, settles without overshoot (default)
                0.8  = a little bounce; use ONLY after a momentum gesture
       response      = how quickly it reaches the target, in seconds.
                       Not a duration — a spring has no fixed duration.       */
  function Spring(opts) {
    opts = opts || {};
    this.value = opts.from || 0;
    this.target = opts.to != null ? opts.to : this.value;
    this.velocity = opts.velocity || 0;
    this.response = opts.response || 0.4;
    this.damping = opts.damping != null ? opts.damping : 1.0;
    this.epsilon = opts.epsilon || 0.01;
    this.onUpdate = opts.onUpdate || null;
    this.onRest = opts.onRest || null;
    this.resting = true;
    this._active = false;
  }

  Spring.prototype._step = function (dt) {
    /* Sub-step so that a stiff spring stays stable at low frame rates.
       Semi-implicit Euler at <=1/240s is well inside the stability bound for
       the response values UI actually uses. */
    var steps = Math.max(1, Math.ceil(dt / (1 / 240)));
    var h = dt / steps;
    var w0 = (2 * Math.PI) / this.response;
    var z = this.damping;

    for (var i = 0; i < steps; i++) {
      var x = this.value - this.target;
      var a = -(w0 * w0) * x - 2 * z * w0 * this.velocity;
      this.velocity += a * h;
      this.value += this.velocity * h;
    }

    /* At rest when both the displacement and the energy are negligible.
       Checking position alone would freeze a spring at full speed as it
       crosses the target. */
    if (Math.abs(this.value - this.target) < this.epsilon &&
        Math.abs(this.velocity) < this.epsilon * 10) {
      this.value = this.target;
      this.velocity = 0;
      this.resting = true;
    } else {
      this.resting = false;
    }
    if (this.onUpdate) this.onUpdate(this.value, this.velocity);
  };

  /* Re-target. This is the interruption path, and the important thing is what
     it does NOT do: it never resets `value` or `velocity`. The spring keeps
     travelling from exactly where it is, at exactly the speed it had, so a
     reversal blends instead of hitting a brick wall. */
  Spring.prototype.to = function (target, opts) {
    opts = opts || {};
    this.target = target;
    if (opts.response != null) this.response = opts.response;
    if (opts.damping != null) this.damping = opts.damping;
    /* Velocity is *added*, not replaced — handing off a gesture's velocity to
       a spring that is already moving should compose, not clobber. */
    if (opts.velocity != null) this.velocity = opts.velocity;
    if (opts.addVelocity) this.velocity += opts.addVelocity;

    if (!motionOK()) {
      /* Reduced motion: arrive immediately. The value still changes and
         onUpdate still fires, so components keep working — they just don't
         travel through space. */
      this.value = target;
      this.velocity = 0;
      this.resting = true;
      if (this.onUpdate) this.onUpdate(this.value, 0);
      if (this.onRest) this.onRest(this.value);
      return this;
    }

    this.resting = false;
    if (!this._active) { this._active = true; live.push(this); wake(); }
    return this;
  };

  /* Jump without animating — for initial layout, or a hard reset. */
  Spring.prototype.set = function (v) {
    this.value = this.target = v;
    this.velocity = 0;
    this.resting = true;
    if (this.onUpdate) this.onUpdate(v, 0);
    return this;
  };

  /* Take manual control (a gesture is now driving the value directly). */
  Spring.prototype.stop = function () {
    this.target = this.value;
    this.velocity = 0;
    this.resting = true;
    return this;
  };

  /* ── momentum projection ───────────────────────────────────────────────
     Where would this come to rest if the user let go now? Snapping to the
     nearest point from the *release position* ignores the throw; snapping to
     the nearest point from the *projected* position is what makes a flick
     feel like it threw the thing.

     This is the exponential-decay form Apple ships in the Fluid Interfaces
     sample code, not the v²/2a from a physics textbook. */
  function project(velocity, decelerationRate) {
    var dr = decelerationRate == null ? 0.998 : decelerationRate;
    return (velocity / 1000) * dr / (1 - dr);
  }

  /* ── rubber-banding ────────────────────────────────────────────────────
     Past a boundary, follow the finger less and less. A hard stop reads as
     "frozen"; progressive resistance reads as "responsive, but this is the
     end". */
  function rubberband(overshoot, dimension, constant) {
    var c = constant == null ? 0.55 : constant;
    return (overshoot * dimension * c) / (dimension + c * Math.abs(overshoot));
  }

  /* ── velocity tracker ──────────────────────────────────────────────────
     The last pointermove alone is noisy and often reports ~0 because the
     final event lands in the same millisecond. Fit against a short history
     instead. */
  function VelocityTracker(windowMs) {
    this.win = windowMs || 100;
    this.samples = [];
  }
  VelocityTracker.prototype.add = function (v, t) {
    t = t == null ? performance.now() : t;
    this.samples.push({ v: v, t: t });
    var cutoff = t - this.win;
    while (this.samples.length > 2 && this.samples[0].t < cutoff) this.samples.shift();
  };
  VelocityTracker.prototype.velocity = function () {
    var s = this.samples;
    if (s.length < 2) return 0;
    var first = s[0], last = s[s.length - 1];
    var dt = (last.t - first.t) / 1000;
    if (dt <= 0) return 0;
    return (last.v - first.v) / dt;   /* px per second */
  };
  VelocityTracker.prototype.reset = function () { this.samples.length = 0; };

  /* ── pressable ─────────────────────────────────────────────────────────
     Feedback on pointer-DOWN, never on click. The moment feedback waits for
     touch-up, directness "falls off a cliff".

     Also honours cancel-by-dragging-away-and-back, and a little hysteresis,
     so a press is forgiving of a shaky finger. */
  var PRESS_SLOP = 12;

  function pressable(el, opts) {
    opts = opts || {};
    var scale = opts.scale == null ? 0.97 : opts.scale;
    var s = new Spring({ from: 1, response: 0.25, damping: 1.0 });
    var down = false, startX = 0, startY = 0, pid = null;

    s.onUpdate = function (v) {
      el.style.transform = (opts.transform ? opts.transform + ' ' : '') + 'scale(' + v + ')';
    };

    function press(e) {
      if (e.button != null && e.button !== 0) return;
      down = true; pid = e.pointerId;
      startX = e.clientX; startY = e.clientY;
      el.classList.add('fl-pressed');
      /* No bounce on the way down — this is a direct response to a finger,
         not a thrown object. */
      s.to(scale, { response: 0.18, damping: 1.0 });
    }
    function release() {
      if (!down) return;
      down = false; pid = null;
      el.classList.remove('fl-pressed');
      s.to(1, { response: 0.32, damping: 0.75 });
    }
    function move(e) {
      if (!down || (pid != null && e.pointerId !== pid)) return;
      var far = Math.abs(e.clientX - startX) > PRESS_SLOP * 3 ||
                Math.abs(e.clientY - startY) > PRESS_SLOP * 3;
      /* Dragged away: let go visually, but stay armed so coming back
         re-presses. */
      if (far && el.classList.contains('fl-pressed')) {
        el.classList.remove('fl-pressed');
        s.to(1, { response: 0.3, damping: 1.0 });
      } else if (!far && !el.classList.contains('fl-pressed')) {
        el.classList.add('fl-pressed');
        s.to(scale, { response: 0.18, damping: 1.0 });
      }
    }

    el.addEventListener('pointerdown', press);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', release);
    el.addEventListener('pointercancel', release);
    el.addEventListener('pointerleave', function () { if (down) move({ clientX: 1e9, clientY: 1e9, pointerId: pid }); });
    return { spring: s, destroy: function () { el.removeEventListener('pointerdown', press); } };
  }

  /* ── reveal on scroll ──────────────────────────────────────────────────
     Spring-based rather than a CSS transition, so a fast scroll that brings
     several rows in at once still staggers coherently. */
  function reveal(selector, opts) {
    opts = opts || {};
    var els = typeof selector === 'string' ? d.querySelectorAll(selector) : selector;
    if (!('IntersectionObserver' in w)) {
      Array.prototype.forEach.call(els, function (el) { el.classList.add('fl-in'); });
      return;
    }
    var dist = opts.distance == null ? 26 : opts.distance;
    var stagger = opts.stagger == null ? 60 : opts.stagger;
    var seen = 0, lastBatch = 0;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        var el = en.target;
        var now = performance.now();
        if (now - lastBatch > 240) seen = 0;
        lastBatch = now;
        var delay = Math.min(seen++, 6) * stagger;

        if (!motionOK()) {
          setTimeout(function () { el.classList.add('fl-in'); el.style.opacity = 1; el.style.transform = 'none'; }, delay);
          return;
        }
        setTimeout(function () {
          el.classList.add('fl-in');
          var s = new Spring({ from: 0, response: 0.62, damping: 1.0 });
          s.onUpdate = function (v) {
            el.style.opacity = Math.min(1, v * 1.6);
            el.style.transform = 'translate3d(0,' + ((1 - v) * dist).toFixed(2) + 'px,0)';
          };
          s.onRest = function () { el.style.transform = 'none'; el.style.willChange = 'auto'; };
          el.style.willChange = 'transform, opacity';
          s.to(1);
        }, delay);
      });
    }, { rootMargin: opts.rootMargin || '0px 0px -12% 0px', threshold: 0.05 });

    Array.prototype.forEach.call(els, function (el) { el.classList.add('fl-rv'); io.observe(el); });
    return io;
  }

  /* ── Scrubber ──────────────────────────────────────────────────────────
     A 1:1 draggable value control. Tracks the finger exactly (respecting the
     grab offset), rubber-bands past the ends, and on release projects
     momentum forward and springs to the snap point nearest where the gesture
     was *going*.

     Keyboard-operable, because a gesture-only control excludes people. */
  function Scrubber(el, opts) {
    opts = opts || {};
    var self = this;
    var min = opts.min || 0, max = opts.max == null ? 1 : opts.max;
    var snaps = opts.snaps || null;          /* array of values, or null for continuous */
    var onChange = opts.onChange || function () {};
    var onCommit = opts.onCommit || function () {};

    this.value = opts.value == null ? min : opts.value;
    var spring = new Spring({ from: this.value, response: 0.35, damping: 1.0 });
    var tracker = new VelocityTracker(110);
    var dragging = false, pid = null, grabDX = 0, width = 1, moved = false;

    spring.onUpdate = function (v) { self.value = v; onChange(v, dragging); };

    function clampToTrack(px) {
      var v = min + (px / width) * (max - min);
      return v;
    }
    function nearestSnap(v) {
      if (!snaps || !snaps.length) return Math.max(min, Math.min(max, v));
      var best = snaps[0], bd = Math.abs(v - snaps[0]);
      for (var i = 1; i < snaps.length; i++) {
        var dd = Math.abs(v - snaps[i]);
        if (dd < bd) { bd = dd; best = snaps[i]; }
      }
      return best;
    }

    function down(e) {
      if (e.button != null && e.button !== 0) return;
      width = el.clientWidth || 1;
      dragging = true; moved = false; pid = e.pointerId;
      el.setPointerCapture(e.pointerId);
      el.classList.add('fl-grabbing');
      /* Grab the *current on-screen value*, so an interrupted animation is
         picked up exactly where it visually is. */
      spring.stop();
      var rect = el.getBoundingClientRect();
      var handlePx = ((self.value - min) / (max - min)) * width;
      var pointerPx = e.clientX - rect.left;
      /* If the press lands on the handle, keep the offset so the handle does
         not jump under the finger. If it lands on the track, treat it as a
         direct set — that is what a track press means. */
      grabDX = Math.abs(pointerPx - handlePx) < 26 ? (pointerPx - handlePx) : 0;
      if (grabDX === 0) {
        var v0 = clampToTrack(pointerPx);
        spring.to(Math.max(min, Math.min(max, v0)), { response: 0.28, damping: 1.0 });
      }
      tracker.reset();
      tracker.add(pointerPx);
      e.preventDefault();
    }

    function move(e) {
      if (!dragging || e.pointerId !== pid) return;
      moved = true;
      var rect = el.getBoundingClientRect();
      var px = e.clientX - rect.left - grabDX;
      tracker.add(px);
      var v = clampToTrack(px);

      /* Soft ends rather than a hard clamp. */
      if (v < min) v = min - unscale(rubberband(scale(min - v), width, 0.55));
      else if (v > max) v = max + unscale(rubberband(scale(v - max), width, 0.55));

      spring.set(v);          /* 1:1 with the finger — no smoothing lag */
      onChange(v, true);
    }
    function scale(vDelta) { return (vDelta / (max - min)) * width; }
    function unscale(pxDelta) { return (pxDelta / width) * (max - min); }

    function up(e) {
      if (!dragging || (pid != null && e.pointerId !== pid)) return;
      dragging = false; pid = null;
      el.classList.remove('fl-grabbing');

      var vpx = tracker.velocity();                 /* px/s */
      var vval = unscale(vpx);                      /* value units/s */
      var projected = self.value + unscale(project(vpx, opts.deceleration || 0.9975));
      var target = nearestSnap(Math.max(min, Math.min(max, projected)));

      /* Bounce is earned here: the gesture carried momentum. A control the
         user merely tapped springs home critically damped instead. */
      var flicked = Math.abs(vpx) > 90;
      spring.to(target, {
        velocity: vval,
        response: flicked ? 0.34 : 0.3,
        damping: flicked ? 0.82 : 1.0
      });
      spring.onRest = function (v) { onCommit(v); };
      if (!moved) onCommit(target);
    }

    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);

    /* Keyboard parity. */
    el.addEventListener('keydown', function (e) {
      var step = (max - min) / (snaps ? Math.max(1, snaps.length - 1) : 20);
      var dir = 0;
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') dir = 1;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') dir = -1;
      else if (e.key === 'Home') { commitTo(min); e.preventDefault(); return; }
      else if (e.key === 'End') { commitTo(max); e.preventDefault(); return; }
      if (!dir) return;
      e.preventDefault();
      if (snaps && snaps.length) {
        var idx = snaps.indexOf(nearestSnap(self.value));
        idx = Math.max(0, Math.min(snaps.length - 1, idx + dir));
        commitTo(snaps[idx]);
      } else {
        commitTo(Math.max(min, Math.min(max, self.value + dir * step)));
      }
    });

    function commitTo(v) {
      spring.to(v, { response: 0.3, damping: 1.0 });
      spring.onRest = function (val) { onCommit(val); };
    }

    this.setValue = function (v, animate) {
      if (animate === false) { spring.set(v); onChange(v, false); onCommit(v); }
      else commitTo(v);
    };
    this.spring = spring;
    onChange(this.value, false);
  }

  /* ── Deck ──────────────────────────────────────────────────────────────
     A draggable, snapping horizontal deck of cards with depth. X is the only
     gesture axis; the depth/scale/rotation of each card is derived from its
     distance to centre, so everything stays in sync with one spring rather
     than several that can drift apart.  */
  function Deck(track, opts) {
    opts = opts || {};
    var self = this;
    var cards = Array.prototype.slice.call(track.children);
    if (!cards.length) return;
    var n = cards.length;
    var index = opts.index || 0;
    var onChange = opts.onChange || function () {};

    var pos = new Spring({ from: index, response: 0.42, damping: 1.0 });
    var tracker = new VelocityTracker(110);
    var dragging = false, pid = null, startX = 0, startPos = 0, unit = 300, decided = false;

    function layout() {
      unit = Math.min(opts.unit || 320, (track.clientWidth || 900) * 0.62);
      render(pos.value);
    }

    function render(p) {
      for (var i = 0; i < n; i++) {
        var off = i - p;                                  /* signed distance from centre, in cards */
        var ab = Math.abs(off);
        var clamped = Math.max(-3.2, Math.min(3.2, off));
        /* Cards compress as they recede rather than marching linearly, so a
           long deck stays inside the frame. */
        var x = Math.sign(clamped) * Math.pow(Math.abs(clamped), 0.82) * unit * 0.58;
        var scale = Math.max(0.66, 1 - ab * 0.14);
        var rotY = -clamped * 22;
        var z = -ab * 90;
        var op = ab > 3 ? 0 : Math.max(0.15, 1 - ab * 0.26);
        var c = cards[i];
        c.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,' + z.toFixed(1) + 'px) ' +
                            'rotateY(' + rotY.toFixed(2) + 'deg) scale(' + scale.toFixed(3) + ')';
        c.style.opacity = op.toFixed(3);
        c.style.zIndex = String(100 - Math.round(ab * 10));
        c.style.pointerEvents = ab < 0.5 ? 'auto' : 'none';
        c.classList.toggle('fl-deck-active', ab < 0.5);
        c.setAttribute('aria-hidden', ab < 0.5 ? 'false' : 'true');
      }
    }
    pos.onUpdate = function (p) { render(p); };

    function down(e) {
      if (e.button != null && e.button !== 0) return;
      dragging = true; decided = false; pid = e.pointerId;
      startX = e.clientX; startPos = pos.value;
      pos.stop();                                   /* grab it mid-flight */
      track.setPointerCapture(e.pointerId);
      track.classList.add('fl-grabbing');
      tracker.reset(); tracker.add(e.clientX);
    }
    function move(e) {
      if (!dragging || e.pointerId !== pid) return;
      var dx = e.clientX - startX;
      /* Hysteresis: don't commit to a horizontal drag until the intent is
         clear, so a vertical page scroll that starts on a card still scrolls. */
      if (!decided) {
        if (Math.abs(dx) < 10) return;
        decided = true;
      }
      tracker.add(e.clientX);
      var p = startPos - dx / (unit * 0.58);
      if (p < 0) p = -unscaleCards(rubberband(cardsToPx(-p), track.clientWidth || 600, 0.5));
      else if (p > n - 1) p = (n - 1) + unscaleCards(rubberband(cardsToPx(p - (n - 1)), track.clientWidth || 600, 0.5));
      pos.set(p);
      e.preventDefault();
    }
    function cardsToPx(c) { return c * unit * 0.58; }
    function unscaleCards(px) { return px / (unit * 0.58); }

    function up(e) {
      if (!dragging || (pid != null && e.pointerId !== pid)) return;
      dragging = false; pid = null;
      track.classList.remove('fl-grabbing');
      if (!decided) return;

      var vpx = tracker.velocity();
      var vcards = -vpx / (unit * 0.58);
      var projected = pos.value + -unscaleCards(project(vpx, 0.994));
      var target = Math.max(0, Math.min(n - 1, Math.round(projected)));
      var flicked = Math.abs(vpx) > 110;
      pos.to(target, {
        velocity: vcards,
        response: flicked ? 0.4 : 0.36,
        damping: flicked ? 0.8 : 1.0
      });
      if (target !== index) { index = target; onChange(index, cards[index]); }
    }

    track.addEventListener('pointerdown', down);
    track.addEventListener('pointermove', move);
    track.addEventListener('pointerup', up);
    track.addEventListener('pointercancel', up);
    w.addEventListener('resize', layout);

    this.go = function (i, fromVelocity) {
      i = Math.max(0, Math.min(n - 1, i));
      index = i;
      pos.to(i, { response: 0.42, damping: fromVelocity ? 0.8 : 1.0, velocity: fromVelocity || 0 });
      onChange(index, cards[index]);
    };
    this.next = function () { self.go(index + 1); };
    this.prev = function () { self.go(index - 1); };
    this.index = function () { return index; };
    this.cards = cards;
    this.refresh = layout;

    pos.set(index);
    layout();
  }

  /* ── scroll edge effect ────────────────────────────────────────────────
     Floating chrome should reveal a material as content slides under it,
     rather than being separated by a permanent 1px rule that is wrong
     whenever nothing is beneath it. */
  function scrollEdge(el, opts) {
    opts = opts || {};
    var after = opts.after == null ? 12 : opts.after;
    var raf = 0;
    function update() {
      raf = 0;
      var on = (w.scrollY || d.documentElement.scrollTop) > after;
      el.classList.toggle('fl-edge', on);
    }
    function onScroll() { if (!raf) raf = w.requestAnimationFrame(update); }
    w.addEventListener('scroll', onScroll, { passive: true });
    update();
  }

  /* ── count-up ──────────────────────────────────────────────────────────
     Numbers arrive by springing to their value, so a figure that changes
     while it is still animating re-targets instead of restarting. */
  function counter(el, opts) {
    opts = opts || {};
    var fmt = opts.format || function (v) { return Math.round(v).toLocaleString('en-GB'); };
    var s = new Spring({ from: opts.from || 0, response: opts.response || 0.7, damping: 1.0, epsilon: opts.epsilon || 0.5 });
    s.onUpdate = function (v) { el.textContent = fmt(v); };
    s.set(opts.from || 0);
    return {
      to: function (v) { s.to(v); },
      set: function (v) { s.set(v); },
      spring: s
    };
  }

  /* ── haptics ───────────────────────────────────────────────────────────
     Fired on the causal event only, and only for moments that matter
     (a snap, a commit). Over-feedback trains people to ignore all of it. */
  function haptic(ms) {
    if (!motionOK()) return;
    if (w.navigator && w.navigator.vibrate) { try { w.navigator.vibrate(ms || 8); } catch (e) {} }
  }

  w.Fluid = {
    Spring: Spring,
    VelocityTracker: VelocityTracker,
    project: project,
    rubberband: rubberband,
    pressable: pressable,
    reveal: reveal,
    Scrubber: Scrubber,
    Deck: Deck,
    scrollEdge: scrollEdge,
    counter: counter,
    haptic: haptic,
    motionOK: motionOK,
    transparencyOK: transparencyOK,
    contrastBoost: contrastBoost
  };

  /* ── auto-wiring ───────────────────────────────────────────────────────
     Anything marked [data-press] gets instant press feedback, and [data-rv]
     gets a spring reveal, with no per-page JS. */
  function boot() {
    Array.prototype.forEach.call(d.querySelectorAll('[data-press]'), function (el) { pressable(el); });
    var rv = d.querySelectorAll('[data-rv]');
    if (rv.length) reveal(rv);
    Array.prototype.forEach.call(d.querySelectorAll('[data-scroll-edge]'), function (el) { scrollEdge(el); });
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', boot);
  else boot();

})(window, document);
