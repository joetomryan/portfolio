(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const views = [...document.querySelectorAll('[data-view]')];
  const wipe = document.querySelector('.wipe');
  const columns = [...document.querySelectorAll('.columns a')];

  /* ---------- routing: #work, #projects, ... ; empty hash = home ---------- */

  const viewFor = (hash) => {
    const name = hash.replace('#', '');
    return views.find((v) => v.dataset.view === name) || views[0];
  };

  const show = (view) => {
    views.forEach((v) => v.classList.toggle('active', v === view));
    document.title = view.dataset.view === 'home' ? 'joe tom ryan' : `${view.dataset.view} · joe tom ryan`;
    window.scrollTo(0, 0);
  };

  let first = true;
  const route = () => {
    const view = viewFor(location.hash);
    if (first || reduceMotion) {
      first = false;
      show(view);
      return;
    }
    wipe.classList.remove('go');
    void wipe.offsetWidth; // restart the animation
    wipe.classList.add('go');
    setTimeout(() => show(view), 250);
  };

  window.addEventListener('hashchange', route);
  route();

  document.querySelectorAll('[data-home]').forEach((a) =>
    a.addEventListener('click', (e) => {
      e.preventDefault();
      if (location.hash) history.pushState(null, '', location.pathname);
      route();
    })
  );

  /* ---------- keyboard: 1-5 open a section, esc goes home ---------- */

  document.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const col = columns.find((a) => a.dataset.key === e.key);
    if (col) location.hash = col.getAttribute('href');
    if (e.key === 'Escape' && location.hash) {
      history.pushState(null, '', location.pathname);
      route();
    }
  });

  /* ---------- name: every letter jumps on hover ---------- */

  document.querySelectorAll('.name .word').forEach((word) => {
    word.innerHTML = [...word.textContent].map((c) => `<span class="ch" aria-hidden="true">${c}</span>`).join('');
  });

  /* ---------- column titles scramble on hover ---------- */

  const glyphs = '!<>-_\\/[]{}=+*^?#01';
  columns.forEach((a) => {
    const title = a.querySelector('.title');
    const text = title.textContent;
    let timer;
    a.addEventListener('mouseenter', () => {
      if (reduceMotion) return;
      let frame = 0;
      clearInterval(timer);
      timer = setInterval(() => {
        title.textContent = [...text]
          .map((c, i) => (i < frame / 2 ? c : glyphs[Math.floor(Math.random() * glyphs.length)]))
          .join('');
        if (++frame > text.length * 2) {
          clearInterval(timer);
          title.textContent = text;
        }
      }, 30);
    });
  });

  /* ---------- numbers count up when they scroll into view ---------- */

  const counters = document.querySelectorAll('[data-count]');
  if (!reduceMotion && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        const el = entry.target;
        const end = +el.dataset.count;
        const pre = el.dataset.prefix || '';
        const suf = el.dataset.suffix || '';
        const start = performance.now();
        const tick = (now) => {
          const t = Math.min((now - start) / 1100, 1);
          const eased = 1 - Math.pow(1 - t, 3);
          el.textContent = pre + Math.round(end * eased) + suf;
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.6 });
    counters.forEach((el) => io.observe(el));
  }

  /* ---------- stack chips toggle ---------- */

  document.querySelectorAll('.chips button').forEach((b) => {
    b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', () => b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true')));
  });

  /* ---------- click anywhere: a little burst of squares ---------- */

  if (!reduceMotion) {
    document.addEventListener('pointerdown', (e) => {
      for (let i = 0; i < 6; i++) {
        const s = document.createElement('span');
        s.className = 'spark';
        const angle = (Math.PI * 2 * i) / 6 + Math.random() * 0.6;
        const dist = 28 + Math.random() * 24;
        s.style.left = `${e.clientX - 4}px`;
        s.style.top = `${e.clientY - 4}px`;
        s.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
        s.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);
        s.addEventListener('animationend', () => s.remove());
        document.body.appendChild(s);
      }
    });
  }

  /* ---------- aquarium bubbles ---------- */

  const bubbles = document.querySelector('.bubbles');
  if (bubbles) {
    for (let i = 0; i < 14; i++) {
      const b = document.createElement('span');
      const size = 4 + Math.random() * 8;
      b.style.left = `${Math.random() * 100}%`;
      b.style.width = b.style.height = `${size}px`;
      b.style.animationDuration = `${4 + Math.random() * 5}s`;
      b.style.animationDelay = `${-Math.random() * 8}s`;
      b.style.setProperty('--drift', `${(Math.random() - 0.5) * 30}px`);
      bubbles.appendChild(b);
    }
  }

  /* ---------- basketball ---------- */

  const ball = document.querySelector('.ball');
  if (ball) {
    ball.addEventListener('click', () => {
      ball.classList.remove('bounce');
      void ball.offsetWidth;
      ball.classList.add('bounce');
    });
  }

  /* ---------- copy email ---------- */

  const copy = document.querySelector('.copy');
  if (copy) {
    copy.addEventListener('click', async () => {
      const email = copy.dataset.email;
      try {
        await navigator.clipboard.writeText(email);
        copy.classList.remove('copied');
        void copy.offsetWidth;
        copy.classList.add('copied');
      } catch {
        location.href = `mailto:${email}`;
      }
    });
  }

  document.querySelectorAll('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));

  console.log('%cjoe tom ryan', 'font: 700 24px sans-serif; background:#ff4d00; color:#0d0d0d; padding:4px 8px');
  console.log("you're reading the console. we should talk: joetomryan7@gmail.com");
})();
