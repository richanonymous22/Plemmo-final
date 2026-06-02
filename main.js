document.addEventListener('DOMContentLoaded', () => {

  // Sync GSAP (Lenis removed)
  gsap.registerPlugin(ScrollTrigger);

  // 1. Mobile Menu Logic
  const hamburgerBtn = document.querySelector('.hamburger-btn');
  const closeMenuBtn = document.querySelector('.close-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileLinks = document.querySelectorAll('.mobile-menu-content a');

  function toggleMobileMenu() {
    mobileMenu.classList.toggle('active');
    const isActive = mobileMenu.classList.contains('active');
    hamburgerBtn.setAttribute('aria-expanded', isActive);
    document.body.style.overflow = isActive ? 'hidden' : '';
  }

  if (hamburgerBtn && closeMenuBtn && mobileMenu) {
    hamburgerBtn.addEventListener('click', toggleMobileMenu);
    closeMenuBtn.addEventListener('click', toggleMobileMenu);
    
    // Close on link click
    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (mobileMenu.classList.contains('active')) toggleMobileMenu();
      });
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
        toggleMobileMenu();
      }
    });

    // Close on Backdrop click
    const backdrop = document.querySelector('.mobile-menu-backdrop');
    if (backdrop) {
      backdrop.addEventListener('click', toggleMobileMenu);
    }
  }

  // 2. Custom Cursor Logic
  const cursorDot = document.querySelector('.cursor-dot');
  
  if(window.innerWidth > 1024) {
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let dotX = mouseX;
    let dotY = mouseY;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    // Smooth lerp for single cursor
    const renderCursor = () => {
      dotX += (mouseX - dotX) * 0.2;
      dotY += (mouseY - dotY) * 0.2;
      gsap.set(cursorDot, { x: dotX, y: dotY });
      requestAnimationFrame(renderCursor);
    };
    renderCursor();

    // Hover states for cursor
    const interactiveElements = document.querySelectorAll('a, button, .magnetic');
    interactiveElements.forEach(el => {
      el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
      el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    });
  }

  // 3. Magnetic Buttons / Elements
  const magneticEls = document.querySelectorAll('.magnetic');
  magneticEls.forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const h = rect.width / 2;
      const v = rect.height / 2;
      const x = e.clientX - rect.left - h;
      const y = e.clientY - rect.top - v;
      
      const strength = btn.dataset.strength || 20;
      
      gsap.to(btn, {
        x: (x / h) * strength,
        y: (y / v) * strength,
        duration: 0.4,
        ease: 'power2.out'
      });
    });

    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.3)' });
    });
  });



  // 6. Standard Reveals
  const revealUp = document.querySelectorAll('.reveal-up');
  revealUp.forEach((el) => {
    gsap.from(el, {
      y: 80,
      opacity: 0,
      duration: 1.2,
      ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 85%", toggleActions: "play none none none" }
    });
  });

  const revealLeft = document.querySelectorAll('.reveal-left');
  revealLeft.forEach((el) => {
    gsap.from(el, {
      x: -80, opacity: 0, duration: 1.2, ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 80%", toggleActions: "play none none none" }
    });
  });

  const revealRight = document.querySelectorAll('.reveal-right');
  revealRight.forEach((el) => {
    gsap.from(el, {
      x: 80, opacity: 0, duration: 1.2, ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 80%", toggleActions: "play none none none" }
    });
  });

  // 7. Sleek Horizontal Gallery
  const gallerySection = document.querySelector('.sleek-gallery-section');
  const galleryTrack = document.querySelector('.gallery-track');
  
  if(gallerySection && galleryTrack && window.innerWidth > 768) {
    let scrollTween = gsap.to(galleryTrack, {
      x: () => -(galleryTrack.scrollWidth - window.innerWidth) + "px",
      ease: "none",
      scrollTrigger: {
        trigger: gallerySection,
        pin: true,
        scrub: 1,
        end: () => "+=" + galleryTrack.scrollWidth
      }
    });

    // Parallax & Reveal within horizontal scroll
    gsap.utils.toArray('.product-panel').forEach(panel => {
      const img = panel.querySelector('.sleek-img');
      const metaLeft = panel.querySelector('.meta-left');
      const metaRight = panel.querySelector('.meta-right');
      
      // Slight parallax on image while scrolling horizontally
      if(img) {
        gsap.to(img, {
          x: 150,
          ease: "none",
          scrollTrigger: {
            trigger: panel,
            containerAnimation: scrollTween,
            start: "left right",
            end: "right left",
            scrub: true
          }
        });
      }

      // Fade up meta text
      if(metaLeft && metaRight) {
        gsap.from([metaLeft, metaRight], {
          y: 40,
          opacity: 0,
          stagger: 0.1,
          scrollTrigger: {
            trigger: panel,
            containerAnimation: scrollTween,
            start: "left 70%",
            toggleActions: "play none none reverse"
          }
        });
      }
    });
  }

  // 7.5 Global 3D Tilt Effect - DISABLED per user request
  const tiltElements = document.querySelectorAll('.tilt-element');
  // Card components remain still. Removed mousemove/parallax tracking logic.
  
  // 7.6 Section Transitions (Micro-animations)
  gsap.utils.toArray('section').forEach(sec => {
    // Skip the horizontal scroll and showcase sections to avoid breaking their specialized layouts/fixed elements
    if(sec.classList.contains('sleek-gallery-section') || sec.classList.contains('horizontal-scroll-section') || sec.classList.contains('showcase-section')) return;
    
    gsap.from(sec, {
      opacity: 0,
      y: 30,
      duration: 1,
      ease: 'power2.out',
      clearProps: "all",
      scrollTrigger: {
        trigger: sec,
        start: "top 85%",
        toggleActions: "play none none reverse"
      }
    });
  });

  // 8. Live ROI Calculator Engine
  const slider = document.getElementById('turnover-slider');
  const display = document.getElementById('turnover-display');
  const oldFee = document.getElementById('old-fee');
  const plemmoFee = document.getElementById('plemmo-fee');
  const totalSavings = document.getElementById('total-savings');
  const sliderFill = document.getElementById('slider-fill');
  
  if(slider) {
    const formatCurrency = (num) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);
    
    slider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      
      // Update sleek slider fill
      const min = parseInt(slider.min) || 5000;
      const max = parseInt(slider.max) || 250000;
      const percentage = ((val - min) / (max - min)) * 100;
      if (sliderFill) {
         sliderFill.style.width = `${percentage}%`;
      }
      
      // Calculate rates: Average market rate ~1.5%, Plemmo blended rate ~0.9%
      const avgRate = 0.015;
      const plemmoRate = 0.009;
      
      const oldVal = val * avgRate;
      const plemmoVal = val * plemmoRate;
      const savings = oldVal - plemmoVal;

      display.textContent = formatCurrency(val);
      oldFee.textContent = formatCurrency(oldVal);
      plemmoFee.textContent = formatCurrency(plemmoVal);
      totalSavings.textContent = formatCurrency(savings);

      // Animate width bars
      const maxFee = max * avgRate; // The absolute max old fee
      document.querySelector('.old-bar').style.width = Math.max((oldVal / maxFee) * 100, 5) + '%';
      document.querySelector('.plemmo-bar').style.width = Math.max((plemmoVal / maxFee) * 100, 5) + '%';
    });
    // Initialize calculator on page load
    slider.dispatchEvent(new Event('input'));

    // Recommendation Reveal Animation
    const claimBtn = document.getElementById('claim-savings-btn');
    const recPanel = document.getElementById('recommendation-panel');
    const recTurnover = document.getElementById('rec-turnover');
    
    if(claimBtn && recPanel) {
      claimBtn.addEventListener('click', (e) => {
        e.preventDefault();
        // Update recommended turnover text
        recTurnover.textContent = display.textContent;
        
        // Ensure panel is visible but transparent to animate
        recPanel.style.display = 'block';
        
        // GSAP timeline for slick reveal
        const tl = gsap.timeline();
        
        // Shrink the main calc a bit
        tl.to('.calc-sleek-wrapper', {
          maxWidth: '600px',
          duration: 0.6,
          ease: 'power3.inOut'
        });
        
        // Fade and slide in the recommendation panel
        tl.to(recPanel, {
          opacity: 1,
          x: 0,
          duration: 0.6,
          ease: 'power3.out'
        }, "-=0.3"); // Overlap slightly for fluidity
        
        // Hide the claim button so it doesn't trigger again
        gsap.to(claimBtn, {
           opacity: 0,
           duration: 0.3,
           onComplete: () => { claimBtn.style.pointerEvents = 'none'; claimBtn.style.display = 'none'; }
        });
      });
    }
  }

  // Navbar Background
  // Navbar Scroll Logic
  const nav = document.querySelector('.site-nav');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  });

  // 9. Apple-Style Sticky Scroll Image Swap
  const stickySteps = document.querySelectorAll('.sticky-step');
  const stickyImages = document.querySelectorAll('.sticky-image');
  
  if (stickySteps.length > 0 && window.innerWidth > 768) {
    stickySteps.forEach((step, index) => {
      ScrollTrigger.create({
        trigger: step,
        start: "top center",
        end: "bottom center",
        onEnter: () => activateImage(index),
        onEnterBack: () => activateImage(index)
      });
    });
    
    function activateImage(index) {
      stickyImages.forEach(img => img.classList.remove('active'));
      stickySteps.forEach(s => s.classList.remove('active'));
      
      stickyImages[index].classList.add('active');
      stickySteps[index].classList.add('active');
    }
  }

  // 10. Testimonials Infinite Marquee
  const testTrack = document.getElementById('test-track');
  if(testTrack) {
    gsap.to(testTrack, {
      x: "-50%",
      ease: "none",
      duration: 25,
      repeat: -1
    });
  }


  // 11. Three.js WebGL Cinematic Background
  const webglContainer = document.getElementById('webgl-container');
  if (webglContainer && window.THREE) {
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    const heroNode = document.querySelector('.hero-section');
    renderer.setSize(window.innerWidth, heroNode.offsetHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    webglContainer.appendChild(renderer.domElement);

    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform float u_time;
      uniform vec2 u_resolution;
      varying vec2 vUv;

      // Simplex 2D noise
      vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
      float snoise(vec2 v){
        const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                 -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy) );
        vec2 x0 = v -   i + dot(i, C.xx);
        vec2 i1;
        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod(i, 289.0);
        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
        + i.x + vec3(0.0, i1.x, 1.0 ));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
          dot(x12.zw,x12.zw)), 0.0);
        m = m*m ;
        m = m*m ;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      void main() {
        vec2 st = gl_FragCoord.xy/u_resolution.xy;
        st.x *= u_resolution.x/u_resolution.y;

        vec3 color = vec3(0.0);

        vec2 pos = vec2(st*2.0);
        float n = snoise(pos - u_time * 0.1);

        // Core Plemmo Deep Navy/Black Background
        vec3 bg = vec3(0.04, 0.05, 0.08);

        // Plemmo Accent Green / Cyan Mix
        vec3 col1 = vec3(0.77, 1.0, 0.0); // #c6ff00
        vec3 col2 = vec3(0.0, 0.8, 1.0); // Electric Cyan
        vec3 col3 = vec3(0.0, 0.1, 0.3); // Deep space blue

        // Intense swirling
        float q = snoise(st + u_time * 0.15 + n * 2.0);
        float pattern = smoothstep(0.1, 1.0, q);
        
        // Final composite
        color = mix(bg, col3, pattern * 0.5);
        color = mix(color, col2, smoothstep(0.4, 0.9, q) * 0.6);
        color = mix(color, col1, smoothstep(0.6, 1.0, q) * 0.8);

        // Vignette
        float dist = distance(st, vec2(0.5, 0.5));
        color *= smoothstep(1.2, 0.2, dist);

        gl_FragColor = vec4(color, 1.0);
      }
    `;

    const uniforms = {
      u_time: { value: 0.0 },
      u_resolution: { value: new THREE.Vector2(window.innerWidth, heroNode.offsetHeight) }
    };

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      transparent: true
    });

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(mesh);

    const clock = new THREE.Clock();

    function animate() {
      requestAnimationFrame(animate);
      uniforms.u_time.value = clock.getElapsedTime();
      renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
      renderer.setSize(window.innerWidth, heroNode.offsetHeight);
      uniforms.u_resolution.value.set(window.innerWidth, heroNode.offsetHeight);
    });
  }

  // 12. Glowing Metrics Counter
  const counters = document.querySelectorAll('.counter');
  if(counters.length > 0) {
    counters.forEach(counter => {
      ScrollTrigger.create({
        trigger: counter,
        start: "top 85%",
        onEnter: () => {
          const target = parseFloat(counter.getAttribute('data-target'));
          const isDecimal = target % 1 !== 0;
          gsap.to(counter, {
            innerHTML: target,
            duration: 2.5,
            snap: { innerHTML: isDecimal ? 0.1 : 1 },
            ease: "power3.out"
          });
        },
        once: true
      });
    });
  }

  // 13. Hover Image Reveal Showcase
  const hoverItems = document.querySelectorAll('.hover-item');
  const revealImg = document.querySelector('.hover-reveal-img');
  
  if(hoverItems.length > 0 && revealImg && window.innerWidth > 1024) {
    let mouseX = 0, mouseY = 0, revealX = 0, revealY = 0;
    let isHovering = false;
    
    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    const animateReveal = () => {
      revealX += (mouseX - revealX) * 0.12;
      revealY += (mouseY - revealY) * 0.12;
      
      if(isHovering) {
        gsap.set(revealImg, { 
          x: revealX - 200, 
          y: revealY - 150, 
          rotation: (mouseX - revealX) * 0.05 
        });
      }
      requestAnimationFrame(animateReveal);
    };
    animateReveal();

    hoverItems.forEach(item => {
      item.addEventListener('mouseenter', () => {
        isHovering = true;
        const imgUrl = item.getAttribute('data-img');
        revealImg.style.backgroundImage = `url(${imgUrl})`;
        gsap.to(revealImg, { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.5)" });
      });
      item.addEventListener('mouseleave', () => {
        isHovering = false;
        gsap.to(revealImg, { opacity: 0, scale: 0.8, duration: 0.3 });
      });
    });
  }

});
