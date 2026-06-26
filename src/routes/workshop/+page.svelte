<script lang="ts">
  import { onMount } from 'svelte';
  import { stations, type StationId, stationById } from '$lib/data/projects';

  type WorkshopSceneT = import('$lib/workshop/WorkshopScene').WorkshopScene;

  let canvas = $state<HTMLCanvasElement | undefined>(undefined);
  // Kept off `$state` on purpose — proxying Three.js objects breaks them (see spec §3).
  let scene: WorkshopSceneT | undefined;
  let sceneReady = $state(false);
  let activeStation = $state<StationId | null>(null);
  let textMode = $state(false);

  // Rune → scene bridge. Re-runs when sceneReady flips or activeStation changes.
  $effect(() => {
    void sceneReady;
    scene?.setStation(activeStation);
  });

  onMount(() => {
    let cancelled = false;
    (async () => {
      const { WorkshopScene } = await import('$lib/workshop/WorkshopScene');
      if (cancelled || !canvas) return;
      scene = new WorkshopScene(canvas);
      sceneReady = true;
    })();
    return () => {
      cancelled = true;
      sceneReady = false;
      scene?.dispose();
      scene = undefined;
    };
  });

  const current = $derived(activeStation ? stationById(activeStation) : null);
</script>

<svelte:head>
  <title>Matt Roche — workshop</title>
  <meta
    name="description"
    content="Matt Roche — product, AI ops, conveyancing infra. SuperStack, SalesAPE, Move Tech, Hyper Product Club."
  />
</svelte:head>

<div class="theme-dark" style="display: contents">
<header class="topbar">
  <a href="/" class="brand" onclick={(e) => { e.preventDefault(); activeStation = null; }}>
    matt roche
  </a>
  <nav class="stations" aria-label="Project stations">
    {#each stations as s}
      <button
        class:active={activeStation === s.id}
        onclick={() => (activeStation = activeStation === s.id ? null : s.id)}
        aria-pressed={activeStation === s.id}
      >
        {s.label}
      </button>
    {/each}
  </nav>
  <button class="static-toggle" onclick={() => (textMode = !textMode)} aria-pressed={textMode}>
    {textMode ? '3D view' : 'Text version'}
  </button>
</header>

{#if !textMode}
  <!-- svelte-ignore a11y_no_interactive_element_to_noninteractive_role -->
  <canvas
    bind:this={canvas}
    role="img"
    aria-label="A small warm workshop with eight project stations"
    tabindex="-1"
  ></canvas>

  <noscript>
    <div class="static-fallback">
      <h1>Matt Roche</h1>
      <p>A rare blend of skills.</p>
      {#each stations as s}
        <section>
          <h2>{s.label}</h2>
          <p>{s.blurb}</p>
        </section>
      {/each}
    </div>
  </noscript>

  {#if current}
    <aside class="panel" aria-live="polite">
      <header>
        <h2>{current.label}</h2>
        <p class="subtitle">{current.subtitle}</p>
      </header>
      <p>{current.blurb}</p>
      <a href={`/projects/${current.id}`} class="more">Read more →</a>
    </aside>
  {:else}
    <section class="hero" aria-hidden="false">
      <h1>A rare blend of skills.</h1>
      <p>— Ben Lister</p>
      <p class="hint">Pick a station above, or roam the room.</p>
    </section>
  {/if}
{:else}
  <main class="static-mode">
    <h1>Matt Roche</h1>
    <p class="lede">A rare blend of skills. — Ben Lister</p>
    {#each stations as s}
      <section>
        <h2>
          <a href={`/projects/${s.id}`}>{s.label}</a>
        </h2>
        <p class="subtitle">{s.subtitle}</p>
        <p>{s.blurb}</p>
      </section>
    {/each}
  </main>
{/if}
</div>

<style>
  canvas {
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100vh;
    display: block;
  }

  .topbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 10;
    display: flex;
    align-items: center;
    gap: 1.5rem;
    padding: 1rem 1.5rem;
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.45), transparent);
  }

  .brand {
    font-weight: 600;
    letter-spacing: 0.02em;
    color: var(--ink);
  }

  .stations {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem 0.75rem;
    flex: 1;
  }

  .stations button {
    color: var(--ink-dim);
    padding: 0.25rem 0.5rem;
    font-size: 0.85rem;
    border-radius: 4px;
    transition: color 200ms ease, background 200ms ease;
  }

  .stations button:hover {
    color: var(--ink);
  }

  .stations button.active {
    color: var(--bg);
    background: var(--accent);
  }

  .static-toggle {
    color: var(--ink-dim);
    font-size: 0.85rem;
    padding: 0.25rem 0.5rem;
    border: 1px solid var(--ink-dim);
    border-radius: 4px;
  }

  .hero {
    position: fixed;
    z-index: 5;
    bottom: 2.5rem;
    left: 2rem;
    max-width: 28ch;
  }

  .hero h1 {
    margin: 0;
    font-size: clamp(1.5rem, 3vw, 2.4rem);
    line-height: 1.1;
    font-weight: 600;
  }

  .hero p {
    margin: 0.5rem 0 0;
    color: var(--ink-dim);
  }

  .hero .hint {
    margin-top: 1.25rem;
    font-size: 0.85rem;
  }

  .panel {
    position: fixed;
    z-index: 5;
    bottom: 2.5rem;
    left: 2rem;
    right: 2rem;
    max-width: 36rem;
    padding: 1.25rem 1.5rem;
    background: var(--panel);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    backdrop-filter: blur(12px);
    animation: slide-up 240ms ease-out;
  }

  @keyframes slide-up {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .panel header {
    margin-bottom: 0.5rem;
  }

  .panel h2 {
    margin: 0;
    font-size: 1.2rem;
  }

  .panel .subtitle {
    margin: 0;
    color: var(--ink-dim);
    font-size: 0.9rem;
  }

  .panel .more {
    display: inline-block;
    margin-top: 0.75rem;
    color: var(--accent);
    font-size: 0.9rem;
  }

  .static-mode {
    max-width: 36rem;
    margin: 0 auto;
    padding: 5rem 1.5rem 4rem;
  }

  .static-mode .lede {
    color: var(--ink-dim);
    margin-bottom: 3rem;
  }

  .static-mode section {
    padding: 1.5rem 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .static-mode h2 {
    margin: 0 0 0.25rem;
  }

  .static-mode .subtitle {
    color: var(--ink-dim);
    font-size: 0.9rem;
    margin: 0 0 0.5rem;
  }

  .static-fallback {
    padding: 2rem;
  }
</style>
