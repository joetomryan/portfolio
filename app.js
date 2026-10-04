(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const views = [...document.querySelectorAll('[data-view]')];
  const turn = document.querySelector('.turn');
  const spines = [...document.querySelectorAll('.spine')];
  const navLinks = [...document.querySelectorAll('[data-nav]')];
  const folio = document.querySelector('[data-folio]');

  /* ---------- routing: #work, #projects, ... ; empty hash = home ---------- */

  const viewFor = (hash) => views.find((v) => v.dataset.view === hash.replace('#', '')) || views[0];

  // page numbers: chapters first, then the experience pages after them
  const pageOrder = [...views.filter((v) => !v.dataset.parent), ...views.filter((v) => v.dataset.parent)];
  const titles = { x100: '100x', avoca: 'avoca ai' };

  const show = (view) => {
    const name = view.dataset.view;
    const section = view.dataset.parent || name;
    views.forEach((v) => v.classList.remove('active', 'in'));
    view.classList.add('active');
    // charts and diagrams animate in once the page is on screen
    requestAnimationFrame(() => requestAnimationFrame(() => view.classList.add('in')));
    navLinks.forEach((a) => a.classList.toggle('current', a.dataset.nav === section));
    folio.textContent = pageOrder.indexOf(view) + 1;
    document.title = name === 'home' ? 'joe tom ryan' : `${titles[name] || name} · joe tom ryan`;
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
    // turn the page: a sheet slides across, the content swaps underneath it
    turn.classList.remove('go');
    void turn.offsetWidth;
    turn.classList.add('go');
    setTimeout(() => show(view), 300);
  };

  const goHome = () => {
    if (location.hash) history.pushState(null, '', location.pathname);
    route();
  };

  window.addEventListener('hashchange', route);
  route();

  document.querySelectorAll('[data-home]').forEach((a) =>
    a.addEventListener('click', (e) => {
      e.preventDefault();
      goHome();
    })
  );

  /* ---------- keyboard: 1-5 open a chapter, esc goes home ---------- */

  document.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const spine = spines.find((a) => a.dataset.key === e.key);
    if (spine) location.hash = spine.getAttribute('href');
    if (e.key === 'Escape' && location.hash) goHome();
  });

  /* ---------- click anywhere: a few drops of ink ---------- */

  if (!reduceMotion) {
    document.addEventListener('pointerdown', (e) => {
      for (let i = 0; i < 6; i++) {
        const d = document.createElement('span');
        d.className = 'dot';
        const angle = (Math.PI * 2 * i) / 6 + Math.random() * 0.6;
        const dist = 18 + Math.random() * 22;
        d.style.left = `${e.clientX - 3}px`;
        d.style.top = `${e.clientY - 3}px`;
        d.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
        d.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);
        d.addEventListener('animationend', () => d.remove());
        document.body.appendChild(d);
      }
    });
  }

  /* ---------- unit grids, flow diagrams, step rows ---------- */

  document.querySelectorAll('.units').forEach((el) => {
    el.style.setProperty('--cols', el.dataset.cols || 10);
    el.innerHTML = Array.from({ length: +el.dataset.n }, (_, i) => `<i style="--i: ${i}"></i>`).join('');
  });
  document.querySelectorAll('.flow').forEach((flow) =>
    flow.querySelectorAll(':scope > .node').forEach((n, i) => n.style.setProperty('--i', i))
  );
  document.querySelectorAll('.steps b').forEach((b, i) => b.style.setProperty('--i', i % 7));

  /* ---------- tooltips on chart marks ---------- */

  const tip = document.querySelector('.tip');
  const showTip = (el) => {
    const r = el.getBoundingClientRect();
    tip.textContent = el.dataset.tip;
    tip.style.left = `${Math.min(Math.max(r.left + r.width / 2, 140), window.innerWidth - 140)}px`;
    tip.style.top = `${r.top}px`;
    tip.classList.add('show');
  };
  const hideTip = () => tip.classList.remove('show');
  document.querySelectorAll('[data-tip]').forEach((el) => {
    el.tabIndex = 0;
    el.addEventListener('pointerenter', () => showTip(el));
    el.addEventListener('pointerleave', hideTip);
    el.addEventListener('focus', () => showTip(el));
    el.addEventListener('blur', hideTip);
  });
  window.addEventListener('scroll', hideTip, { passive: true });

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

  console.log('%cjoe tom ryan', 'font: 700 22px Georgia, serif; color:#8b2e1f');
  console.log("you're reading the console. we should talk: joetomryan7@gmail.com");
})();
