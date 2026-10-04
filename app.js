(() => {
  const views = [...document.querySelectorAll('[data-view]')];
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

  const route = () => show(viewFor(location.hash));

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

  /* ---------- keyboard: 1-6 open a chapter, esc goes home ---------- */

  document.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const spine = spines.find((a) => a.dataset.key === e.key);
    if (spine) location.hash = spine.getAttribute('href');
    if (e.key === 'Escape' && location.hash) goHome();
  });

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

  /* ---------- library shelf: hovering a volume reads its spine ---------- */

  const caption = document.querySelector('.shelf-caption');
  if (caption) {
    const idle = caption.textContent;
    spines.forEach((spine) => {
      const read = () => (caption.textContent = `${spine.querySelector('.spine-title').textContent} — ${spine.dataset.sub}`);
      spine.addEventListener('pointerenter', read);
      spine.addEventListener('focus', read);
      spine.addEventListener('pointerleave', () => (caption.textContent = idle));
      spine.addEventListener('blur', () => (caption.textContent = idle));
    });
  }

  /* ---------- copy email ---------- */

  const copy = document.querySelector('.copy');
  if (copy) {
    copy.addEventListener('click', async () => {
      const email = copy.dataset.email;
      try {
        await navigator.clipboard.writeText(email);
        const hint = copy.querySelector('.copy-hint');
        hint.textContent = 'copied to clipboard';
        setTimeout(() => (hint.textContent = 'click to copy'), 1800);
      } catch {
        location.href = `mailto:${email}`;
      }
    });
  }

  document.querySelectorAll('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));

  console.log('%cjoe tom ryan', 'font: 700 22px Georgia, serif; color:#8b2e1f');
  console.log("you're reading the console. we should talk: joetomryan7@gmail.com");
})();
