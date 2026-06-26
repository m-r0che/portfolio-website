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

    return () => {
      if (timer) clearTimeout(timer);
      clearTimeout(surgeTimer);
      crtRunning = false;
      disarm();
      document.body.classList.remove('room');
    };
  });

  const img = (name: string) => `${base}/illustrations/${name}.webp`;

  // ── Inhabited room: ambient sound + per-prop hover sounds ────────────────
  // Sound is opt-in (autoplay is blocked, and silence-by-default is polite).
  // The toggle starts the low room-tone loop; prop hovers play one-shots.
  let soundOn = $state(false);
  let roomTone = $state<HTMLAudioElement | undefined>(undefined);
  const propAudio = new Map<string, HTMLAudioElement>();

  function playProp(sound: string | undefined) {
    if (!soundOn || !sound) return;
    let el = propAudio.get(sound);
    if (!el) {
      el = new Audio(`${base}/audio/${sound}.mp3`);
      el.volume = 0.35;
      propAudio.set(sound, el);
    }
    el.currentTime = 0;
    el.play().catch(() => {});
  }

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

  // Margin props — objects strewn down both margins, independent of the text.
  // `top` is a vertical position down the whole page; `off` is how deep into
  // the margin it sits; `size` varies for a sense of depth. Existing
  // illustrations stand in as placeholders; `want` is the real asset to draw
  // (see the illustration brief). `motion` is a CSS hover animation; `sound`
  // is a one-shot in static/audio/<sound>.mp3 (plays only when sound is on).
  type Prop = {
    name: string;
    want?: string;
    side: 'l' | 'r';
    top: string;
    off: string;
    size: string;
    motion: string;
    sound?: string;
  };
  const scatter: Prop[] = [
    { name: 'soldering-iron', side: 'l', top: '7%', off: '3.5rem', size: '104px', motion: 'sway', sound: 'tool' },
    { name: 'plant-pcb', want: 'oscilloscope', side: 'r', top: '12%', off: '1.5rem', size: '122px', motion: 'flicker', sound: 'scope' },
    { name: 'cassette', side: 'l', top: '21%', off: '6rem', size: '88px', motion: 'sway', sound: 'reel' },
    { name: 'books', want: 'floppy-stack', side: 'r', top: '28%', off: '5rem', size: '108px', motion: 'jitter', sound: 'floppy' },
    { name: 'ivy', want: 'debug-moth', side: 'l', top: '37%', off: '1.5rem', size: '132px', motion: 'flutter', sound: 'wing' },
    { name: 'mug', side: 'r', top: '45%', off: '3.5rem', size: '96px', motion: 'steam', sound: 'sip' },
    { name: 'plant-pcb', side: 'l', top: '54%', off: '4.5rem', size: '86px', motion: 'flicker', sound: 'led' },
    { name: 'mug', want: 'rubber-duck', side: 'r', top: '61%', off: '1.5rem', size: '108px', motion: 'jitter', sound: 'squeak' },
    { name: 'books', side: 'l', top: '70%', off: '2.5rem', size: '100px', motion: 'sway', sound: 'page' },
    { name: 'cassette', want: 'terminal-pot', side: 'r', top: '77%', off: '5.5rem', size: '92px', motion: 'blink', sound: 'key' },
    { name: 'soldering-iron', side: 'l', top: '86%', off: '4rem', size: '94px', motion: 'jitter', sound: 'tool' },
    { name: 'ivy', side: 'r', top: '91%', off: '2.5rem', size: '120px', motion: 'flutter', sound: 'wing' }
  ];

  // Everything you can find: scattered props, five titles, the lamp, the surge, the CRT.
  const total = scatter.length + 5 + 3;

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

