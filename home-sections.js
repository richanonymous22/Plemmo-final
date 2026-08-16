/* ==========================================================================
   PLEMMO — home-sections.js
   Behaviour for the homepage narrative sections.

   The only real interaction here is the photo that follows the pointer down
   the "What are you trying to sort out?" list. It exists because the choice
   is easier to make when you can see the thing: a card machine looks
   different from a menu board, and the row you're considering should show
   you which is which without you having to click.

   Driven by springs from fluid.js rather than a CSS transition, so the image
   trails the pointer with weight instead of snapping, and can be redirected
   mid-flight when you move to another row.
   ========================================================================== */
(function (w, d) {
  'use strict';

  function init() {
    var F = w.Fluid;
    var list = d.getElementById('sortList');
    var peek = d.getElementById('sortPeek');
    if (!F || !list || !peek) return;

    /* Pointer-following imagery is a desktop affordance; on touch there is no
       hover to follow, and the CSS shows the rows without it. */
    if (!w.matchMedia || !w.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    var img = peek.querySelector('img');
    var W = 320, H = 220;

    /* X and Y get their own springs — a single spring on the 2D distance
       desyncs the moment the two axes carry different velocities. */
    var sx = new F.Spring({ from: 0, response: 0.45, damping: 1.0 });
    var sy = new F.Spring({ from: 0, response: 0.42, damping: 1.0 });
    var so = new F.Spring({ from: 0, response: 0.3, damping: 1.0 });
    var current = null;

    function paint() {
      peek.style.transform = 'translate3d(' + sx.value.toFixed(1) + 'px,' + sy.value.toFixed(1) + 'px,0) ' +
                             'scale(' + (0.92 + so.value * 0.08).toFixed(3) + ')';
      peek.style.opacity = Math.max(0, Math.min(1, so.value)).toFixed(3);
    }
    sx.onUpdate = paint; sy.onUpdate = paint; so.onUpdate = paint;

    function place(e, jump) {
      /* Offset from the cursor so the image never sits under the pointer and
         hides the row being read. */
      var x = e.clientX + 28;
      var y = e.clientY - H / 2;
      x = Math.min(x, w.innerWidth - W - 16);
      y = Math.max(12, Math.min(y, w.innerHeight - H - 12));
      if (jump) { sx.set(x); sy.set(y); } else { sx.to(x); sy.to(y); }
    }

    list.addEventListener('pointerover', function (e) {
      var row = e.target.closest && e.target.closest('.sort-row');
      if (!row || row === current) return;
      var src = row.getAttribute('data-peek');
      if (!src) return;
      /* First reveal jumps into place; moving between rows keeps the
         position and just swaps the picture, so the image travels with you
         rather than restarting from nowhere. */
      var first = current === null;
      current = row;
      img.src = src;
      place(e, first);
      so.to(1);
    });

    list.addEventListener('pointermove', function (e) { if (current) place(e, false); });

    list.addEventListener('pointerleave', function () {
      current = null;
      so.to(0);
    });
  }

  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', init);
  else init();
})(window, document);
