<script lang="ts">
  import { onMount } from 'svelte';
  import { base } from '$app/paths';
  import { intro, now, previously, projects, writing, links, type Entry } from '$lib/data/content';

  // The page opens as a dim workshop; the lamp clicks on (with a cord-pull) and
  // the dark lifts to reveal the calm, paper-white room. `lit` drives that reveal.
  let lit = $state(false);
  let audioOn = $state<HTMLAudioElement | undefined>(undefined);
  let audioOff = $state<HTMLAudioElement | undefined>(undefined);
  let pullPlayed = false;

  // ── Discovery: count the interactive things found, to reward exploring. ───
  const seen = new Set<string>();
  let found = $state(0);
  function discover(id: string) {
    if (seen.has(id)) return;
    seen.add(id);
    found += 1;
  }

  // ── Power surge: a jolt of current down every trace, with a crackle. ──────
  let surging = $state(false);
  let surgeTimer: ReturnType<typeof setTimeout> | undefined;
  let audioCtx: AudioContext | undefined;

  // Synthesise an electric crackle/zap — no audio file needed. A short pitch
  // drop under sparse filtered-noise pops. Only runs from a user gesture.
  function playCrackle() {
    try {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtx ??= new Ctor();
      const ctx = audioCtx;
      const now = ctx.currentTime;
      const master = ctx.createGain();
      master.gain.value = 0.22;
      master.connect(ctx.destination);

      // Low electric zap sweeping down.
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.exponentialRampToValueAtTime(38, now + 0.5);
      const oscGain = ctx.createGain();
      oscGain.gain.setValueAtTime(0.0001, now);
      oscGain.gain.exponentialRampToValueAtTime(0.32, now + 0.02);
      oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
      osc.connect(oscGain);
      oscGain.connect(master);
      osc.start(now);
      osc.stop(now + 0.55);

      // Sparse crackle: random pops through a bandpass.
      const len = Math.floor(ctx.sampleRate * 0.7);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) {
        const env = 1 - i / len;
        data[i] = Math.random() < 0.05 * env ? (Math.random() * 2 - 1) * env : 0;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buf;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 2400;
      bp.Q.value = 0.7;
      const nGain = ctx.createGain();
      nGain.gain.value = 0.7;
      noise.connect(bp);
      bp.connect(nGain);
      nGain.connect(master);
      noise.start(now);
      noise.stop(now + 0.7);
    } catch {
      /* Web Audio unavailable or blocked — surge stays silent. */
    }
  }

  function surge(withSound = true) {
    if (withSound) playCrackle();
    surging = true;
    clearTimeout(surgeTimer);
    surgeTimer = setTimeout(() => (surging = false), 1100);
  }

  // ── The bench wire: one continuous cable from the terminal down the page. ──
  // The wire is plugged into the CRT in the top-left margin, snakes down the
  // column edges, and crosses the reading column at each section boundary — so
  // the horizontal runs *are* the dividers. Scrolling charges it from the top
  // down (a draw-on via stroke-dashoffset), and a white-hot bead rides the
  // leading edge like live current. Geometry is measured from the real layout,
  // so it stays glued to the dividers as content/heights change.
  let pageEl = $state<HTMLElement | undefined>(undefined);
  let wireW = $state(0);
  let wireH = $state(0);
  let charge = $state(0); // 0..1 scroll progress = how far the current has run
  let reduceMotion = $state(false);
  let scrollRaf = 0;
  let wireRO: ResizeObserver | undefined;

  // The wire is built from brass-pipe sprites: straight runs (a seamless shaft
  // tiled to length), a ball joint at each corner, and a frayed sparking end at
  // the terminus — each with an "off" and "on" art layer. The scroll-charge
  // lights them in sequence, so current visibly flows down the pipe.
  type WireSeg = { dir: 'h' | 'v'; x: number; y: number; len: number; s: number };
  type WireNode = { kind: 'joint' | 'end'; x: number; y: number; at: number; rot: number };
  let segments = $state<WireSeg[]>([]);
  let nodes = $state<WireNode[]>([]);
  let wireTotal = $state(1); // total run length, for mapping charge → distance

  // How lit a piece is (0..1): the charge front (charge × total run) crossing
  // it, ramped over `over` px so the current flows rather than snapping on.
  const litAmt = (from: number, over: number) =>
    Math.max(0, Math.min(1, (charge * wireTotal - from) / over));

  function buildWire() {
    const page = pageEl;
    if (!page) return;
    const pr = page.getBoundingClientRect();
    // Coordinates are page-relative so the SVG can live inside .page. The svg
    // draws with overflow:visible, so negative x (out to the CRT) is fine.
    const rel = (el: Element) => {
      const r = el.getBoundingClientRect();
      const x = r.left - pr.left;
      const y = r.top - pr.top;
      return { x, y, w: r.width, h: r.height, cx: x + r.width / 2, bottom: y + r.height };
    };

    const col = page.querySelector('main');
    const blocks = [...page.querySelectorAll('.block')];
    const crt = page.querySelector('.crt');
    const foot = page.querySelector('footer');
    if (!col || !foot || blocks.length === 0) return;

    wireW = pr.width;
    wireH = page.offsetHeight;

    const c = rel(col);
    const left = c.x;
    const right = c.x + c.w;
    // Vertical rails sit out in the margins so they keep well clear of the
    // text, but stay on-screen — clamped to the viewport so nothing overflows
    // on narrow layouts where the column nearly fills the width.
    const vpLeft = -pr.left;
    const vpRight = window.innerWidth - pr.left;
    // Push the vertical rails well out into the margins to give the text room —
    // scaled to the available margin, capped, and clamped on-screen so narrow
    // layouts (where the column nearly fills the width) don't overflow.
    const marginAvail = Math.min(left - vpLeft, vpRight - right);
    const gap = Math.max(44, Math.min(150, marginAvail * 0.55));
    // keep the rails (plus their ~21px joints) on-screen on narrow layouts
    const railL = Math.max(vpLeft + 24, left - gap);
    const railR = Math.min(vpRight - 24, right + gap);

    // Where the wire plugs in: out of the bottom of the terminal, dropping
    // behind the shelf before it routes to the spine. The CRT is retired below
    // 720px (display:none → zero-size rect), so fall back to the column top.
    const cr = crt ? rel(crt) : null;
    const hasCrt = !!cr && cr.w > 0 && cr.h > 0;
    let startX: number;
    let startY: number;
    let exitY: number;
    if (hasCrt && cr) {
      startX = cr.x + cr.w * 0.33; // centre of the device
      startY = cr.y + cr.h * 0.4; // its base, where it meets the shelf
      exitY = cr.y + cr.h * 0.56; // clear of the shelf below
    } else {
      startX = railL;
      startY = c.y - 34;
      exitY = c.y - 20;
    }

    // Vertices of the routed polyline: out the bottom of the terminal, over to
    // the first rail, then the snake — drop to a divider, cross the column, drop
    // the far rail — and finally down into the footer.
    const dividers = blocks.map((b) => rel(b).y - 12); // sit in the gap above each block
    const pts: Array<[number, number]> = [
      [startX, startY],
      [startX, exitY],
      [railL, exitY]
    ];
    let side: 'l' | 'r' = 'l';
    for (const y of dividers) {
      pts.push([side === 'l' ? railL : railR, y]); // drop down this rail
      pts.push([side === 'l' ? railR : railL, y]); // cross the column = a divider
      side = side === 'l' ? 'r' : 'l';
    }
    const f = rel(foot);
    pts.push([side === 'l' ? railL : railR, f.y + 14]);

    // Turn the polyline into pipe segments + corner elbows, tracking distance
    // along the run so the charge can light them in order. The elbow art is
    // native LEFT+DOWN; each corner rotates it to face its two runs.
    const travel = (a: number[], b: number[]) =>
      Math.abs(b[0] - a[0]) >= Math.abs(b[1] - a[1])
        ? b[0] > a[0]
          ? 'R'
          : 'L'
        : b[1] > a[1]
          ? 'D'
          : 'U';
    const opp: Record<string, string> = { U: 'D', D: 'U', L: 'R', R: 'L' };
    const elbowRot: Record<string, number> = { DL: 0, LU: 90, RU: 180, DR: 270 };
    const segs: WireSeg[] = [];
    const nds: WireNode[] = [];
    let dist = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i];
      const [x1, y1] = pts[i + 1];
      const len = Math.hypot(x1 - x0, y1 - y0);
      if (len < 1) continue; // skip the zero-length lead-in on narrow layouts
      const dir: 'h' | 'v' = Math.abs(x1 - x0) >= Math.abs(y1 - y0) ? 'h' : 'v';
      segs.push({ dir, x: Math.min(x0, x1), y: Math.min(y0, y1), len, s: dist });
      const at = dist + len;
      if (i < pts.length - 2) {
        // corner elbow: arms face the incoming and outgoing runs
        const inc = travel(pts[i], pts[i + 1]);
        const out = travel(pts[i + 1], pts[i + 2]);
        const key = [opp[inc], out].sort().join('');
        nds.push({ kind: 'joint', x: x1, y: y1, at, rot: elbowRot[key] ?? 0 });
      } else {
        // Frayed sparking end, pointed the way the last segment travels.
        const rot = dir === 'v' ? (y1 > y0 ? 90 : -90) : x1 > x0 ? 0 : 180;
        nds.push({ kind: 'end', x: x1, y: y1, at, rot });
      }
      dist += len;
    }
    segments = segs;
    nodes = nds;
    wireTotal = Math.max(1, dist);
    updateCharge();
  }

  function updateCharge() {
    if (reduceMotion) {
      charge = 1;
      return;
    }
    const doc = document.documentElement;
    const scrollable = doc.scrollHeight - window.innerHeight;
    charge = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 1;
  }

  function onScroll() {
    if (scrollRaf) return;
    scrollRaf = requestAnimationFrame(() => {
      scrollRaf = 0;
      updateCharge();
    });
  }

  function playClick(on: boolean) {
    const el = on ? audioOn : audioOff;
    if (!el) return;
    el.currentTime = 0;
    const p = el.play();
    if (p) p.then(() => (pullPlayed = true)).catch(() => {});
  }

  function turnOn() {
    if (lit) return;
    lit = true;
    playClick(true);
    surge(false); // the initial power surge as the room comes alive (silent)
  }

  function toggleLamp() {
    lit = !lit;
    playClick(lit);
    discover('lamp');
  }

  onMount(() => {
    // Dark warm-workshop palette for this route only.
    document.body.classList.add('room');

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    reduceMotion = prefersReduced;
    const gestures = ['pointerdown', 'keydown', 'touchstart'] as const;
    const disarm = () => gestures.forEach((g) => window.removeEventListener(g, onGesture));

    // Autoplay is blocked until the user interacts; if the on-sound can't play with
    // the reveal, play it on the first interaction — unless that's the lamp itself.
    const onGesture = (e: Event) => {
      disarm();
      const onLamp = (e.target as HTMLElement | null)?.closest('.lamp-switch');
      if (!pullPlayed && !onLamp) playClick(true);
    };

    let timer: ReturnType<typeof setTimeout> | undefined;
    if (prefersReduced) {
      lit = true;
    } else {
      timer = setTimeout(turnOn, 650);
      gestures.forEach((g) => window.addEventListener(g, onGesture));
    }

    runCrt(); // the terminal in the corner starts its looping session

    // Build the bench wire from the real layout, then keep it glued to the
    // content: re-measure whenever the page resizes (fonts, images, reflow) or
    // the viewport changes, and charge it as the reader scrolls.
    requestAnimationFrame(buildWire);
    if (pageEl && 'ResizeObserver' in window) {
      wireRO = new ResizeObserver(() => buildWire());
      wireRO.observe(pageEl);
    }
    const onResize = () => buildWire();
    window.addEventListener('resize', onResize);
    window.addEventListener('load', onResize);
    if (!prefersReduced) window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      if (timer) clearTimeout(timer);
      clearTimeout(surgeTimer);
      crtRunning = false;
      disarm();
      wireRO?.disconnect();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('load', onResize);
      window.removeEventListener('scroll', onScroll);
      if (scrollRaf) cancelAnimationFrame(scrollRaf);
      document.body.classList.remove('room');
    };
  });

  const img = (name: string) => `${base}/illustrations/${name}.webp`;

  // ── Inhabited room: ambient sound + per-prop hover sounds ────────────────
  // Sound is opt-in (autoplay is blocked, and silence-by-default is polite).
  // The toggle starts the low room-tone loop; prop hovers play one-shots.
  let soundOn = $state(false);
  let roomTone = $state<HTMLAudioElement | undefined>(undefined);

  $effect(() => {
    const el = roomTone;
    if (!el) return;
    if (soundOn) {
      // Set the source on first use so the static build doesn't crawl a
      // (currently) missing file. Drop static/audio/room-tone.mp3 in and it works.
      if (!el.src) el.src = `${base}/audio/room-tone.mp3`;
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  });

  // Everything you can find: five section titles, the lamp, the surge, the CRT,
  // and the SalesAPE mascot on the pegboard.
  const total = 5 + 3 + 1;

  // Dust motes drifting in the lamplight. Deterministic positions so SSR and
  // the client agree (no hydration mismatch from Math.random).
  const motes = Array.from({ length: 22 }, (_, i) => ({
    // Biased toward the right, where the lamp pool is, so they read as
    // catching the light rather than floating over flat paper.
    x: 32 + ((i * 47 + 11) % 66),
    y: (i * 37 + 5) % 78,
    size: 2 + (i % 4) * 0.9,
    dur: 10 + (i % 6) * 2.5,
    delay: -(i * 1.7)
  }));

  // Hover a title and it dissolves left-to-right into flickering binary,
  // then restores on leave. No-op under reduced-motion.
  function binary(node: HTMLElement, id: string) {
    const original = node.textContent ?? '';
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let timer: ReturnType<typeof setInterval> | undefined;

    const stop = () => {
      if (timer) clearInterval(timer);
      timer = undefined;
    };
    const scramble = () => {
      discover(`title-${id}`);
      if (reduced) return;
      stop();
      let frame = 0;
      timer = setInterval(() => {
        frame += 1;
        node.textContent = original
          .split('')
          .map((ch, i) => (ch === ' ' ? ' ' : i < frame ? (Math.random() < 0.5 ? '0' : '1') : ch))
          .join('');
      }, 45);
    };
    const restore = () => {
      stop();
      node.textContent = original;
    };

    node.addEventListener('pointerenter', scramble);
    node.addEventListener('pointerleave', restore);
    return {
      destroy() {
        stop();
        node.removeEventListener('pointerenter', scramble);
        node.removeEventListener('pointerleave', restore);
      }
    };
  }

  // ── CRT terminal: a looping shell "session" that types out the bio, with
  //    the green phosphor glow and scanlines drawn over the sketch's glass. ──
  const crtScript: { cmd: string; out: string }[] = [
    { cmd: 'whoami', out: 'product builder, london' },
    { cmd: 'cat now.md', out: 'AI agents @ salesape.ai' },
    { cmd: 'ls ./past', out: 'superstack  move  movegb' },
    { cmd: 'echo $ethos', out: 'built by hand, in the open' }
  ];
  let crtOut = $state<string[]>([]);
  let crtCur = $state('~ $');
  let crtRunning = false;

  function runCrt() {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      crtOut = crtScript.flatMap((s) => [`~ $ ${s.cmd}`, s.out]).slice(-5);
      crtCur = '~ $';
      return;
    }
    crtRunning = true;
    const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
    (async () => {
      while (crtRunning) {
        crtOut = [];
        for (const step of crtScript) {
          for (let i = 0; i <= step.cmd.length; i++) {
            if (!crtRunning) return;
            crtCur = `~ $ ${step.cmd.slice(0, i)}`;
            await sleep(58);
          }
          crtOut = [...crtOut, crtCur].slice(-5);
          crtCur = '';
          await sleep(280);
          for (let i = 0; i <= step.out.length; i++) {
            if (!crtRunning) return;
            crtCur = step.out.slice(0, i);
            await sleep(33);
          }
          crtOut = [...crtOut, crtCur].slice(-5);
          crtCur = '~ $';
          await sleep(820);
        }
        await sleep(1500);
      }
    })();
  }
