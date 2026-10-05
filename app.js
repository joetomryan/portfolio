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

  /* ---------- the pixel buddy: waves beside the name, then sits down at his desk to code ---------- */

  const stage = document.querySelector('.name-stage');
  const buddy = stage && stage.querySelector('.buddy');
  const desk = stage && stage.querySelector('.buddy-desk');
  const say = stage && stage.querySelector('.buddy-say');
  if (stage && buddy && desk && say) {
    const name = stage.querySelector('.name');
    const ROWS = 33; // the standing sprite's height, in pixels of art
    const DESK_ROWS = 33;
    const DESK_COLS = 34;
    const HEAD_COL = 4; // where his head starts in the standing sprite
    const DESK_HEAD_COL = 2; // and in the desk scene
    const GAP = 6; // space between the name and where he stands, in pixels of art
    const WALK = 30; // steps from there to the chair
    let u = 0; // screen pixels per pixel of art
    let spot = null; // where he stands: { x, y } with y the line he stands on
    let timers = [];
    let run = 0;
    let started = false;
    let seated = false;
    let busy = false;

    const later = (fn, ms) => timers.push(setTimeout(fn, ms));
    const stop = () => {
      timers.forEach(clearTimeout);
      timers = [];
      run++;
    };

    const fontMetrics = () => {
      const style = getComputedStyle(name);
      const ctx = document.createElement('canvas').getContext('2d');
      ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      const m = ctx.measureText('JTRH');
      const size = parseFloat(style.fontSize);
      // older Safari and Firefox don't report font metrics; fall back to IBM Plex Serif's proportions
      return { ascent: m.fontBoundingBoxAscent || size * 1.025, cap: m.actualBoundingBoxAscent || size * 0.7 };
    };

    const layout = () => {
      const box = stage.getBoundingClientRect();
      if (!box.width) return null; // the home page isn't showing
      u = buddy.getBoundingClientRect().height / ROWS;
      const range = document.createRange();
      range.selectNodeContents(name);
      let last = null;
      for (const r of range.getClientRects()) {
        if (!last || r.top > last.top + 4) last = { top: r.top, left: r.left, right: r.right };
        else {
          last.left = Math.min(last.left, r.left);
          last.right = Math.max(last.right, r.right);
        }
      }
      if (!last) return null;
      const need = (GAP + WALK - DESK_HEAD_COL + DESK_COLS) * u + 4; // the gap, him and the desk
      return { box, last, need, beside: box.width - (last.right - box.left) >= need };
    };

    const measure = () => {
      let L = layout();
      if (!L) return false;
      if (stage.classList.contains('rooftop') === L.beside) {
        stage.classList.toggle('rooftop', !L.beside); // the padding changes, so measure again
        L = layout();
        if (!L) return false;
      }
      const { ascent, cap } = fontMetrics();
      const lineTop = L.last.top - L.box.top;
      spot = L.beside
        ? { x: L.last.right - L.box.left + GAP * u, y: lineTop + ascent } // on the baseline, right of the name
        : { x: Math.max(L.last.left - L.box.left, L.last.right - L.box.left - L.need), y: lineTop + ascent - cap }; // on top of the letters
      return true;
    };

    const frame = (f) => (buddy.dataset.f = f);
    let greeting = false; // the bubble is following him around while he's up
    const placeStanding = (x) => {
      const top = spot.y - ROWS * u;
      buddy.style.transform = `translate(${Math.round(x - HEAD_COL * u)}px, ${Math.round(top)}px)`;
      if (greeting) {
        say.style.left = `${Math.round(x + 8.5 * u)}px`; // over his head
        say.style.top = `${Math.round(top + 2)}px`;
      }
    };
    const placeDesk = () => {
      const headLeft = spot.x + WALK * u;
      const top = spot.y - DESK_ROWS * u;
      desk.style.transform = `translate(${Math.round(headLeft - DESK_HEAD_COL * u)}px, ${Math.round(top)}px)`;
      if (!greeting) {
        say.style.left = `${Math.round(headLeft + 7.5 * u)}px`;
        say.style.top = `${Math.round(top + 2)}px`;
      }
    };

    const WORK_MS = 10000; // how long he codes before taking a break
    const typeLoop = () => {
      let n = 0;
      const step = () => {
        if (!seated) return;
        if (!busy) {
          desk.dataset.type = desk.dataset.type === '1' ? '2' : '1';
          n++;
        }
        // bursts of typing with little pauses, like thinking
        later(step, n % 7 === 0 ? 350 + Math.random() * 500 : 110 + Math.random() * 90);
      };
      step();
    };

    // a two-frame animation for a while, then carry on
    const cycle = (a, b, every, ms, then) => {
      for (let t = 0; t < ms; t += every) later(() => frame((t / every) % 2 ? b : a), t);
      later(then, ms);
    };

    const walkTo = (from, to, dir, ms, then) => {
      const mine = run;
      buddy.dataset.dir = dir;
      const t0 = performance.now();
      const step = (now) => {
        if (mine !== run) return;
        const k = Math.min((now - t0) / ms, 1);
        placeStanding(from + (to - from) * k);
        frame(Math.floor(now / 150) % 2 ? 'walk1' : 'walk2');
        if (k < 1) requestAnimationFrame(step);
        else then();
      };
      requestAnimationFrame(step);
    };

    const chairX = () => spot.x + WALK * u;

    const sit = () => {
      seated = true;
      if (greeting) {
        say.classList.remove('show');
        greeting = false;
      }
      buddy.classList.add('off');
      desk.dataset.seated = '1';
      typeLoop();
      later(standUp, WORK_MS);
    };

    // every so often he gets up, walks back toward the name, waves at you, and goes back to work
    const standUp = () => {
      if (busy) {
        later(standUp, 300); // not while he's telling you off
        return;
      }
      seated = false;
      desk.dataset.seated = '0';
      buddy.classList.remove('off');
      placeStanding(chairX());
      buddy.dataset.dir = 'left';
      frame('side');
      // about ten seconds away from the desk: walk back, wave, a breather, wave again, walk back
      later(() => walkTo(chairX(), spot.x, 'left', 1200, () => {
        buddy.dataset.dir = 'right';
        frame('stand');
        later(() => cycle('wave1', 'wave2', 220, 2600, () => {
          frame('stand');
          later(() => cycle('wave1', 'wave2', 220, 2600, () => {
            frame('stand');
            later(() => {
              frame('side');
              later(() => walkTo(spot.x, chairX(), 'right', 1200, sit), 200);
            }, 300);
          }), 1400);
        }), 250);
      }), 200);
    };

    const start = () => {
      stop();
      seated = false;
      busy = false;
      say.classList.remove('show');
      desk.dataset.seated = '0';
      desk.dataset.look = 'screen';
      desk.dataset.type = '1';
      buddy.classList.remove('off');
      buddy.dataset.dir = 'right';
      if (!measure()) return false;
      placeStanding(spot.x);
      placeDesk();
      desk.classList.add('on'); // the desk is there from the start
      // say hi, then walk over to the desk and sit down
      cycle('wave1', 'wave2', 220, 2000, () => {
        frame('stand');
        later(() => {
          frame('side'); // turns to face the desk
          later(() => walkTo(spot.x, chairX(), 'right', 1300, sit), 300);
        }, 250);
      });
      return true;
    };

    // click him while he's coding and he'll tell you he's busy
    const poke = () => {
      if (!seated || busy) return;
      busy = true;
      greeting = false;
      say.textContent = "fixing a bug. don't disturb!";
      placeDesk();
      desk.dataset.look = 'you';
      say.classList.add('show');
      later(() => {
        say.classList.remove('show');
        desk.dataset.look = 'screen';
        busy = false;
      }, 2600);
    };
    desk.addEventListener('click', poke);

    // click him while he's up and about and he'll say hi
    let greetTimer = 0;
    const greet = () => {
      if (seated) return;
      greeting = true;
      say.textContent = 'hey, sup';
      const x = parseFloat(buddy.style.transform.replace(/.*translate\(([-\d.]+)px.*/, '$1')) + HEAD_COL * u;
      placeStanding(x);
      say.classList.add('show');
      clearTimeout(greetTimer);
      greetTimer = setTimeout(() => {
        say.classList.remove('show');
        greeting = false;
      }, 1800);
    };
    buddy.addEventListener('click', greet);
    buddy.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        greet();
      }
    });
    desk.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        poke();
      }
    });

    const relayout = () => {
      if (!started) {
        started = start();
        return;
      }
      if (!measure()) return;
      if (seated) {
        placeStanding(spot.x);
        placeDesk();
      } else started = start();
    };
    window.addEventListener('resize', relayout);
    window.addEventListener('hashchange', () => setTimeout(relayout, 350));

    (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => (started = start()));
  }

  document.querySelectorAll('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));

  console.log('%cjoe tom ryan', 'font: 700 22px Georgia, serif; color:#8b2e1f');
  console.log("you're reading the console. we should talk: joetomryan7@gmail.com");
})();
