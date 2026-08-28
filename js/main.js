/* ============================================================
   BALANGANDÃ — interações
   ============================================================ */
(() => {
  'use strict';

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE    = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ---------- 1. PRELOADER ---------- */
  const pre = $('#preloader');
  (() => {
    if (!pre) return;
    const bar = $('.pre-bar i', pre), num = $('.pre-num', pre);
    let p = 0, done = false;
    const tick = () => {
      if (done) return;
      p = Math.min(p + Math.random() * 9 + 3, 96);
      bar.style.width = p + '%';
      num.textContent = String(Math.round(p)).padStart(2, '0');
      setTimeout(tick, 110);
    };
    tick();
    const finish = () => {
      if (done) return;
      done = true;
      bar.style.width = '100%';
      num.textContent = '100';
      setTimeout(() => {
        pre.classList.add('is-done');
        document.body.classList.remove('is-locked');
        document.dispatchEvent(new Event('bg:ready'));
      }, 420);
    };
    document.body.classList.add('is-locked');
    window.addEventListener('load', () => setTimeout(finish, 480));
    setTimeout(finish, 4200); // rede lenta: não prende ninguém
  })();

  /* ---------- 1b. MOVIMENTO REDUZIDO: pausa animações SMIL do logo ---------- */
  if (REDUCED) {
    document.querySelectorAll('svg').forEach(sv => {
      try { sv.pauseAnimations(); } catch (e) { /* sem SMIL */ }
    });
  }

  /* ---------- 2. CURSOR ---------- */
  if (FINE && !REDUCED) {
    const dot = $('.cursor-dot'), ring = $('.cursor-ring');
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate3d(${mx}px,${my}px,0)`;
    }, { passive: true });
    (function loop() {
      rx = lerp(rx, mx, .16); ry = lerp(ry, my, .16);
      ring.style.transform = `translate3d(${rx}px,${ry}px,0)`;
      requestAnimationFrame(loop);
    })();
    const HOT = 'a,button,.tile,.cat,input,[data-magnetic]';
    addEventListener('mouseover', e => { if (e.target.closest(HOT)) ring.classList.add('is-hot'); }, { passive: true });
    addEventListener('mouseout',  e => { if (e.target.closest(HOT)) ring.classList.remove('is-hot'); }, { passive: true });
    document.addEventListener('mouseleave', () => { dot.style.opacity = ring.style.opacity = 0; });
    document.addEventListener('mouseenter', () => { dot.style.opacity = ring.style.opacity = 1; });
  }

  /* ---------- 3. PROGRESSO + NAV ---------- */
  const nav = $('.nav'), progress = $('.progress');
  const onScroll = () => {
    const y = scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
    nav.classList.toggle('is-stuck', y > 40);
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- 4. MENU MOBILE ---------- */
  (() => {
    const burger = $('.burger'), menu = $('#menu');
    if (!burger) return;
    const links = $$('a', menu);
    const setOpen = open => {
      burger.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
      menu.classList.toggle('is-open', open);
      document.body.classList.toggle('is-locked', open);
      links.forEach((a, i) => a.style.transitionDelay = open ? `${.16 + i * .06}s` : '0s');
    };
    burger.addEventListener('click', () => setOpen(!menu.classList.contains('is-open')));
    links.forEach(a => a.addEventListener('click', () => setOpen(false)));
    addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
  })();

  /* ---------- 5. SPLIT TEXT ---------- */
  const splitLines = el => {
    if (el.dataset.split) return;
    el.dataset.split = '1';
    const html = el.innerHTML.split(/<br\s*\/?>/i);
    el.innerHTML = html
      .map((line, i) => `<span class="split" style="transition-delay:${i * .11}s"><i style="transition-delay:${i * .11}s">${line}</i></span>`)
      .join('<br>');
  };
  if (!REDUCED) $$('h1.display, h2.display').forEach(splitLines);

  /* ---------- 6. REVEAL ---------- */
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-in');
      obs.unobserve(en.target);
    });
  }, { threshold: .12, rootMargin: '0px 0px -8% 0px' });
  $$('.rv').forEach(el => io.observe(el));
  // headings fora de .rv
  $$('h1.display, h2.display').forEach(el => { if (!el.closest('.rv')) io.observe(el); });

  /* ---------- 7. CONTADORES ---------- */
  const cio = new IntersectionObserver((entries, obs) => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target;
      const target = +el.dataset.count, suf = el.dataset.suffix || '';
      const t0 = performance.now(), dur = 1600;
      const fmt = n => n.toLocaleString('pt-BR');
      if (REDUCED) { el.textContent = fmt(target) + suf; obs.unobserve(el); return; }
      const step = now => {
        const k = clamp((now - t0) / dur, 0, 1);
        const eased = 1 - Math.pow(1 - k, 3);
        el.textContent = fmt(Math.round(target * eased)) + (k === 1 ? suf : '');
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      obs.unobserve(el);
    });
  }, { threshold: .5 });
  $$('[data-count]').forEach(el => cio.observe(el));

  /* ---------- 8. PARTÍCULAS DO HERO ---------- */
  (() => {
    const cv = $('#hero-canvas');
    if (!cv || REDUCED) return;
    const ctx = cv.getContext('2d');
    let w, h, dpr, parts = [], raf = null, visible = true;

    const build = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = clamp(Math.round(w * h / 15000), 30, 110);
      parts = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        r: Math.random() * 1.9 + .35,
        vx: (Math.random() - .5) * .16,
        vy: -(Math.random() * .28 + .06),
        a: Math.random() * .55 + .12,
        ph: Math.random() * Math.PI * 2,
        gold: Math.random() < .22
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const t = performance.now() * .0011;
      for (const p of parts) {
        p.x += p.vx; p.y += p.vy;
        if (p.y < -12) { p.y = h + 12; p.x = Math.random() * w; }
        if (p.x < -12) p.x = w + 12;
        if (p.x > w + 12) p.x = -12;
        const tw = (Math.sin(t + p.ph) + 1) * .5;
        const alpha = p.a * (.35 + tw * .65);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.gold
          ? `rgba(201,169,106,${alpha})`
          : `rgba(226,230,238,${alpha})`;
        ctx.shadowBlur = p.r * 5;
        ctx.shadowColor = ctx.fillStyle;
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      raf = requestAnimationFrame(draw);
    };

    build();
    draw();
    addEventListener('resize', () => { build(); }, { passive: true });
    new IntersectionObserver(es => {
      visible = es[0].isIntersecting;
      if (visible && !raf) draw();
      if (!visible && raf) { cancelAnimationFrame(raf); raf = null; }
    }, { threshold: .01 }).observe(cv);
  })();

  /* ---------- 9. MAGNÉTICO ---------- */
  if (FINE && !REDUCED) {
    $$('[data-magnetic]').forEach(el => {
      let rx = 0, ry = 0, tx = 0, ty = 0, run = false;
      const loop = () => {
        rx = lerp(rx, tx, .18); ry = lerp(ry, ty, .18);
        el.style.transform = `translate(${rx}px,${ry}px)`;
        if (Math.abs(rx - tx) > .1 || Math.abs(ry - ty) > .1) requestAnimationFrame(loop);
        else { el.style.transform = `translate(${tx}px,${ty}px)`; run = false; }
      };
      const kick = () => { if (!run) { run = true; requestAnimationFrame(loop); } };
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        tx = (e.clientX - r.left - r.width / 2) * .28;
        ty = (e.clientY - r.top - r.height / 2) * .38;
        kick();
      });
      el.addEventListener('mouseleave', () => { tx = 0; ty = 0; kick(); });
    });
  }

  /* ---------- 10. TILT ---------- */
  if (FINE && !REDUCED) {
    $$('[data-tilt]').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - .5;
        const py = (e.clientY - r.top) / r.height - .5;
        el.style.transform = `perspective(900px) rotateY(${px * 7}deg) rotateX(${-py * 7}deg) translateZ(0)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------- 11. PARALLAX ---------- */
  (() => {
    if (REDUCED) return;
    const items = $$('.par');
    if (!items.length) return;
    let ticking = false;
    const run = () => {
      const vh = innerHeight;
      items.forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        const k = (r.top + r.height / 2 - vh / 2) / vh; // -1 .. 1
        el.style.transform = `translate3d(0, ${(-k * 5).toFixed(2)}%, 0) scale(1.1)`;
      });
      ticking = false;
    };
    addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(run); }
    }, { passive: true });
    run();
  })();

  /* ---------- 12. VITRINE: FILTROS ---------- */
  const grid = $('#grid');
  const tiles = $$('.tile', grid);
  const moreBtn = $('#more');
  let filter = 'all', expanded = false;

  const render = () => {
    tiles.forEach(t => {
      const match = filter === 'all' || t.dataset.cat === filter;
      const capped = filter === 'all' && !expanded && t.hasAttribute('data-extra');
      t.classList.toggle('is-hidden', !match || capped);
    });
    const anyHidden = tiles.some(t => t.hasAttribute('data-extra')) && filter === 'all' && !expanded;
    moreBtn.style.display = anyHidden ? '' : 'none';
  };

  const swap = fn => {
    if (REDUCED) { fn(); render(); return; }
    grid.style.opacity = '0';
    grid.style.transform = 'translateY(14px)';
    grid.style.transition = 'opacity .26s ease, transform .26s ease';
    setTimeout(() => {
      fn(); render();
      grid.style.opacity = '1';
      grid.style.transform = 'none';
      $$('.tile:not(.is-hidden)', grid).forEach((t, i) => {
        t.style.animation = 'none';
        void t.offsetWidth;
        t.style.animation = `tileIn .6s cubic-bezier(.22,1,.36,1) ${Math.min(i * .028, .5)}s both`;
      });
    }, 260);
  };

  $$('.filter').forEach(b => b.addEventListener('click', () => {
    if (b.dataset.filter === filter) return;
    $$('.filter').forEach(x => x.classList.toggle('is-on', x === b));
    swap(() => { filter = b.dataset.filter; });
  }));

  moreBtn.addEventListener('click', () => {
    expanded = true;
    render();
    $$('.tile[data-extra]:not(.is-hidden)', grid).forEach((t, i) => {
      t.style.animation = `tileIn .6s cubic-bezier(.22,1,.36,1) ${Math.min(i * .022, .55)}s both`;
    });
  });

  // atalho: cards de categoria filtram a vitrine
  $$('[data-goto]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    const slug = a.dataset.goto;
    const btn = $(`.filter[data-filter="${slug}"]`);
    if (btn && btn.dataset.filter !== filter) btn.click();
    const y = $('#vitrine').getBoundingClientRect().top + scrollY - 70;
    scrollTo({ top: y, behavior: REDUCED ? 'auto' : 'smooth' });
  }));

  render();

  /* ---------- 13. LIGHTBOX ---------- */
  (() => {
    const lb = $('#lb'), img = $('#lb-img'), name = $('#lb-name'), wa = $('#lb-wa');
    let list = [], i = 0;

    const show = k => {
      list = $$('.tile:not(.is-hidden)', grid);
      if (!list.length) return;
      i = (k + list.length) % list.length;
      const t = list[i];
      img.src = t.dataset.src;
      img.alt = t.dataset.name;
      name.textContent = t.dataset.name;
      wa.href = t.dataset.wa;
    };
    const open = t => {
      list = $$('.tile:not(.is-hidden)', grid);
      show(list.indexOf(t));
      lb.classList.add('is-open');
      document.body.classList.add('is-locked');
      $('#lb-x').focus();
    };
    const close = () => { lb.classList.remove('is-open'); document.body.classList.remove('is-locked'); };

    tiles.forEach(t => t.addEventListener('click', () => open(t)));
    $('#lb-x').addEventListener('click', close);
    $('#lb-prev').addEventListener('click', () => show(i - 1));
    $('#lb-next').addEventListener('click', () => show(i + 1));
    lb.addEventListener('click', e => { if (e.target === lb) close(); });
    addEventListener('keydown', e => {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(i - 1);
      if (e.key === 'ArrowRight') show(i + 1);
    });
    // swipe
    let sx = 0;
    lb.addEventListener('touchstart', e => sx = e.touches[0].clientX, { passive: true });
    lb.addEventListener('touchend', e => {
      const d = e.changedTouches[0].clientX - sx;
      if (Math.abs(d) > 55) show(d > 0 ? i - 1 : i + 1);
    }, { passive: true });
  })();

  /* ---------- 14. ÂNCORAS SUAVES ---------- */
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id === '#' || a.hasAttribute('data-goto')) return;
      const el = $(id);
      if (!el) return;
      e.preventDefault();
      const y = el.getBoundingClientRect().top + scrollY - (id === '#top' ? 0 : 62);
      scrollTo({ top: y, behavior: REDUCED ? 'auto' : 'smooth' });
    });
  });

  /* ---------- 15. IMAGENS: FADE-IN ---------- */
  $$('img').forEach(im => {
    if (im.complete) { im.style.opacity = '1'; return; }
    im.style.opacity = '0';
    im.style.transition = 'opacity .7s cubic-bezier(.22,1,.36,1)';
    im.addEventListener('load',  () => im.style.opacity = '1', { once: true });
    im.addEventListener('error', () => im.style.opacity = '1', { once: true });
  });

  /* ---------- 16. WHATSAPP FLUTUANTE + ANO ---------- */
  const wf = $('.wa-float');
  const toggleWa = () => wf.classList.toggle('is-in', scrollY > innerHeight * .55);
  addEventListener('scroll', toggleWa, { passive: true });
  toggleWa();
  $('#year').textContent = new Date().getFullYear();

})();
