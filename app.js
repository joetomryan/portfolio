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

  /* ---------- the pixel buddy: wanders along the name, avoids the cursor ---------- */

  const stage = document.querySelector('.name-stage');
  const buddy = stage && stage.querySelector('.buddy');
  if (stage && buddy) {
    const name = stage.querySelector('.name');
    const WALK = 45; // px per second
    const RUN = 230;
    const FLEE_RADIUS = 130;
    const PANIC_RADIUS = 60;
    const JUMP_TIME = 0.6; // seconds

    let levels = []; // where he can stand: the floor under the name and the top of each line
    let w = 0;
    let h = 0;
    const me = { level: 0, x: 0, y: 0, mode: 'rest', until: 0, target: null, jump: null, frameAt: 0, frame: 'stand' };
    const pointer = { x: 0, y: 0, active: false };

    // Where the tops of the capital letters are, from the font's own metrics.
    const capMetrics = () => {
      const style = getComputedStyle(name);
      const ctx = document.createElement('canvas').getContext('2d');
      ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      const m = ctx.measureText('JTRH');
      return { ascent: m.fontBoundingBoxAscent, cap: m.actualBoundingBoxAscent };
    };

    const measure = () => {
      const box = stage.getBoundingClientRect();
      if (!box.width) return false; // home page not visible
      const size = buddy.getBoundingClientRect(); // an <svg> has no offsetWidth
      w = size.width;
      h = size.height;
      const range = document.createRange();
      range.selectNodeContents(name);
      const lines = [];
      for (const r of range.getClientRects()) {
        const line = lines.find((l) => Math.abs(l.top - r.top) < 4);
        if (line) {
          line.left = Math.min(line.left, r.left);
          line.right = Math.max(line.right, r.right);
        } else lines.push({ top: r.top, left: r.left, right: r.right });
      }
      if (!lines.length) return false;
      const { ascent, cap } = capMetrics();
      const left = Math.min(...lines.map((l) => l.left)) - box.left;
      const right = Math.max(...lines.map((l) => l.right)) - box.left;
      levels = [{ y: box.height, x0: left, x1: Math.max(left, right - w) }];
      for (const l of lines) {
        levels.push({
          y: l.top - box.top + ascent - cap,
          x0: l.left - box.left,
          x1: Math.max(l.left - box.left, l.right - box.left - w),
        });
      }
      me.level = Math.min(me.level, levels.length - 1);
      const lv = levels[me.level];
      me.x = Math.min(Math.max(me.x || lv.x1, lv.x0), lv.x1);
      me.y = lv.y;
      return true;
    };

    const draw = (frame) => {
      if (frame !== me.frame) buddy.dataset.f = me.frame = frame;
      buddy.style.transform = `translate(${Math.round(me.x)}px, ${Math.round(me.y - h)}px)`;
    };

    const jumpTo = (levelIndex, x, now) => {
      const to = levels[levelIndex];
      me.jump = {
        from: { x: me.x, y: me.y },
        to: { x: Math.min(Math.max(x, to.x0), to.x1), y: to.y },
        level: levelIndex,
        start: now,
      };
      me.mode = 'jump';
    };

    const otherLevel = () => {
      if (levels.length < 2) return 0;
      if (me.level !== 0) return 0;
      return 1 + Math.floor(Math.random() * (levels.length - 1));
    };

    let last = performance.now();
    const tick = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!levels.length && !measure()) return requestAnimationFrame(tick);
      const lv = levels[me.level];

      if (me.mode === 'jump') {
        const t = Math.min((now - me.jump.start) / 1000 / JUMP_TIME, 1);
        const { from, to } = me.jump;
        me.x = from.x + (to.x - from.x) * t;
        me.y = from.y + (to.y - from.y) * t - 46 * 4 * t * (1 - t);
        if (t === 1) {
          me.level = me.jump.level;
          me.y = to.y;
          me.mode = 'rest';
          me.until = now + 400;
        }
        draw('jump');
        return requestAnimationFrame(tick);
      }

      // keep away from the cursor
      const box = stage.getBoundingClientRect();
      const px = pointer.x - box.left;
      const py = pointer.y - box.top;
      const dx = me.x + w / 2 - px;
      const dy = me.y - h / 2 - py;
      const dist = Math.hypot(dx, dy);
      if (pointer.active && dist < FLEE_RADIUS) {
        const dir = dx === 0 ? (Math.random() < 0.5 ? -1 : 1) : Math.sign(dx);
        const cornered = (dir < 0 && me.x <= lv.x0 + 2) || (dir > 0 && me.x >= lv.x1 - 2);
        if (dist < PANIC_RADIUS || cornered) {
          const next = otherLevel();
          const away = me.x + dir * 70;
          jumpTo(next, cornered ? me.x - dir * 90 : away, now);
          return requestAnimationFrame(tick);
        }
        me.mode = 'run';
        me.x = Math.min(Math.max(me.x + dir * RUN * dt, lv.x0), lv.x1);
        draw(Math.floor(now / 80) % 2 ? 'walk1' : 'walk2');
        return requestAnimationFrame(tick);
      }

      // otherwise wander: walk somewhere, rest (sometimes wave), now and then hop levels
      if (me.mode === 'run') {
        me.mode = 'rest';
        me.until = now + 600;
      }
      if (me.mode === 'rest') {
        if (now >= me.until) {
          if (Math.random() < 0.18 && levels.length > 1) {
            const next = otherLevel();
            const to = levels[next];
            jumpTo(next, to.x0 + Math.random() * (to.x1 - to.x0), now);
            return requestAnimationFrame(tick);
          }
          me.mode = 'walk';
          me.target = lv.x0 + Math.random() * (lv.x1 - lv.x0);
        } else {
          const waving = me.waveUntil && now < me.waveUntil;
          draw(waving ? (Math.floor(now / 200) % 2 ? 'wave1' : 'wave2') : 'stand');
          return requestAnimationFrame(tick);
        }
      }
      if (me.mode === 'walk') {
        const step = WALK * dt;
        if (Math.abs(me.target - me.x) <= step) {
          me.x = me.target;
          me.mode = 'rest';
          me.until = now + 1500 + Math.random() * 2500;
          me.waveUntil = Math.random() < 0.4 ? now + 1400 : 0;
        } else {
          me.x += Math.sign(me.target - me.x) * step;
        }
        draw(Math.floor(now / 160) % 2 ? 'walk1' : 'walk2');
      }
      requestAnimationFrame(tick);
    };

    const start = () => {
      if (!measure()) return;
      if (reduceMotion) {
        draw('stand');
        return;
      }
      me.mode = 'rest';
      me.until = performance.now() + 1900;
      me.waveUntil = performance.now() + 1700; // say hi first
    };

    window.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
    });
    document.addEventListener('mouseleave', () => (pointer.active = false));
    // on touch screens, tapping near him makes him hop away
    window.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' || reduceMotion || me.mode === 'jump' || !levels.length) return;
      const box = stage.getBoundingClientRect();
      const dx = me.x + w / 2 - (e.clientX - box.left);
      const dy = me.y - h / 2 - (e.clientY - box.top);
      if (Math.hypot(dx, dy) < 90) jumpTo(otherLevel(), me.x + Math.sign(dx || 1) * 70, performance.now());
    });
    window.addEventListener('resize', () => {
      levels = [];
      measure();
    });
    window.addEventListener('hashchange', () => setTimeout(() => {
      levels = [];
      measure();
    }, 350));

    (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
      start();
      if (!reduceMotion) requestAnimationFrame(tick);
    });
  }

  document.querySelectorAll('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));

  console.log('%cjoe tom ryan', 'font: 700 22px Georgia, serif; color:#8b2e1f');
  console.log("you're reading the console. we should talk: joetomryan7@gmail.com");
})();