{#snippet bench(items: Prop[])}
  {#each items as p, i}
    <span
      class="marker marker-{p.side}"
      style="top:{p.top}; --off:{p.off}; width:{p.size}"
      aria-hidden="true"
      onpointerenter={() => {
        playProp(p.sound);
        discover(`prop-${i}`);
      }}
    >
      <img class="prop-img {p.motion}" src={img(p.name)} alt="" />
    </span>
  {/each}
{/snippet}

{#snippet wings(vl: number, vr: number, i: number)}
  <span class="wing wing-l v{vl}" aria-hidden="true">
    <span class="spark" style="--idle-d: -{(vl * 1.3 + i * 0.9).toFixed(1)}s"></span>
  </span>
  <span class="wing wing-r v{vr}" aria-hidden="true">
    <span class="spark" style="--idle-d: -{(vr * 1.3 + i * 0.9 + 2.4).toFixed(1)}s"></span>
  </span>
{/snippet}

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

<div class="page" class:surging>
  <!-- Objects strewn down the margins, scattered free of the text. -->
  <div class="scatter" aria-hidden="true">
    {@render bench(scatter)}
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
    <a class="mark" href="#top" aria-label="Matt Roche — home">
      <img src={img('neon-workshop')} alt="" aria-hidden="true" />
    </a>
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
      {@render wings(1, 3, 0)}
      <h2 class="label" use:binary={'work'}>Work</h2>
      {@render entryList(now)}
    </section>

    <section class="block">
      {@render wings(4, 2, 1)}
      <h2 class="label" use:binary={'previously'}>Previously</h2>
      {@render entryList(previously)}
    </section>

    <section id="projects" class="block">
      {@render wings(2, 4, 2)}
      <h2 class="label" use:binary={'tinkering'}>Tinkering</h2>
      {@render entryList(projects)}
    </section>

    <section id="writing" class="block">
      {@render wings(3, 1, 3)}
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
      {@render wings(1, 4, 4)}
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
  .mark img {
    height: 1.7rem;
    width: auto;
    display: block;
    opacity: 0.9;
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
  /* Section dividers: a straight copper bus across the text column (with vias
     and small stubs), which then elbows down into the margins via the .wing
     pieces — horizontal, then vertical, then horizontal — one routed path. */
  .block::before {
    content: "";
    position: absolute;
    top: -12px;
    left: 0;
    right: 0;
    height: 24px;
    pointer-events: none;
    opacity: 0.5;
    background-position: left center;
    background-repeat: repeat-x;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='24'%3E%3Cg stroke='%23b48a52' stroke-width='1.1' fill='none'%3E%3Cpath d='M0 12H200'/%3E%3Cpath d='M50 12V5'/%3E%3Cpath d='M120 12V19'/%3E%3C/g%3E%3Cg fill='%23b48a52'%3E%3Ccircle cx='30' cy='12' r='2.2'/%3E%3Ccircle cx='100' cy='12' r='2.2'/%3E%3Ccircle cx='170' cy='12' r='2.2'/%3E%3Ccircle cx='50' cy='5' r='1.8'/%3E%3Ccircle cx='120' cy='19' r='1.8'/%3E%3C/g%3E%3C/svg%3E");
  }
  /* The margin elbows: the bus continues past the column edge, turns down,
     then runs horizontal again — vertical-then-horizontal, as a continuation
     of the same trace. Mirrored on the right. */
  .wing {
    position: absolute;
    top: -14px;
    width: 460px;
    height: 140px;
    pointer-events: none;
    opacity: 0.5;
    z-index: 0;
    background-repeat: no-repeat;
    background-position: left top;
  }
  .wing-l {
    right: 100%;
  }
  .wing-r {
    left: 100%;
    transform: scaleX(-1);
  }
  /* Four distinct routings — long vertical drops, different turn points — so
     no two dividers read the same. Each variant's spark path matches its art. */
  .wing.v1 {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='460' height='140'%3E%3Cg stroke='%23b48a52' stroke-width='1.1' fill='none'%3E%3Cpath d='M460 14H418V104H28'/%3E%3Cpath d='M300 104V90H286'/%3E%3C/g%3E%3Cg fill='%23b48a52'%3E%3Ccircle cx='418' cy='14' r='2.1'/%3E%3Ccircle cx='418' cy='104' r='2.1'/%3E%3Ccircle cx='28' cy='104' r='2.1'/%3E%3Ccircle cx='150' cy='104' r='1.8'/%3E%3Ccircle cx='286' cy='90' r='1.7'/%3E%3C/g%3E%3C/svg%3E");
  }
  .wing.v2 {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='460' height='140'%3E%3Cg stroke='%23b48a52' stroke-width='1.1' fill='none'%3E%3Cpath d='M460 14H402V78H150V112H64'/%3E%3Cpath d='M250 78V64H236'/%3E%3C/g%3E%3Cg fill='%23b48a52'%3E%3Ccircle cx='402' cy='14' r='2.1'/%3E%3Ccircle cx='402' cy='78' r='2.1'/%3E%3Ccircle cx='150' cy='78' r='2.1'/%3E%3Ccircle cx='150' cy='112' r='2.1'/%3E%3Ccircle cx='64' cy='112' r='2.1'/%3E%3Ccircle cx='236' cy='64' r='1.7'/%3E%3Ccircle cx='300' cy='78' r='1.7'/%3E%3C/g%3E%3C/svg%3E");
  }
  /* v3 and v4 route UP from the divider into the margin above it. */
  .wing.v3,
  .wing.v4 {
    top: -126px;
  }
  .wing.v3 {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='460' height='140'%3E%3Cg stroke='%23b48a52' stroke-width='1.1' fill='none'%3E%3Cpath d='M460 126H424V28H44'/%3E%3Cpath d='M300 28V42H286'/%3E%3C/g%3E%3Cg fill='%23b48a52'%3E%3Ccircle cx='424' cy='126' r='2.1'/%3E%3Ccircle cx='424' cy='28' r='2.1'/%3E%3Ccircle cx='44' cy='28' r='2.1'/%3E%3Ccircle cx='160' cy='28' r='1.8'/%3E%3Ccircle cx='286' cy='42' r='1.7'/%3E%3C/g%3E%3C/svg%3E");
  }
  .wing.v4 {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='460' height='140'%3E%3Cg stroke='%23b48a52' stroke-width='1.1' fill='none'%3E%3Cpath d='M460 126H398V58H150V22H58'/%3E%3Cpath d='M250 58V44H236'/%3E%3C/g%3E%3Cg fill='%23b48a52'%3E%3Ccircle cx='398' cy='126' r='2.1'/%3E%3Ccircle cx='398' cy='58' r='2.1'/%3E%3Ccircle cx='150' cy='58' r='2.1'/%3E%3Ccircle cx='150' cy='22' r='2.1'/%3E%3Ccircle cx='58' cy='22' r='2.1'/%3E%3Ccircle cx='236' cy='44' r='1.7'/%3E%3Ccircle cx='300' cy='58' r='1.7'/%3E%3C/g%3E%3C/svg%3E");
  }

  /* The current spark: a glowing dot that rides the wing's routed path when
     the surge fires, so the current continues from the column out the wings. */
  .spark {
    position: absolute;
    top: 0;
    left: 0;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    pointer-events: none;
    opacity: 0;
    mix-blend-mode: screen;
    background: radial-gradient(
      closest-side,
      rgba(214, 248, 255, 0.95),
      rgba(120, 205, 235, 0.5) 45%,
      transparent 75%
    );
    offset-rotate: 0deg;
    /* Idle current trickles out the wings on a loop; --idle-d staggers each
       wing so they don't all fire together. Surge overrides this below. */
    animation: spark-idle 4.5s linear infinite;
    animation-delay: var(--idle-d, 0s);
  }
  @keyframes spark-idle {
    0% {
      offset-distance: 0%;
      opacity: 0;
    }
    3% {
      opacity: 0.85;
    }
    16% {
      offset-distance: 100%;
      opacity: 0.85;
    }
    20%,
    100% {
      offset-distance: 100%;
      opacity: 0;
    }
  }
  .wing.v1 .spark {
    offset-path: path("M460 14H418V104H28");
  }
  .wing.v2 .spark {
    offset-path: path("M460 14H402V78H150V112H64");
  }
  .wing.v3 .spark {
    offset-path: path("M460 126H424V28H44");
  }
  .wing.v4 .spark {
    offset-path: path("M460 126H398V58H150V22H58");
  }
  .page.surging .wing {
    animation: trace-flare 1s ease-out;
  }
  .page.surging .spark {
    animation: spark-run 0.7s ease-in;
  }
  .page.surging .wing-l .spark {
    animation-delay: 0.12s;
  }
  .page.surging .wing-r .spark {
    animation-delay: 0.5s;
  }
  @keyframes spark-run {
    0% {
      offset-distance: 0%;
      opacity: 0;
    }
    12% {
      opacity: 1;
    }
    82% {
      opacity: 1;
    }
    100% {
      offset-distance: 100%;
      opacity: 0;
    }
  }
  /* A pulse of electric current runs along each copper trace. `screen` blend
     makes it read as added light over the trace; staggered delays make it
     look like current coursing through the board rather than a metronome. */
  .block::after {
    content: "";
    position: absolute;
    top: -2px;
    left: 0;
    right: 0;
    height: 4px;
    pointer-events: none;
    background-image: radial-gradient(
      closest-side,
      rgba(196, 242, 255, 0.95),
      rgba(120, 205, 235, 0.4) 42%,
      transparent 76%
    );
    background-repeat: no-repeat;
    background-size: 90px 100%;
    background-position: -90px 0;
    mix-blend-mode: screen;
    animation: current 4.5s linear infinite;
  }
  .block:nth-of-type(2)::after {
    animation-delay: -0.4s;
  }
  .block:nth-of-type(3)::after {
    animation-delay: -2.4s;
  }
  .block:nth-of-type(4)::after {
    animation-delay: -1.3s;
  }
  .block:nth-of-type(5)::after {
    animation-delay: -3.1s;
  }
  .block:nth-of-type(6)::after {
    animation-delay: -1.9s;
  }
  @keyframes current {
    0% {
      background-position: -90px 0;
    }
    /* travel across in the first 55%, then rest off-screen so pulses blip
       periodically with a gap between them */
    55%,
    100% {
      background-position: calc(100% + 90px) 0;
    }
  }

  /* ── Power surge: the board jolts to life ────────────────────────────────
     The copper traces flare and a fat, bright pulse rips down every trace in
     a quick cascade from top to bottom. */
  .page.surging .block::before {
    animation: trace-flare 1s ease-out;
  }
  /* Brightness flares the whole trace; the layered cyan drop-shadows bloom
     hardest around the solid via dots, so each solder point pops as it's hit. */
  @keyframes trace-flare {
    0% {
      filter: brightness(1);
    }
    16% {
      filter: brightness(2.9) drop-shadow(0 0 3px rgba(212, 248, 255, 0.95))
        drop-shadow(0 0 10px rgba(150, 232, 255, 0.85));
    }
    100% {
      filter: brightness(1);
    }
  }
  .page.surging .block::after {
    animation: surge 0.85s ease-out;
    background-size: 220px 100%;
  }
  /* fire the traces top-to-bottom for a cascade rather than all at once */
  .page.surging .block:nth-of-type(2)::after {
    animation-delay: 0s;
  }
  .page.surging .block:nth-of-type(3)::after {
    animation-delay: 0.08s;
  }
  .page.surging .block:nth-of-type(4)::after {
    animation-delay: 0.16s;
  }
  .page.surging .block:nth-of-type(5)::after {
    animation-delay: 0.24s;
  }
  .page.surging .block:nth-of-type(6)::after {
    animation-delay: 0.32s;
  }
  @keyframes surge {
    0% {
      background-position: -220px 0;
      filter: brightness(2.1) saturate(1.5);
    }
    100% {
      background-position: calc(100% + 220px) 0;
      filter: brightness(2.1) saturate(1.5);
    }
  }

  /* Hide the margin elbows where there's no margin room for them. */
  @media (max-width: 1080px) {
    .wing {
      display: none;
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

  /* Objects strewn down both margins, free of the text. The layer spans the
     whole page; each prop is placed by vertical % (top) and margin depth
     (--off). The wrapper owns position + the right-side mirror; the inner
     image owns the hover motion, so the two transforms never fight. */
  .scatter {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 0;
  }
  .marker {
    position: absolute;
    display: block;
    width: clamp(120px, 11vw, 168px);
    line-height: 0;
    pointer-events: auto;
  }
  .marker-l {
    right: calc(100% + var(--off, 2rem));
  }
  .marker-r {
    left: calc(100% + var(--off, 2rem));
    transform: scaleX(-1);
  }
  .prop-img {
    width: 100%;
    height: auto;
    transform-origin: 50% 90%;
    /* Dark cast shadow + a faint warm rim so objects lift off the dark wood. */
    filter: drop-shadow(0 10px 18px rgba(0, 0, 0, 0.55))
      drop-shadow(0 0 14px rgba(255, 182, 110, 0.12));
    transition: filter 220ms ease;
  }
  .marker:hover .prop-img {
    filter: drop-shadow(0 12px 22px rgba(0, 0, 0, 0.6))
      drop-shadow(0 0 16px rgba(255, 196, 120, 0.55));
  }
  /* Each prop answers a hover in its own way. */
  .marker:hover .sway {
    animation: sway 1.6s ease-in-out infinite;
  }
  .marker:hover .flicker {
    animation: flicker 0.9s steps(1) infinite;
  }
  .marker:hover .jitter {
    animation: jitter 0.16s steps(2) infinite;
  }
  .marker:hover .flutter {
    animation: flutter 0.5s ease-in-out infinite;
  }
  .marker:hover .blink {
    animation: blink 0.7s steps(1) infinite;
  }
  .marker:hover .steam {
    animation: steam 2.4s ease-in-out infinite;
  }
  @keyframes sway {
    0%,
    100% {
      transform: rotate(-3.5deg);
    }
    50% {
      transform: rotate(3.5deg);
    }
  }
  @keyframes flicker {
    0%,
    100% {
      filter: brightness(1) drop-shadow(0 0 6px rgba(120, 220, 160, 0.5));
    }
    50% {
      filter: brightness(1.35) drop-shadow(0 0 12px rgba(120, 220, 160, 0.8));
    }
  }
  @keyframes jitter {
    0% {
      transform: translate(-1px, 0.5px) rotate(-1deg);
    }
    100% {
      transform: translate(1px, -0.5px) rotate(1deg);
    }
  }
  @keyframes flutter {
    0%,
    100% {
      transform: translateY(0) rotate(-6deg);
    }
    50% {
      transform: translateY(-6px) rotate(6deg);
    }
  }
  @keyframes blink {
    0%,
    100% {
      filter: brightness(1);
    }
    50% {
      filter: brightness(1.4) drop-shadow(0 0 8px rgba(255, 196, 120, 0.7));
    }
  }
  @keyframes steam {
    0%,
    100% {
      transform: translateY(0) scale(1);
    }
    50% {
      transform: translateY(-2px) scale(1.02);
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
  /* Below ~1080px there isn't room in the margin for props beside the column. */
  @media (max-width: 1080px) {
    .marker {
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
    .marker:hover .prop-img,
    .tagline::after,
    .counter-caret,
    .crt-caret,
    .crt-screen::after,
    .block::after,
    .spark,
    .page.surging .block::before,
    .page.surging .wing,
    .ambient.surging,
    .pendant.surging .pool {
      animation: none;
    }
    .block::after {
      display: none;
    }
  }
</style>
