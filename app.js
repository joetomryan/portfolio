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

  /* ---------- the pixel buddy: walks beside and on top of the name, avoids the cursor ---------- */

  const stage = document.querySelector('.name-stage');
  const buddy = stage && stage.querySelector('.buddy');
  if (stage && buddy) {
    const name = stage.querySelector('.name');
    const WALK = 45; // px per second
    const RUN = 240;
    const FLEE_RADIUS = 140;
    const PANIC_RADIUS = 70;
    const JUMP_TIME = 0.6; // seconds

    // Places he can stand: the baseline just right of the name, and the top of each line of letters.
    let levels = [];
    let w = 0;
    let h = 0;
    const me = { level: 0, x: 0, y: 0, mode: 'rest', until: 0, target: 0, jump: null, frame: 'stand', waveUntil: 0 };
    const pointer = { x: 0, y: 0, active: false };

    const fontMetrics = () => {
      const style = getComputedStyle(name);
      const ctx = document.createElement('canvas').getContext('2d');
      ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      const m = ctx.measureText('JTRH');
      return { ascent: m.fontBoundingBoxAscent, cap: m.actualBoundingBoxAscent };
    };

    const measure = () => {
      const box = stage.getBoundingClientRect();
      if (!box.width) return false; // the home page isn't showing
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
      const { ascent, cap } = fontMetrics();
      levels = [];
      const lastLine = lines[lines.length - 1];
      const side = {
        y: lastLine.top - box.top + ascent, // baseline
        x0: lastLine.right - box.left + 2,
        x1: box.width - w,
      };
      if (side.x1 - side.x0 >= 4) levels.push(side);
      for (const l of lines) {
        levels.push({
          y: l.top - box.top + ascent - cap, // tops of the capitals
          x0: l.left - box.left,
          x1: Math.max(l.left - box.left, l.right - box.left - w),
        });
      }
      me.level = Math.min(me.level, levels.length - 1);
      const lv = levels[me.level];
      me.x = Math.min(Math.max(me.x || lv.x0, lv.x0), lv.x1);
      me.y = lv.y;
      return true;
    };

    const draw = (frame) => {
      if (frame !== me.frame) buddy.dataset.f = me.frame = frame;
      buddy.style.transform = `translate(${Math.round(me.x)}px, ${Math.round(me.y - h)}px)`;
    };

    const jumpTo = (levelIndex, x, now) => {
      const to = levels[levelIndex];
      me.jump = { from: { x: me.x, y: me.y }, to: { x: Math.min(Math.max(x, to.x0), to.x1), y: to.y }, level: levelIndex, start: now };
      me.mode = 'jump';
    };

    // The spot furthest from the cursor, on any level, for when he's cornered.
    const escape = (px, py) => {
      let best = null;
      levels.forEach((lv, i) => {
        for (const x of [lv.x0, (lv.x0 + lv.x1) / 2, lv.x1]) {
          const d = Math.hypot(x + w / 2 - px, lv.y - h / 2 - py);
          if (Math.abs(x - me.x) + Math.abs(lv.y - me.y) > 40 && (!best || d > best.d)) best = { i, x, d };
        }
      });
      return best;
    };

    const randomHop = (now) => {
      const choices = levels.map((_, i) => i).filter((i) => i !== me.level);
      if (!choices.length) return false;
      const next = choices[Math.floor(Math.random() * choices.length)];
      const to = levels[next];
      jumpTo(next, to.x0 + Math.random() * (to.x1 - to.x0), now);
      return true;
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
        me.y = from.y + (to.y - from.y) * t - 50 * 4 * t * (1 - t);
        if (t === 1) {
          me.level = me.jump.level;
          me.y = to.y;
          me.mode = 'rest';
          me.until = now + 500;
        }
        draw('jump');
        return requestAnimationFrame(tick);
      }

      // keep away from the cursor
      const box = stage.getBoundingClientRect();
      const px = pointer.x - box.left;
      const py = pointer.y - box.top;
      const dx = me.x + w / 2 - px;
      const dist = Math.hypot(dx, me.y - h / 2 - py);
      if (pointer.active && dist < FLEE_RADIUS) {
        const dir = dx === 0 ? 1 : Math.sign(dx);
        const cornered = (dir < 0 && me.x <= lv.x0 + 2) || (dir > 0 && me.x >= lv.x1 - 2);
        if (dist < PANIC_RADIUS || cornered) {
          const spot = escape(px, py);
          if (spot) {
            jumpTo(spot.i, spot.x, now);
            return requestAnimationFrame(tick);
          }
        }
        me.mode = 'run';
        me.x = Math.min(Math.max(me.x + dir * RUN * dt, lv.x0), lv.x1);
        draw(Math.floor(now / 80) % 2 ? 'walk1' : 'walk2');
        return requestAnimationFrame(tick);
      }

      // otherwise potter about: walk a little, rest (sometimes wave), now and then hop up or down
      if (me.mode === 'run') {
        me.mode = 'rest';
        me.until = now + 700;
      }
      if (me.mode === 'rest') {
        if (now < me.until) {
          const waving = now < me.waveUntil;
          draw(waving ? (Math.floor(now / 200) % 2 ? 'wave1' : 'wave2') : 'stand');
          return requestAnimationFrame(tick);
        }
        if (Math.random() < 0.25 && randomHop(now)) return requestAnimationFrame(tick);
        me.mode = 'walk';
        me.target = lv.x0 + Math.random() * (lv.x1 - lv.x0);
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

    let started = false;
    const start = () => {
      if (!measure()) return; // home page not showing yet; tried again when it is
      started = true;
      me.level = 0; // start right next to the name
      me.x = levels[0].x0;
      me.y = levels[0].y;
      draw('stand');
      if (reduceMotion) return;
      me.mode = 'rest';
      me.until = performance.now() + 1900;
      me.waveUntil = performance.now() + 1700; // say hi first
      requestAnimationFrame(tick);
    };

    window.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
    });
    document.addEventListener('mouseleave', () => (pointer.active = false));
    // on touch screens, a tap near him sends him somewhere else
    window.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' || reduceMotion || me.mode === 'jump' || !levels.length) return;
      const box = stage.getBoundingClientRect();
      const px = e.clientX - box.left;
      const py = e.clientY - box.top;
      if (Math.hypot(me.x + w / 2 - px, me.y - h / 2 - py) < 90) {
        const spot = escape(px, py);
        if (spot) jumpTo(spot.i, spot.x, performance.now());
      }
    });
    const remeasure = () => {
      if (!started) return start();
      levels = [];
      if (measure() && reduceMotion) draw('stand');
    };
    window.addEventListener('resize', remeasure);
    window.addEventListener('hashchange', () => setTimeout(remeasure, 350));

    (document.fonts ? document.fonts.ready : Promise.resolve()).then(start);
  }

  document.querySelectorAll('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));

  console.log('%cjoe tom ryan', 'font: 700 22px Georgia, serif; color:#8b2e1f');
  console.log("you're reading the console. we should talk: joetomryan7@gmail.com");
})();
