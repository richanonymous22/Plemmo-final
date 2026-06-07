/* ==========================================================================
   PLEMMO — shared site behaviour (nav, mobile menu, reveal, FAQ, counters,
   marquee, sticky CTA, scroll bar, global enquiry modal). Used by all inner
   service pages. Page-specific interactions live in each page.
   Exposes window.PlemmoModal.open({service, product}).
   ========================================================================== */
(function(){
  'use strict';
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* nav scroll + progress + sticky */
  var nav=document.getElementById('nav'),sb=document.getElementById('scrollbar'),sticky=document.getElementById('sticky');
  function onScroll(){
    if(nav)nav.classList.toggle('scrolled',scrollY>20);
    if(sb){var h=document.documentElement.scrollHeight-innerHeight;sb.style.width=(h>0?scrollY/h*100:0)+'%';}
    if(sticky)sticky.classList.toggle('show',scrollY>620);
  }
  addEventListener('scroll',onScroll,{passive:true});onScroll();

  /* mobile menu */
  var mm=document.getElementById('mm'),burger=document.getElementById('burger');
  if(mm&&burger){
    burger.onclick=function(){mm.classList.add('open');document.body.style.overflow='hidden'};
    function close(){mm.classList.remove('open');document.body.style.overflow=''}
    mm.querySelectorAll('[data-mmclose]').forEach(function(e){e.onclick=close});
    mm.querySelectorAll('a').forEach(function(a){a.addEventListener('click',close)});
  }

  /* reveal w/ stagger for grid groups */
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.12});
  document.querySelectorAll('.rv').forEach(function(el){io.observe(el)});
  document.querySelectorAll('[data-stagger]').forEach(function(g){Array.prototype.forEach.call(g.children,function(c,i){c.style.transitionDelay=(i*0.07)+'s'})});

  /* count-up */
  function fmt(n,dec){return dec?n.toFixed(dec):Math.round(n).toLocaleString('en-GB')}
  var cio=new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;cio.unobserve(e.target);
    var el=e.target,t=parseFloat(el.dataset.count),dec=+el.dataset.dec||0,pre=el.dataset.prefix||'',suf=el.dataset.suffix||'';
    if(reduce){el.textContent=pre+fmt(t,dec)+suf;return}
    var t0=performance.now();(function step(now){var p=Math.min(1,(now-t0)/1500),e2=1-Math.pow(1-p,3);el.textContent=pre+fmt(t*e2,dec)+suf;if(p<1)requestAnimationFrame(step)})(t0);
  })},{threshold:.6});
  document.querySelectorAll('[data-count]').forEach(function(el){cio.observe(el)});

  /* marquee seamless */
  document.querySelectorAll('.mq-track').forEach(function(mq){mq.innerHTML+=mq.innerHTML});

  /* FAQ accordion */
  document.querySelectorAll('.faq').forEach(function(it){
    var q=it.querySelector('.faq-q');if(!q)return;
    q.onclick=function(){
      var open=it.classList.contains('open'),parent=it.closest('.faqlist')||document;
      parent.querySelectorAll('.faq').forEach(function(i){i.classList.remove('open');var a=i.querySelector('.faq-a');if(a)a.style.maxHeight=null});
      if(!open){it.classList.add('open');var a=it.querySelector('.faq-a');if(a)a.style.maxHeight=a.scrollHeight+'px'}
    };
  });

  /* card tilt (pointer:fine, not reduced) */
  if(!reduce&&matchMedia('(pointer:fine)').matches){
    document.querySelectorAll('.tilt').forEach(function(c){
      c.addEventListener('mousemove',function(ev){var r=c.getBoundingClientRect(),x=(ev.clientX-r.left)/r.width-.5,y=(ev.clientY-r.top)/r.height-.5;c.style.transform='translateY(-7px) rotateX('+(-y*5)+'deg) rotateY('+(x*5)+'deg)'});
      c.addEventListener('mouseleave',function(){c.style.transform=''});
    });
  }

  /* ── global enquiry modal ── */
  var modal=document.getElementById('modal');
  if(modal){
    var fw=modal.querySelector('#mform-wrap'),sw=modal.querySelector('#msuccess'),form=modal.querySelector('#mform'),
        serviceSel=modal.querySelector('#mservice'),prodField=modal.querySelector('#mprod'),lastF=null;
    function open(o){o=o||{};lastF=document.activeElement;if(fw)fw.style.display='';if(sw)sw.style.display='none';
      if(o.service&&serviceSel)serviceSel.value=o.service;if(prodField)prodField.value=o.product||'';
      modal.classList.add('open');document.body.style.overflow='hidden';
      var f=modal.querySelector('input,select,button');if(f)setTimeout(function(){f.focus()},60);}
    function close(){modal.classList.remove('open');document.body.style.overflow='';if(lastF&&lastF.focus)lastF.focus()}
    document.querySelectorAll('[data-quote]').forEach(function(t){t.addEventListener('click',function(e){e.preventDefault();open({service:t.getAttribute('data-service'),product:t.getAttribute('data-product')})})});
    modal.querySelector('.modal-bd').addEventListener('click',close);
    modal.querySelectorAll('[data-close]').forEach(function(b){b.addEventListener('click',close)});
    addEventListener('keydown',function(e){if(e.key==='Escape'&&modal.classList.contains('open'))close()});
    modal.addEventListener('keydown',function(e){if(e.key!=='Tab')return;var f=modal.querySelectorAll('a[href],button:not([disabled]),input,select,textarea');if(!f.length)return;var a=f[0],b=f[f.length-1];if(e.shiftKey&&document.activeElement===a){e.preventDefault();b.focus()}else if(!e.shiftKey&&document.activeElement===b){e.preventDefault();a.focus()}});
    if(form)form.addEventListener('submit',function(e){
      e.preventDefault();
      var btn=form.querySelector('button[type=submit]');if(btn){btn.disabled=true;btn.textContent='Sending…';}
      var fd=new FormData(form);fd.append('_cc','hello@plemmo.co.uk');fetch('https://formsubmit.co/ajax/plemmouk@gmail.com',{method:'POST',headers:{'Accept':'application/json'},body:fd})
        .finally(function(){if(fw)fw.style.display='none';if(sw)sw.style.display='block';});
    });
    window.PlemmoModal={open:open,close:close};
  }
})();
