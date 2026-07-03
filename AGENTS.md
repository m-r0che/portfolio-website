# AGENTS.md

Personal portfolio as a low-poly, painterly 3D workshop scene. Full spec: [`webgl-workshop-portfolio.md`](./webgl-workshop-portfolio.md).

## Vibe

Warm workshop/studio with lots of tinkering — sketch/illustration feel, old-tech rather than new and flashy. Playful; Easter-egg interactivity in progress. Quiet craftsman with sharp edges: durable, tasteful, opinionated. Not a marketer or agency.

## Stack

SvelteKit 5 (`adapter-static`) + TypeScript + vanilla Three.js + `MeshToonMaterial` + pmndrs/postprocessing + GSAP. Bun for install only. Cloudflare Pages.

## Constraints

- SSG all marketing copy; canvas is enhancement, not the only surface.
- Voice: short sentences, understate claims, no hustle/SaaS language, no emojis.
- Three.js state lives in plain classes — never in Svelte `$state`.
- Default interaction model: fixed-camera waypoints between stations (archetype D).
- Mobile: same scene, simpler post/DPR; persistent "Text version" link.

## When in doubt

Favour texture + toon ramp over flashy shaders. Favour calm over clever. Check the reference doc before adding scope.
