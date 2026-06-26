<script lang="ts">
  let { data } = $props();
</script>

<svelte:head>
  <title>{data.station.label} — Matt Roche</title>
  <meta name="description" content={data.station.blurb} />
  <meta property="og:title" content={`${data.station.label} — Matt Roche`} />
  <meta property="og:description" content={data.station.blurb} />
</svelte:head>

<main>
  <a href="/" class="back">← workshop</a>
  <h1>{data.station.label}</h1>
  <p class="subtitle">{data.station.subtitle}</p>
  <p>{data.station.blurb}</p>
</main>

<style>
  main {
    max-width: 36rem;
    margin: 0 auto;
    padding: 4rem 1.5rem;
  }

  .back {
    display: inline-block;
    color: var(--ink-dim);
    margin-bottom: 2rem;
    font-size: 0.9rem;
  }

  h1 {
    margin: 0;
    font-size: 2rem;
  }

  .subtitle {
    color: var(--ink-dim);
    margin: 0.25rem 0 2rem;
  }
</style>