</script>

<svelte:head>
  <title>Matt Roche — product builder</title>
  <meta
    name="description"
    content="Matt Roche — a product builder in London. AI products at SalesAPE, SuperStack, Hyper Product Club; previously Move Technologies and MoveGB."
  />
  <noscript>
    {@html `<style>.reveal{display:none!important}</style>`}
  </noscript>
</svelte:head>

<audio bind:this={audioOn} preload="auto" src="{base}/audio/lamp-on.mp3"></audio>
<audio bind:this={audioOff} preload="auto" src="{base}/audio/lamp-off.mp3"></audio>
<!-- Low room tone (rain + distant hum). Source is set from JS on first play;
     add static/audio/room-tone.mp3 to fill it. -->
<audio bind:this={roomTone} preload="none" loop></audio>

<!-- Warm lamplight pools across the bench; the dark edges are the cool surround. -->
<div class="ambient" class:lit class:surging aria-hidden="true"></div>


<!-- Dust motes drifting in the lamplight. -->
<div class="motes" class:lit aria-hidden="true">
  {#each motes as m}
    <span
      class="mote"
      style="left:{m.x}%; top:{m.y}%; width:{m.size}px; height:{m.size}px; animation-duration:{m.dur}s; animation-delay:{m.delay}s"
    ></span>
  {/each}
</div>

<!-- The dim-room veil that lifts when the lamp comes on. -->
<div class="reveal" class:lit aria-hidden="true"></div>

<!-- Power-surge button: jolt the board to life with a crackle of current. -->
<button
  class="surge-btn"
  class:lit
  onclick={() => {
    surge(true);
    discover('surge');
  }}
  aria-label="Send a surge of current through the board"
>
  <span class="bolt" aria-hidden="true">⚡</span> surge
</button>

<!-- Discovery counter — a nudge to poke around and find every interactive thing. -->
<div class="counter" class:lit class:complete={found === total} aria-live="polite">
  <span class="counter-prompt">$</span>
  <span class="counter-text"
    >{found === total ? 'all found' : 'find'} <span class="counter-num">{found}/{total}</span></span
  >
  <span class="counter-caret">▌</span>
</div>

{#snippet entryList(items: Entry[])}
  <ul class="entries">
    {#each items as e}
      <li>
        <div class="entry-head">
          <span class="entry-name">{e.name}</span>
          {#if e.role}<span class="entry-role">{e.role}</span>{/if}
        </div>
        <p>
          {e.blurb}
          {#if e.href}
            <a href={e.href} target="_blank" rel="noopener">{e.hrefLabel ?? e.href} →</a>
          {/if}
        </p>
      </li>
    {/each}
  </ul>
{/snippet}

<div class="page" class:surging bind:this={pageEl}>
  <!-- Workshop pegboard down each margin: a framed brass panel, its dotted
       field tiled to the full height. Fixed to the viewport edges so it reads
       as the wall the lit bench stands against. Retired below 1080px, where
       the margins are too narrow to hold it clear of the column. -->
  <div class="pegwall pegwall-l" aria-hidden="true"></div>
  <div class="pegwall pegwall-r" aria-hidden="true"></div>

  <!-- The bench wire: brass pipe plugged into the terminal, snaking down the
       column and crossing it at each section boundary (the crossings are the
       dividers). Built from sprite tiles — a tiled shaft per run, a joint at
       each corner, a frayed sparking end. Each piece lights off→on as the
       scroll-current flows down it, powering the page up. -->
  <div
    class="wire"
    class:reduce={reduceMotion}
    style="width:{wireW}px; height:{wireH}px"
    aria-hidden="true"
  >
    {#each segments as seg (seg.s)}
      <!-- runs are inset 9px at each end so they butt right into the bend arc
           (which reaches ~11px inward), for a seamless join with no overshoot -->
      <div
        class="wseg {seg.dir}"
        style="left:{seg.dir === 'h' ? seg.x + 9 : seg.x - 7}px; top:{seg.dir === 'h'
          ? seg.y - 7
          : seg.y + 9}px; width:{seg.dir === 'h'
          ? Math.max(0, seg.len - 18)
          : 14}px; height:{seg.dir === 'h' ? 14 : Math.max(0, seg.len - 18)}px;"
      >
        <span class="pipe off"></span>
        <span class="pipe on" style="opacity:{litAmt(seg.s, seg.len)}"></span>
      </div>
    {/each}
    {#each nodes as n (n.at)}
      {#if n.kind === 'joint'}
        <!-- corner elbow, rotated to face its two runs -->
        <div class="welbow" style="left:{n.x - 11}px; top:{n.y - 11}px; transform:rotate({n.rot}deg);">
          <span class="el off"></span>
          <span class="el on" style="opacity:{litAmt(n.at - 20, 44)}"></span>
        </div>
      {:else}
        <div
          class="wend"
          style="left:{n.x}px; top:{n.y}px; transform:translate(-50%, -50%) rotate({n.rot}deg);"
        >
          <span class="ed off"></span>
          <span class="ed on" style="opacity:{litAmt(n.at - 30, 40)}"></span>
        </div>
      {/if}
    {/each}
  </div>

  <!-- Old CRT terminal on a shelf in the top-left margin. The sketch's dark
       vignette drops into the page via a screen blend; the glass is left clear
       for the live phosphor screen that types out a looping shell session. -->
  <div class="crt">
    <img
      class="crt-img"
      src={img('crt')}
      alt="A vintage terminal on a shelf with a trailing plant"
    />
    <div class="crt-screen" aria-hidden="true">
      <div class="crt-text">
        {#each crtOut as line}<span class="crt-line">{line}</span>{/each}
        <span class="crt-line">{crtCur}<i class="crt-caret"></i></span>
      </div>
    </div>
    <button
      class="crt-hit"
      onpointerenter={() => discover('crt')}
      aria-label="An old workshop terminal"
    ></button>
  </div>

  <!-- Pendant lamp: hangs on its chain from the top of the page, lighting the
       hero. The shade is the on/off switch. -->
  <div class="pendant" class:lit class:surging>
    <span class="pool" aria-hidden="true"></span>
    <img class="lamp-img off" src={img('pendant-off')} alt="" aria-hidden="true" />
    <img class="lamp-img on" src={img('pendant-on')} alt="" aria-hidden="true" />
    <button
      class="lamp-switch"
      onclick={toggleLamp}
      aria-pressed={lit}
      aria-label={lit ? 'Turn the workshop lamp off' : 'Turn the workshop lamp on'}
    ></button>
  </div>

  <header class="top">
    <a class="mark" href="#top">Matt Roche</a>
    <nav aria-label="Sections">
      <a href="#work">Work</a>
      <a href="#projects">Tinkering</a>
      <a href="#writing">Writing</a>
      <a href="#contact">Contact</a>
    </nav>
  </header>

  <main id="top">
    <section class="intro">
      <h1>{intro.name}</h1>
      <p class="tagline">{intro.tagline}</p>
      {#each intro.paragraphs as p}
        <p>{p}</p>
      {/each}
    </section>

    <section id="work" class="block">
      <h2 class="label" use:binary={'work'}>Work</h2>
      <!-- The SalesAPE mascot, bolted to the left pegboard beside the entry: a
           headset-wearing workshop ape that hangs idle and chatters on hover
           (and gives a shout when the board surges). -->
      <button
        class="pegape"
        aria-label="SalesAPE mascot"
        onpointerenter={() => discover('ape')}
      ></button>
      {@render entryList(now)}
    </section>

    <section class="block">
      <h2 class="label" use:binary={'previously'}>Previously</h2>
      {@render entryList(previously)}
    </section>

    <section id="projects" class="block">
      <h2 class="label" use:binary={'tinkering'}>Tinkering</h2>
      {@render entryList(projects)}
    </section>

    <section id="writing" class="block">
      <h2 class="label" use:binary={'writing'}>Writing</h2>
      <ul class="entries">
        <li>
          <div class="entry-head"><span class="entry-name">{writing.name}</span></div>
          <p>
            {writing.blurb}
            <a href={writing.href} target="_blank" rel="noopener">{writing.hrefLabel} →</a>
          </p>
        </li>
      </ul>
    </section>

    <section id="contact" class="block contact">
      <h2 class="label" use:binary={'contact'}>Get in touch</h2>
      <p>
        The kettle&rsquo;s usually on. Best by email — I read everything, and reply to most.
      </p>
      <p class="links">
        <a href="mailto:{links.email}">{links.email}</a>
        <a href={links.github} target="_blank" rel="noopener">GitHub</a>
        <a href={links.linkedin} target="_blank" rel="noopener">LinkedIn</a>
        <a href={links.superstack} target="_blank" rel="noopener">SuperStack</a>
      </p>
    </section>
  </main>

  <footer>
    <div class="colophon">
      <span>Made by hand · London · {new Date().getFullYear()}</span>
      <div class="colophon-right">
        <button
          class="sound"
          onclick={() => (soundOn = !soundOn)}
          aria-pressed={soundOn}
          aria-label={soundOn ? 'Mute room sound' : 'Play room sound'}
        >
          {soundOn ? '◉ sound on' : '○ sound off'}
        </button>
        <a href="{base}/workshop">Enter the workshop →</a>
      </div>
    </div>
  </footer>
</div>

<style>
  /* ── Reveal veil ─────────────────────────────────────────────────────────
     The room starts in near-darkness with a faint ember where the lamp sits;
     clicking the lamp lifts the veil to show the dark, warm-lit workshop. */
  .reveal {
    position: fixed;
    inset: 0;
    z-index: 50;
    pointer-events: none;
    background: radial-gradient(
      60% 55% at 78% 24%,
      rgba(94, 62, 30, 0.4) 0%,
      rgba(18, 12, 7, 0.97) 55%,
      rgba(9, 6, 3, 0.99) 100%
    );
    opacity: 1;
    transition: opacity 1900ms ease;
  }
  .reveal.lit {
    opacity: 0;
  }

  /* ── Ambient lamplight: the warm island over the dark, cool surround ──────
     A soft amber pool near the lamp, a gentle lift over the bench so text
     reads, and one cool accent bleeding in from the far corner (garnish). */
  .ambient {
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    /* Scroll-stable ambient: a soft warm bloom from the top, cool shadow
       deepening into the corners. The body gradient carries the warm bench;
       the lamp's own pool is the bright hotspot. */
    background:
      radial-gradient(90% 55% at 50% 0%, rgba(255, 180, 100, 0.12) 0%, transparent 55%),
      radial-gradient(70% 60% at 100% 100%, rgba(64, 94, 112, 0.12) 0%, transparent 55%),
      radial-gradient(70% 60% at 0% 100%, rgba(64, 94, 112, 0.1) 0%, transparent 55%);
    opacity: 0;
    transition: opacity 2200ms ease;
  }
  .ambient.lit {
    opacity: 1;
  }

  /* ── Dust motes (only alive once the lamp is lit) ────────────────────────── */
  .motes {
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    opacity: 0;
    transition: opacity 2000ms ease;
  }
  .motes.lit {
    opacity: 1;
  }
  .mote {
    position: absolute;
    border-radius: 50%;
    /* A bright warm core with an amber halo so it catches the light against
       the pale paper — pale-on-pale was the reason they vanished. */
    background: radial-gradient(
      circle,
      rgba(255, 252, 244, 0.98) 0%,
      rgba(255, 214, 150, 0.85) 45%,
      rgba(255, 196, 120, 0) 100%
    );
    box-shadow: 0 0 7px 1px rgba(255, 198, 128, 0.85);
    animation-name: drift;
    animation-timing-function: ease-in-out;
    animation-iteration-count: infinite;
    will-change: transform, opacity;
  }
  @keyframes drift {
    0% {
      transform: translate(0, 0);
      opacity: 0;
    }
    15% {
      opacity: 1;
    }
    80% {
      opacity: 0.75;
    }
    100% {
      transform: translate(22px, -52px);
      opacity: 0;
    }
  }

  /* ── Pendant lamp (hangs on its chain from the top; the shade is the switch) */
  .pendant {
    position: absolute;
    top: 0;
    right: clamp(0.5rem, 4vw, 3.5rem);
    z-index: 3;
    width: clamp(150px, 19vw, 215px);
    aspect-ratio: 1024 / 1536;
    /* The chain and empty canvas mustn't swallow clicks meant for the nav or
       the hero; only the shade (the switch) takes the pointer. */
    pointer-events: none;
  }
  .pool {
    position: absolute;
    left: 50%;
    top: 64%;
    width: 460px;
    height: 460px;
    transform: translate(-50%, -42%);
    background: radial-gradient(
      50% 50% at 50% 50%,
      rgba(255, 196, 120, 0.42) 0%,
      rgba(255, 170, 95, 0.14) 42%,
      transparent 72%
    );
    /* Additive, so it reads as cast light rather than a veil over the text. */
    mix-blend-mode: screen;
    opacity: 0;
    transition: opacity 1400ms ease;
    pointer-events: none;
    z-index: -1;
  }
  .pendant.lit .pool {
    opacity: 1;
  }
  .lamp-img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
    filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.45));
  }
  .lamp-img.on {
    opacity: 0;
    transition: opacity 650ms ease, filter 650ms ease;
  }
  .pendant.lit .lamp-img.on {
    opacity: 1;
    filter: drop-shadow(0 0 24px rgba(255, 180, 90, 0.5));
  }
  .pendant.lit .lamp-img.off {
    opacity: 0;
    transition: opacity 650ms ease;
  }
  /* The shade is the clickable on/off switch. */
  .lamp-switch {
    position: absolute;
    left: 8%;
    right: 8%;
    top: 40%;
    height: 42%;
    pointer-events: auto;
    cursor: pointer;
    border-radius: 50% / 42%;
  }

  /* ── CRT terminal (top-left margin) ──────────────────────────────────────
     The sketch sits out in the left margin; the live phosphor screen is laid
     over the (blank, drawn) glass. */
  .crt {
    position: absolute;
    top: -1rem;
    /* Sit further out in the left margin so it doesn't crowd the title. */
    right: calc(100% + 3.25rem);
    z-index: 2;
    width: clamp(230px, 25vw, 318px);
    aspect-ratio: 1024 / 1536;
    pointer-events: none;
  }
  .crt-img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
    /* A faint warm rim so the object lifts off the dark wall, matching the
       other margin props. */
    filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.5))
      drop-shadow(0 0 14px rgba(255, 182, 110, 0.1));
  }
  .crt-screen {
    position: absolute;
    left: 19%;
    top: 19%;
    width: 34.5%;
    height: 17%;
    display: flex;
    overflow: hidden;
    border-radius: 6% / 12%;
    background: radial-gradient(
      125% 135% at 50% 28%,
      rgba(22, 44, 26, 0.5),
      rgba(5, 12, 7, 0.78)
    );
    box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.7);
  }
  .crt-text {
    align-self: flex-end;
    width: 100%;
    padding: 3% 5%;
    font-family: var(--mono);
    font-size: clamp(4px, 0.76vw, 7px);
    line-height: 1.45;
    color: #7bf2a3;
    text-shadow: 0 0 4px rgba(99, 242, 150, 0.75);
    white-space: pre;
    overflow: hidden;
  }
  .crt-line {
    display: block;
  }
  .crt-caret {
    display: inline-block;
    width: 0.58em;
    height: 0.95em;
    margin-left: 1px;
    background: #7bf2a3;
    vertical-align: -0.1em;
    box-shadow: 0 0 5px rgba(99, 242, 150, 0.85);
    animation: crt-blink 1.05s steps(1) infinite;
  }
  @keyframes crt-blink {
    0%,
    50% {
      opacity: 1;
    }
    50.01%,
    100% {
      opacity: 0;
    }
  }
  /* Scanlines + a faint phosphor flicker over the glass. */
  .crt-screen::after {
    content: '';
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      to bottom,
      rgba(0, 0, 0, 0) 0 2px,
      rgba(0, 0, 0, 0.28) 2px 3px
    );
    pointer-events: none;
    animation: crt-flicker 3.2s steps(1) infinite;
  }
  @keyframes crt-flicker {
    0%,
    97%,
    100% {
      opacity: 0.85;
    }
    98% {
      opacity: 0.6;
    }
    99% {
      opacity: 1;
    }
  }
  .crt-hit {
    position: absolute;
    left: 12%;
    top: 15%;
    width: 52%;
    height: 32%;
    pointer-events: auto;
    cursor: pointer;
  }

  /* ── Page column ─────────────────────────────────────────────────────── */
  .page {
    position: relative;
    z-index: 1;
    max-width: 42rem;
    margin: 0 auto;
    padding: 0 1.5rem 0;
  }

  .top {
    position: relative;
    z-index: 5; /* nav rides above the hanging chain */
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1.75rem 0 0;
  }
  .mark {
    font-family: var(--mono);
    font-size: 0.82rem;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--ink);
    opacity: 0.92;
    transition: color 180ms ease;
  }
  .mark:hover {
    color: var(--accent-deep);
  }
  .top nav {
    display: flex;
    gap: 1.25rem;
  }
  .top nav a {
    font-family: var(--mono);
    font-size: 0.72rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--ink-dim);
    transition: color 180ms ease;
  }
  .top nav a:hover {
    color: var(--ink);
  }

  /* ── Intro ───────────────────────────────────────────────────────────── */
  main {
    position: relative;
    z-index: 1; /* the reading column sits above the bench wire */
    padding-top: clamp(3rem, 12vh, 7rem);
  }
  .intro {
    position: relative;
    margin-bottom: clamp(3rem, 8vw, 5rem);
  }
  h1 {
    font-weight: 500;
    font-size: clamp(2.6rem, 8vw, 4.3rem);
    line-height: 1.02;
    letter-spacing: -0.012em;
    margin: 0;
  }
  .tagline {
    font-style: italic;
    font-size: clamp(1.3rem, 3vw, 1.7rem);
    color: var(--ink-dim);
    margin: 0.6rem 0 1.8rem;
  }
  /* A blinking cursor, as if the line were just typed at a prompt. */
  .tagline::after {
    content: "▌";
    margin-left: 0.12em;
    font-style: normal;
    color: var(--accent);
    animation: caret 1.1s steps(1) infinite;
  }
  @keyframes caret {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0;
    }
  }
  .intro p:not(.tagline) {
    margin: 0 0 1.1rem;
    max-width: 36rem;
  }

  /* ── Blocks ──────────────────────────────────────────────────────────── */
  .block {
    position: relative;
    padding: clamp(2rem, 5vw, 3rem) 0;
  }

  /* ── The bench wire ──────────────────────────────────────────────────────
     Brass pipe built from sprite tiles, positioned from the real layout in
     script. Lives inside the reading column but draws with overflow visible so
     it can reach out to the terminal in the margin and cross at each divider.
     Every piece stacks an "off" art layer with an "on" layer faded in by the
     scroll-charge, so current lights the pipe as it flows down. */
  .wire {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 0; /* behind the text (main sits at z-index 1), above the bg */
    overflow: visible;
    pointer-events: none;
    opacity: 0.72; /* a quiet fixture in the room, not a dominant feature */
  }
  .wseg {
    position: absolute;
  }
  .wseg .pipe {
    position: absolute;
    inset: 0;
    border-style: solid;
    border-color: transparent;
  }
  /* Straight runs use the whole brass-pipe sprite via border-image (9-slice):
     the coupling ends stay fixed while the plain shaft tiles to any length, so
     every run keeps its coupling joins on both ends. */
  .wseg.h .pipe {
    border-width: 2px 9px;
    border-image-slice: 5 25 5 24 fill;
    border-image-repeat: repeat stretch;
  }
  .wseg.v .pipe {
    border-width: 9px 2px;
    border-image-slice: 24 5 24 5 fill;
    border-image-repeat: stretch repeat;
  }
  .wseg.h .pipe.off {
    border-image-source: url('/wire/straight_h_off.png');
  }
  .wseg.h .pipe.on {
    border-image-source: url('/wire/straight_h_on.png');
  }
  .wseg.v .pipe.off {
    border-image-source: url('/wire/straight_v_off.png');
  }
  .wseg.v .pipe.on {
    border-image-source: url('/wire/straight_v_on.png');
  }
  .pipe.on {
    mix-blend-mode: screen; /* the warm glow adds light over the off layer */
  }

  /* Corner elbows and the frayed end sit above the shafts to cap the seams. */
  .welbow {
    position: absolute;
    width: 22px;
    height: 22px;
    z-index: 1; /* the bend arc rides above the shafts */
  }
  .wend {
    position: absolute;
    width: 66px;
    height: 36px;
    transform-origin: center;
  }
  .welbow .el,
  .wend .ed{
    position: absolute;
    inset: 0;
    background-repeat: no-repeat;
    background-position: center;
    background-size: contain;
  }
  .welbow .el.off {
    background-image: url('/wire/elbow_off.png');
  }
  .welbow .el.on {
    background-image: url('/wire/elbow_on.png');
  }
  .wend .ed.off {
    background-image: url('/wire/end_off.png');
  }
  .wend .ed.on {
    background-image: url('/wire/end_on.png');
  }
  .el.on,
  .ed.on {
    mix-blend-mode: screen;
  }

  /* Power surge: the whole lit pipe flares brighter for a beat. */
  .page.surging .pipe.on,
  .page.surging .el.on,
  .page.surging .ed.on {
    animation: wire-flare 0.9s ease-out;
  }
  @keyframes wire-flare {
    0%,
    100% {
      filter: brightness(1);
    }
    18% {
      filter: brightness(1.9) saturate(1.2);
    }
  }

  /* The lamp flickers and the room brightness jumps as the current hits. */
  .ambient.surging {
    animation: ambient-flash 0.8s ease-out;
  }
  @keyframes ambient-flash {
    0%,
    100% {
      filter: brightness(1);
    }
    16% {
      filter: brightness(1.55);
    }
  }
  .pendant.surging .pool {
    animation: lamp-surge 0.8s ease-out;
  }
  @keyframes lamp-surge {
    0%,
    100% {
      opacity: 1;
    }
    10% {
      opacity: 0.35;
    }
    22% {
      opacity: 1;
    }
    36% {
      opacity: 0.55;
    }
    48% {
      opacity: 1;
    }
  }

  /* ── Workshop pegboard walls ─────────────────────────────────────────────
     A framed brass pegboard panel pinned to each viewport edge — the wall the
     lit bench stands against. Drawn as a 9-slice border-image of the strip
     sprite: the frame + screw rows are the fixed caps, and the dotted field
     tiles down the middle to any height. Slice boundaries sit at dot-row
     midpoints, so the vertical tiling has no visible seam. Behind all content;
     ignores the pointer; sunk a little into shadow so it never outshines the
     reading column. Retired below 1080px where the margins can't clear it. */
  .pegwall {
    position: absolute;
    /* Start below the terminal so the hero stays open, and run to the page
       foot. The offset tracks the terminal's rendered height (its width, which
       is clamp(230,25vw,318), by the 2:3 art ratio → ×1.5), plus a small gap. */
    top: calc(clamp(345px, 37.5vw, 477px) - 0.5rem);
    bottom: 0;
    z-index: 0;
    width: clamp(148px, 15vw, 216px);
    pointer-events: none;
    border-style: solid;
    border-width: 52px 16px 58px 16px;
    border-color: transparent;
    border-image-source: url('/pegboard/board_v.png');
    border-image-slice: 52 16 58 16 fill;
    border-image-repeat: stretch round;
    opacity: 0.88;
    filter: brightness(0.8) saturate(0.9);
  }
  /* Centred within each margin. The column is centred at 42rem, so the margin
     runs from the viewport edge to (50vw − 21rem); half of (that margin minus
     the board width) sits the board dead-centre in the gap, self-adjusting as
     the viewport changes. */
  .pegwall-l {
    left: calc((21rem - 50vw - clamp(148px, 15vw, 216px)) / 2);
  }
  .pegwall-r {
    right: calc((21rem - 50vw - clamp(148px, 15vw, 216px)) / 2);
  }

  /* SalesAPE mascot: a 7-frame sprite strip (362×436 cells) played with
     steps(). Hangs on the left pegboard, centred on the board and level with
     the SalesAPE entry. Idle it sways from its bracket; on hover — or when the
     board surges — it chatters through the frames from calm to a shout. */
  .pegape {
    position: absolute;
    top: 0.5rem;
    /* Centre on the left pegboard: the board sits at the middle of the left
       margin; this places the mascot's centre there, from inside the column
       (which is inset 1.5rem from the page edge). */
    left: calc((21rem - 50vw) / 2 - 70px - 1.5rem);
    width: 140px;
    height: 169px;
    z-index: 1; /* above the board, below nothing else here */
    background-image: url('/pegboard/ape_strip.png');
    background-repeat: no-repeat;
    background-size: 980px 169px; /* 7 × 140 wide */
    background-position: -140px 0; /* rest on frame 2 (calm, mouth closed) */
    transform-origin: 50% 8%; /* swing from the top bracket */
    animation: ape-sway 4.5s ease-in-out infinite;
    filter: drop-shadow(0 6px 10px rgba(0, 0, 0, 0.55));
    cursor: pointer;
  }
  .pegape:hover,
  .page.surging .pegape {
    animation:
      ape-sway 4.5s ease-in-out infinite,
      ape-talk 0.9s steps(7) infinite;
  }
  @keyframes ape-sway {
    0%,
    100% {
      transform: rotate(-2deg);
    }
    50% {
      transform: rotate(2deg);
    }
  }
  @keyframes ape-talk {
    from {
      background-position-x: 0;
    }
    to {
      background-position-x: -980px;
    }
  }
  /* Section titles read as a shell prompt — the software identity in the type. */
  .label {
    font-family: var(--mono);
    font-size: 0.8rem;
    font-weight: 500;
    letter-spacing: 0.05em;
    text-transform: lowercase;
    color: var(--ink-dim);
    margin: 0 0 1.6rem;
    display: inline-block;
    cursor: default;
    transition: color 220ms ease;
  }
  .label::before {
    content: "~/";
    color: #7fae86;
    opacity: 0.85;
  }
  .label::after {
    content: " $";
    color: #7fae86;
    opacity: 0.85;
  }
  .label:hover {
    color: #8fc79b; /* phosphor green while it reads as binary */
  }
  .entries {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 1.9rem;
  }
  .entry-head {
    display: flex;
    align-items: baseline;
    gap: 0.75rem;
    flex-wrap: wrap;
  }
  .entry-name {
    font-size: 1.45rem;
    font-weight: 600;
    line-height: 1.2;
  }
  .entry-role {
    font-style: italic;
    color: var(--ink-dim);
    font-size: 1.05rem;
  }
  .entries p {
    margin: 0.35rem 0 0;
    max-width: 38rem;
  }
  .entries a {
    border-bottom: 1px solid transparent;
    transition: border-color 180ms ease, color 180ms ease;
    white-space: nowrap;
  }
  .entries a:hover {
    color: var(--accent-deep);
    border-color: var(--accent);
  }

  .contact p {
    max-width: 38rem;
  }
  .links {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
    margin-top: 1.2rem !important;
  }
  .links a {
    border-bottom: 1px solid var(--rule);
    padding-bottom: 1px;
    transition: border-color 180ms ease, color 180ms ease;
  }
  .links a:hover {
    color: var(--accent-deep);
    border-color: var(--accent);
  }

  /* ── Footer ──────────────────────────────────────────────────────────── */
  footer {
    border-top: 1px solid var(--rule);
    margin-top: 2rem;
    padding-top: 2rem;
  }
  .colophon {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    padding-bottom: 2.5rem;
    font-family: var(--mono);
    font-size: 0.72rem;
    letter-spacing: 0.06em;
    color: var(--ink-dim);
  }
  .colophon-right {
    display: flex;
    align-items: center;
    gap: 1.5rem;
  }
  .colophon a:hover {
    color: var(--ink);
  }
  .sound {
    font-family: var(--mono);
    font-size: 0.72rem;
    letter-spacing: 0.06em;
    color: var(--ink-dim);
    transition: color 180ms ease;
  }
  .sound:hover {
    color: var(--ink);
  }

  /* ── Discovery counter ───────────────────────────────────────────────────
     A quiet HUD in the corner, fading in with the room, nudging you to find
     every interactive object, title, and the lamp itself. */
  .counter {
    position: fixed;
    bottom: 1rem;
    right: 1.25rem;
    z-index: 45;
    display: flex;
    align-items: baseline;
    gap: 0.45rem;
    padding: 0.5rem 0.8rem;
    border: 1px solid var(--rule);
    border-radius: 999px;
    background: rgba(20, 14, 8, 0.55);
    backdrop-filter: blur(4px);
    font-family: var(--mono);
    font-size: 0.72rem;
    letter-spacing: 0.08em;
    color: var(--ink-dim);
    pointer-events: none;
    opacity: 0;
    transition: opacity 1200ms ease, color 500ms ease, border-color 500ms ease;
  }
  .counter.lit {
    opacity: 1;
  }

  /* ── Surge button (bottom-left, mirroring the counter) ───────────────────── */
  .surge-btn {
    position: fixed;
    bottom: 1rem;
    left: 1.25rem;
    z-index: 45;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 0.85rem;
    border: 1px solid var(--rule);
    border-radius: 999px;
    background: rgba(20, 14, 8, 0.55);
    backdrop-filter: blur(4px);
    font-family: var(--mono);
    font-size: 0.72rem;
    letter-spacing: 0.08em;
    color: var(--ink-dim);
    opacity: 0;
    transition: opacity 1200ms ease, color 200ms ease, border-color 200ms ease;
  }
  .surge-btn.lit {
    opacity: 1;
  }
  .surge-btn .bolt {
    color: #9fdcf0;
    text-shadow: 0 0 8px rgba(160, 235, 255, 0.7);
  }
  .surge-btn:hover {
    color: #cdeeff;
    border-color: rgba(160, 235, 255, 0.5);
  }
  .surge-btn:active {
    transform: translateY(1px);
  }
  .counter-prompt {
    color: #7fae86;
    text-shadow: 0 0 8px rgba(127, 174, 134, 0.6);
  }
  .counter-num {
    color: var(--ink);
    font-variant-numeric: tabular-nums;
  }
  .counter-caret {
    color: var(--accent);
    animation: caret 1.1s steps(1) infinite;
  }
  .counter.complete {
    color: #bcd9a2;
    border-color: rgba(188, 217, 162, 0.5);
  }
  .counter.complete .counter-prompt {
    color: #bcd9a2;
    text-shadow: 0 0 10px rgba(188, 217, 162, 0.9);
  }
  .counter.complete .counter-num {
    color: #bcd9a2;
  }
  .counter.complete .counter-caret {
    animation: none; /* steady cursor once everything's found */
  }

  /* ── Responsive ──────────────────────────────────────────────────────── */
  /* Below ~1080px the margins are too narrow to hold the pegboard clear of
     the reading column, so the walls retire. */
  @media (max-width: 1080px) {
    .pegwall {
      display: none;
    }
  }
  @media (max-width: 720px) {
    .top nav {
      gap: 0.9rem;
    }
    .pendant {
      right: clamp(-1rem, 2vw, 0.5rem);
      width: clamp(118px, 30vw, 160px);
    }
    /* The CRT lives in the margin; on narrow screens there's no room, so retire
       it rather than let it crowd the masthead. */
    .crt {
      display: none;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .reveal,
    .ambient,
    .motes,
    .pool,
    .lamp-img.on,
    .lamp-img.off,
    .pendant.lit .lamp-img.on {
      transition: none;
    }
    .mote,
    .tagline::after,
    .counter-caret,
    .crt-caret,
    .crt-screen::after,
    .page.surging .pipe.on,
    .page.surging .el.on,
    .page.surging .ed.on,
    .ambient.surging,
    .pendant.surging .pool,
    .pegape,
    .pegape:hover,
    .page.surging .pegape {
      animation: none;
    }
  }
</style>
