/* ═══════════════════════════════════════════
   CAVIAR Y TRUFA — interacción
   ═══════════════════════════════════════════ */
(function () {
  'use strict';

  const lerp = (a, b, t) => a + (b - a) * t;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ─── Preloader ─── */
  window.addEventListener('load', () => {
    setTimeout(() => {
      document.getElementById('preloader').classList.add('done');
      document.querySelectorAll('.hero .line, .hero .reveal').forEach((el, i) => {
        el.style.setProperty('--i', i);
        el.classList.add('in');
      });
    }, reducedMotion ? 0 : 1100);
  });

  /* ─── Cursor personalizado ─── */
  const mouse = { x: innerWidth / 2, y: innerHeight / 2 };

  if (finePointer && !reducedMotion) {
    document.body.classList.add('has-cursor');
    const dot = document.getElementById('cursorDot');
    const ring = document.getElementById('cursorRing');
    const label = document.getElementById('cursorLabel');
    const ringPos = { x: mouse.x, y: mouse.y };

    addEventListener('mousemove', e => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      dot.style.transform = `translate(${mouse.x}px, ${mouse.y}px) translate(-50%,-50%)`;
    }, { passive: true });

    (function ringLoop() {
      ringPos.x = lerp(ringPos.x, mouse.x, 0.16);
      ringPos.y = lerp(ringPos.y, mouse.y, 0.16);
      ring.style.transform = `translate(${ringPos.x}px, ${ringPos.y}px) translate(-50%,-50%)`;
      requestAnimationFrame(ringLoop);
    })();

    document.querySelectorAll('[data-cursor="hover"], a, button').forEach(el => {
      el.addEventListener('mouseenter', () => ring.classList.add('is-hover'));
      el.addEventListener('mouseleave', () => ring.classList.remove('is-hover'));
    });

    document.querySelectorAll('[data-cursor-label]').forEach(el => {
      el.addEventListener('mouseenter', () => {
        label.textContent = el.dataset.cursorLabel;
        ring.classList.add('is-label');
      });
      el.addEventListener('mouseleave', () => ring.classList.remove('is-label'));
    });
  }

  /* ─── Botones magnéticos ─── */
  if (finePointer && !reducedMotion) {
    document.querySelectorAll('[data-magnetic]').forEach(el => {
      el.style.display = 'inline-block';
      el.style.transition = 'transform 0.3s cubic-bezier(0.22,1,0.36,1)';
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${dx * 0.28}px, ${dy * 0.28}px)`;
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'translate(0, 0)';
      });
    });
  }

  /* ─── Reveals al hacer scroll ─── */
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -5%' });

  document.querySelectorAll('main .line, main .reveal, footer .reveal').forEach(el => {
    if (el.closest('.hero')) return; // el hero lo dispara el preloader
    const parent = el.parentElement;
    const siblings = [...parent.querySelectorAll(':scope > .line, :scope > .reveal')];
    el.style.setProperty('--i', Math.max(siblings.indexOf(el), 0));
    io.observe(el);
  });

  /* ─── Campo de perlas (canvas) ─── */
  (function pearlField() {
    const canvas = document.getElementById('pearls');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(devicePixelRatio || 1, 2);
    let W = 0, H = 0, pearls = [], running = false, t = 0;

    // Sprite pre-renderizado: mucho más rápido que gradientes por frame
    function makeSprite(gold) {
      const s = document.createElement('canvas');
      const size = 64;
      s.width = s.height = size;
      const c = s.getContext('2d');
      const g = c.createRadialGradient(size * 0.36, size * 0.32, size * 0.05, size * 0.5, size * 0.5, size * 0.5);
      if (gold) {
        g.addColorStop(0, '#E8CE96');
        g.addColorStop(0.3, '#A9803F');
        g.addColorStop(0.75, '#4A3717');
        g.addColorStop(1, 'rgba(30,22,8,0)');
      } else {
        g.addColorStop(0, 'rgba(214,190,138,0.95)');
        g.addColorStop(0.18, '#3A342A');
        g.addColorStop(0.65, '#16130E');
        g.addColorStop(1, 'rgba(10,9,7,0)');
      }
      c.fillStyle = g;
      c.beginPath();
      c.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      c.fill();
      return s;
    }
    const spriteDark = makeSprite(false);
    const spriteGold = makeSprite(true);

    function build() {
      const rect = canvas.parentElement.getBoundingClientRect();
      W = rect.width; H = rect.height;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      pearls = [];
      const gap = W > 860 ? 42 : 52;
      for (let gx = gap / 2; gx < W; gx += gap) {
        for (let gy = gap / 2; gy < H; gy += gap) {
          const x = gx + (Math.random() - 0.5) * gap * 0.9;
          const y = gy + (Math.random() - 0.5) * gap * 0.9;
          pearls.push({
            hx: x, hy: y, x, y, vx: 0, vy: 0,
            r: 2.5 + Math.random() * 4,
            gold: Math.random() < 0.07,
            phase: Math.random() * Math.PI * 2,
            speed: 0.4 + Math.random() * 0.6
          });
        }
      }
    }

    const pointer = { x: -9999, y: -9999 };
    canvas.parentElement.addEventListener('mousemove', e => {
      const r = canvas.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
    }, { passive: true });
    canvas.parentElement.addEventListener('mouseleave', () => {
      pointer.x = pointer.y = -9999;
    });

    const REPEL = 130, FORCE = 6.5;

    function draw() {
      ctx.clearRect(0, 0, W, H);

      for (const p of pearls) {
        // deriva ambiental
        const homeX = p.hx + Math.sin(t * p.speed + p.phase) * 3;
        const homeY = p.hy + Math.cos(t * p.speed * 0.8 + p.phase) * 3;

        // repulsión del cursor
        const dx = p.x - pointer.x;
        const dy = p.y - pointer.y;
        const d = Math.hypot(dx, dy);
        if (d < REPEL && d > 0.1) {
          const f = (1 - d / REPEL) * FORCE;
          p.vx += (dx / d) * f;
          p.vy += (dy / d) * f;
        }

        // resorte a casa + amortiguación
        p.vx += (homeX - p.x) * 0.02;
        p.vy += (homeY - p.y) * 0.02;
        p.vx *= 0.86;
        p.vy *= 0.86;
        p.x += p.vx;
        p.y += p.vy;

        const sprite = p.gold ? spriteGold : spriteDark;
        const s = p.r * 2;
        ctx.drawImage(sprite, p.x - p.r, p.y - p.r, s, s);
      }
    }

    function frame() {
      if (!running) return;
      t += 0.016;
      draw();
      requestAnimationFrame(frame);
    }

    let heroVisible = true;
    function syncRunning() {
      const wasRunning = running;
      running = heroVisible && !document.hidden && !reducedMotion;
      if (running && !wasRunning) requestAnimationFrame(frame);
    }

    const heroIO = new IntersectionObserver(([entry]) => {
      heroVisible = entry.isIntersecting;
      syncRunning();
    });
    heroIO.observe(canvas.parentElement);
    document.addEventListener('visibilitychange', syncRunning);

    let resizeTimer;
    addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => { build(); draw(); }, 200);
    });

    build();
    draw(); // primer frame garantizado aunque la pestaña esté en segundo plano
    syncRunning();
  })();

  /* ─── Imagen flotante en la colección ─── */
  if (finePointer && !reducedMotion) {
    const floatImg = document.getElementById('floatImg');
    const img = floatImg.querySelector('img');
    const list = document.getElementById('productList');
    const pos = { x: 0, y: 0 };
    let visible = false;

    document.querySelectorAll('.product-row').forEach(row => {
      row.addEventListener('mouseenter', () => {
        img.src = row.dataset.img;
        list.classList.add('is-hovering');
        row.classList.add('is-active');
        floatImg.classList.add('is-visible');
        if (!visible) { pos.x = mouse.x; pos.y = mouse.y; visible = true; }
      });
      row.addEventListener('mouseleave', () => {
        list.classList.remove('is-hovering');
        row.classList.remove('is-active');
        floatImg.classList.remove('is-visible');
        visible = false;
      });
    });

    (function floatLoop() {
      pos.x = lerp(pos.x, mouse.x, 0.09);
      pos.y = lerp(pos.y, mouse.y, 0.09);
      const rot = Math.max(-6, Math.min(6, (mouse.x - pos.x) * 0.06));
      floatImg.style.transform =
        `translate(${pos.x}px, ${pos.y}px) translate(-50%,-50%) rotate(${rot}deg) scale(${visible ? 1 : 0.85})`;
      requestAnimationFrame(floatLoop);
    })();
  }

  /* ─── Parallax sutil ─── */
  if (!reducedMotion) {
    const parallaxEls = document.querySelectorAll('.parallax-img');
    let ticking = false;
    function updateParallax() {
      const vh = innerHeight;
      parallaxEls.forEach(el => {
        const r = el.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        const center = r.top + r.height / 2;
        const off = ((center - vh / 2) / vh) * 34;
        el.style.setProperty('--py', off.toFixed(1) + 'px');
      });
      ticking = false;
    }
    addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(updateParallax); ticking = true; }
    }, { passive: true });
    updateParallax();
  }

  /* ─── Barra de progreso ─── */
  const progress = document.getElementById('progress');
  let progTick = false;
  addEventListener('scroll', () => {
    if (progTick) return;
    progTick = true;
    requestAnimationFrame(() => {
      const max = document.documentElement.scrollHeight - innerHeight;
      progress.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
      progTick = false;
    });
  }, { passive: true });

  /* ─── Contacto (mailto — sin backend) ─── */
  document.getElementById('contactForm').addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('fName').value;
    const email = document.getElementById('fEmail').value;
    const msg = document.getElementById('fMsg').value;
    const body = encodeURIComponent(`${msg}\n\n— ${name}\n${email}`);
    location.href = `mailto:pedidos@caviarytrufa.com?subject=${encodeURIComponent('Contacto — ' + name)}&body=${body}`;
  });

})();
