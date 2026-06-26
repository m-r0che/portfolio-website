# WebGL workshop portfolio — reference

Research and decisions for repurposing [[hyperproduct.club]] into a personal portfolio as a low-poly, painterly, calm 3D workshop scene where a craftsperson moves between project stations (SuperStack, SalesAPE, Move Tech, HPC, Writing, Recommendations, CV, Get in touch).

Anchor references the user actually loves:
- [Summer Afternoon — Vicente Lucendo](https://summer-afternoon.vlucendo.com/)
- [Messenger — abeto](https://messenger.abeto.co/)

Both confirmed via bundle sniff to use **Svelte + Vite + vanilla Three.js + `MeshToonMaterial` + `EffectComposer` (pmndrs/postprocessing) + Tweakpane**, no React, no SSR.

---

## 1. Concept (locked)

A small warm workshop. Late-afternoon side light through one window. Wooden floor, beams, a few stations. A craftsperson character in an apron. Each project = a workpiece on a bench. Approach a station → camera moves to a curated framing → content panel slides up. Walk away → ambient room.

The character can be **either**:
- (B) wandering scripted on rails (cheap, expressive)
- (D) implied; camera jumps between fixed waypoints; character animation plays at the active station only (cheaper still, gives you Wes-Anderson framing per project)

**Default to D, allow B as a stretch.** D is the fixed-camera-waypoint pattern from Jordan Breton and the hybrid in Henry Heffernan — gets you Wes-Anderson framing per project without writing a robust character controller. B is Joseph Santamaria's model and remains tempting if there's time.

Out of scope for v1: the "radio as agent" idea.

---

## 2. Brand & voice (locked)

Carried over from the 2026-01-23 brief: Lindy / craft / thoughtful design ethos (Simon Sarris, Tobi Lütke, Taleb). Quiet, opinionated, timeless. The 3D workshop *is* the brand expression — but the words still have to do work on first paint, in `<noscript>`, and in the static view (§8, §9).

### Positioning thesis

> I build practical AI systems with taste — designed to hold up under real-world conditions.

Subtext: *Craft. Leverage. Clear thinking. Select work only.*

Signals durability over novelty, judgement over hustle, selection over scale.

### Hero (SSG into the DOM, not just the canvas)

> **Matt Roche**
> Crafted AI systems. Built to last.
>
> I work on AI agents full-time. Outside of that, I take on a small number of engagements where judgement, speed, and design matter.

CTAs: plain text links — *Email* and *Book a call*. No buttons.

### Voice rules

Do:
- Short sentences. Spacing as design.
- Slightly contrarian (Taleb-lite) when it earns it.
- Understate claims; let the work carry the weight.
- "Competent artisan who can also reason clearly."

Don't:
- Hustle language ("10x", "growth-hack", "unlock").
- "Innovation / disruption / services / clients / book now".
- Emojis on the page.
- Feature lists, icon grids, SaaS-card UI.

Lexicon: use *work, engagement, notes, principles, bets*. Avoid *services, clients, solutions, offerings*.

### Principles (Taleb/Sarris flavour — real content, not filler)

- Build things that still make sense in 10 years
- Prefer simple systems with clear failure modes
- Optimise for robustness, not cleverness
- Craft over scale (until scale is earned)
- Avoid fragile dependencies

Render carved/pinned in the workshop *and* as plain DOM in the static view.

### Mapping brief sections → workshop stations

The Jan brief's page structure and the §1 station catalogue describe the same content in two registers. The 3D scene presents it as props; the static view (§8, §9) presents it as quiet DOM.

| Brief section | Workshop expression |
|---|---|
| Work — AI agent architecture / lead+ops automation / fixed-scope audits | Three workpieces on the central bench |
| Engagements — *Audit + Blueprint (2 weeks). Projects start at £15k. I take a few per year.* | Pinned notice by the door |
| Principles | Carved into a beam, or chalked on a slate above the bench |
| Current bets — SalesAPE / SuperStack / Move Tech / HPC / experiments | The project stations from §1 |
| Notes (if you write) | Open book on the desk; flips on hover |
| Contact | Letter on the desk + the door |

### The feel target

A quiet craftsman with sharp edges. Values durability, taste, reasoning, independence. **Not a marketer. Not an agency.**

If Simon Sarris had a page about AI systems, it'd look like this.

---

## 3. Reference projects

Eleven sites worth studying, clustered into four archetypes. Bundle-sniffed where possible.

### The closest spiritual neighbours

- **[Summer Afternoon](https://summer-afternoon.vlucendo.com/)** — Svelte + Three.js, instanced grass, looped deer, slow drifting camera, single 4-step toon ramp. The vibe target. ~6 KB shell, rest lazy-loaded.
- **[Messenger — abeto](https://messenger.abeto.co/)** — Svelte + Three.js, character delivers parcels across a planet. Code-split `runtime` (14 KB) + `App3D` (1.9 MB). `MeshToonMaterial`, KTX2, DRACO, EffectComposer all in the bundle.
- **[Henry Heffernan](https://henryheffernan.com/)** — vanilla Three.js, first-person CRT office. Diegetic UI (projects load *inside* the monitor). Ships a flat 2D site as the mobile fallback — a model to copy, not regret.
- **[Joseph Santamaria](https://joseph-san.com/)** — vanilla Three + GSAP/ScrollTrigger/Observer/SplitText. **Closest match for the craftsperson-between-stations pattern.** Four crossfaded clips (idle / walk-fwd / walk-back / fall) carry an entire diorama. Toon, GLTF, KTX2, DRACO. Main bundle ~296 KB.
- **[Thibault Introvigne](https://www.thibault-introvigne.com/)** — vanilla Three + GSAP + Rapier physics + KTX2/Draco, Vite. Controllable spaceman picking up 10 collectibles → each opens a project. FWA SOTD Oct 2025. Main `index-*.js` ~148 KB.
- **[Susurrus — Xianyao Wei](https://susurrus.vercel.app/)** ([Codrops case study](https://tympanus.net/codrops/2026/04/24/susurrus-crafting-a-cozy-watercolor-world-with-three-js-and-shaders/)) — **R3F + drei + Rapier + Howler**. **A single well-tuned Kuwahara post-pass does 100% of the painterly identity.** Useful proof you don't need a custom shader on every material.
- **[Jordan Breton](https://jordan-breton.com/)** — vanilla Three, sky island, navigates between **fixed camera points** rather than free-roam. **Structurally the best fit for our stations brief** — curated framing per project, no controller code.
- **[itomdev — Tomasz Szmajda](https://itomdev.com/)** ([Codrops case study](https://tympanus.net/codrops/2026/06/11/sketching-the-impossible-a-3d-portfolio-built-without-a-single-3d-model/)) — R3F 9 + Three 0.182 + GSAP. Sketchbook style built **without 3D models** — only textured planes/cubes, baked shadows in textures. Device-tier gating skips shader warmup on low-end. Smoothest mobile of the set.
- **[Aimee Wei — Papercraft World](https://aimees-papercraft-world.com/)** — Blender geometry + Krita-painted textures. Cheapest path to "painterly" — paint over textures, skip the shader.
- **[WoraWork](https://worawork.vercel.app/)** — Zelda LBW / Animal Crossing cozy house+garden, controllable character. Tile-grid composition where every prop is also a clickable project marker.
- **[Corentin Bernadou](https://corentinbernadou.com/)** ([Codrops case study](https://tympanus.net/codrops/2026/03/05/inside-corentin-bernadous-portfolio-swiss-inspired-layouts-webgl-geometry-and-thoughtful-motion/)) — vanilla JS + Three + GSAP + Lenis + PJAX. Calm 3D ambient layer *behind* a typographic 2D shell. A structural counter-example: maybe the 3D doesn't need to *be* the navigation.

### Archetypes

| Archetype | Example | Asset budget | Mobile fallback | Fit |
|---|---|---|---|---|
| **A — Diorama vignette** (no character) | Summer Afternoon, Susurrus, Aimee Wei | 3–10 MB, 5–325 KB shell | Lower DPR, skip postfx | Safest, but loses "the craftsperson" |
| **B — Wandering scripted character** (on rails) | Joseph Santamaria, Aimee Wei | 5–15 MB, 1 rigged GLB + 3–5 looped clips | Same camera, fewer particles | Best stretch goal |
| **C — Controllable character** (free roam) | Thibault, WoraWork, Heffernan | 10–30 MB, +100–200 KB physics | Degraded movement or 2D fork | Highest build cost; worst a11y |
| **D — Fixed-camera waypoints** | Jordan Breton, Heffernan hybrid | 5–12 MB | Stays great — no joystick to lose | **Default for v1** |

### The lesson Susurrus teaches

Don't write a custom shader for every material. Pick **one strong NPR post-pass** (Kuwahara, or a softer hand-painted-grain blend) and let it do the identity work for free. Saves weeks.

---

## 4. The stack (locked)

### Final list

| Layer | Pick | Notes |
|---|---|---|
| Build | **Vite** | Settled. Both references use it. Pin version through the build; Vite 8 (Rolldown) is shipping through 2026 — watch but don't adopt mid-project. |
| Language | **TypeScript** | Three.js types are excellent. |
| Package manager | **Bun (install only)** | `bun install` + `bun run dev` proxies to Node. Bun-as-runtime for Vite freezes on dependency changes ([known issue](https://github.com/vitejs/vite/discussions/17851)). |
| Framework | **SvelteKit + Svelte 5 (runes), `adapter-static`** | Static export, no SSR runtime. |
| 3D | **Vanilla Three.js r170+** | Not R3F, not Threlte. Both references prove the vanilla path. Threlte's Svelte 5 migration is still catching up — explicit no. |
| Postprocessing | **pmndrs/postprocessing** | Merges effect passes into one fragment shader; `EffectComposer` cannot. |
| Shaders | **`MeshToonMaterial` + `onBeforeCompile` extensions; LYGIA at build time** | Don't load `lygia.xyz/resolve.js` at runtime in prod. |
| Camera moves | **GSAP** | Camera tweens, station transitions, content panel reveal. Industry default for arbitrary numeric tweens on `THREE.Object3D`. |
| Character | **Three's `AnimationMixer`** | `crossFadeFrom(other, 0.25, true)` between idle/walk. Don't `stopAllAction()`. |
| Collision / controller | **`three-mesh-bvh`** + ~30-line kinematic controller | What Summer Afternoon and Messenger actually use (confirmed [forum thread](https://discourse.threejs.org/t/summer-afternoon/46963)). One downward ray for ground, a few horizontal rays for walls. No physics engine. |
| Spatial audio | **`THREE.PositionalAudio` (wraps PannerNode)** | One fewer dep than Tone.js for ≤8 spatial sources. Reach for Tone only if you need a transport or synthesis. |
| Asset compression | **`@gltf-transform/cli`** primary, **gltfpack** as fallback | gltf-transform = scriptable, fine control. gltfpack = one-shot, opinionated, emergency cuts. |
| Geometry compression | **meshopt**, not Draco | Faster decode, better gzip, better fit for small scenes. Reverse only if shaving the last 100 KB. |
| Textures | **KTX2** — ETC1S for albedo, UASTC for normals | ETC1S on a normal map produces visible banding. |
| Dev tuning | **Tweakpane v4**, **Stats.js**, **Spector.js** | Tweakpane dynamic-import behind `import.meta.env.DEV`. |
| Hosting | **Cloudflare Pages** (static) + assets in the build | Use **R2** only for >25 MB hero files (Pages per-file cap). |
| Modelling | **Blender 4.x** | Hand-painted textures in Blender Texture Paint or Substance Painter. |

### Explicit *no*

- **Next.js** — SSR adds nothing, opinions cost.
- **React Three Fiber / Threlte** — reconciler tax between you and the render loop; every WebGL portfolio you respect is vanilla for this reason.
- **Tone.js** — overkill for positional audio.
- **Rapier / cannon-es / Yuka navmesh** — one room doesn't need physics. `three-mesh-bvh` raycasts are enough.
- **Theatre.js** — feature-frozen, optional. Only if you commit to cinematic sequences for the auto-tour.
- **Babylon, Unity WebGL, Godot HTML5, PlayCanvas** — wrong shape, huge bundles.
- **WebGPU + TSL** — Safari 26 shipped late 2025; ecosystem maturity not quite there for postprocessing. Migration is mechanical and small. Defer until r190+ and after v1 ships.

### Mounting Three.js inside Svelte 5 — the boring pattern

```ts
let canvas: HTMLCanvasElement;
let scene: WorkshopScene;

onMount(() => {
  scene = new WorkshopScene(canvas);
  return () => scene.dispose();
});

$effect(() => {
  scene?.setStation(activeStation);  // rune → scene bridge, that's it
});
```

**Never put Three.js objects in `$state`** — proxying an `Object3D` is a disaster. Keep the scene graph in a plain class.

---

## 5. The painterly look — actual recipe

Three things compounded, not one shader:

1. **Hand-painted albedo textures.** This is 60% of the look. Most of Summer Afternoon's "painted" feel is texture work — broad strokes baked from Blender Texture Paint / Procreate / Substance into UV-unwrapped low-poly. No shader saves weak textures.
2. **`MeshToonMaterial` with a 3–4-step `gradientMap`.** Tiny 4×1 PNG, `texture.minFilter = magFilter = NearestFilter`. Author the gradient so shadows lean warm, lights lean cool.
3. **`onBeforeCompile` injection** on hero materials for:
   - Fresnel rim: `1.0 - dot(N, V)` smoothstepped, multiplied by `NdotL` so it only shows on lit faces
   - Screen-space paper-texture overlay
   - Slight color-grade lift

Inject into Three's chunk system; don't replace the material — you keep shadows/fog/tonemapping for free.

**Matcaps** are fine for decorative props (shelf books, mugs) — bake material × lighting into one sphere texture, almost zero cost. Don't matcap heroes; you lose the toon ramp.

**Kuwahara post-pass** (the full "oil painting" look — visible brush strokes moving with the camera): Susurrus uses this. [Maxime Heckel's writeup](https://blog.maximeheckel.com/posts/on-crafting-painterly-shaders/) is canonical. **Heavy** — desktop-only deluxe mode if at all. Summer Afternoon does *not* use it; its painterly feel is purely texture + toon ramp + soft post. Defer.

### Postprocessing recipe (pmndrs/postprocessing, single `EffectPass`)

```
RenderPass(scene, camera)
  → EffectPass(camera,
      SelectiveBloomEffect({ intensity: 0.4, luminanceThreshold: 0.85 }),
      VignetteEffect({ darkness: 0.35, offset: 0.4 }),
      NoiseEffect({ premultiply: true, blendFunction: SOFT_LIGHT, opacity: 0.06 }),
      ToneMappingEffect({ mode: ACES_FILMIC }),
      SMAAEffect()         // last
    )
```

Color effects before tonemap; SMAA at the very end. Soft bloom — luminance threshold ~0.85, low intensity — for "warm afternoon" without anime sparkle. Fog goes *inside* the scene (Three's `Fog`), not as a post-effect, so it interacts with the toon ramp correctly.

**SMAA > FXAA > TAA** in this context. FXAA smudges toon outlines (worst case for painterly). TAA ghosts on the moving character.

**Mobile cut**: drop bloom + SMAA, ship FXAA + vignette only.

---

## 6. Asset pipeline

```
Blender 4.x
  → glTF Separate export (textures editable, modifiers applied, transforms applied)
  → gltf-transform optimize input.glb output.glb --texture-compress webp   # sanity baseline
  → gltf-transform meshopt
  → gltf-transform ktx2 (ETC1S albedo, UASTC normals)
  → gltf-transform dedup
  → gltf-transform prune
  → gltf-transform weld
  → verify in gltf.report (draw calls, vertex count, texture memory)
```

Keep `.blend` + uncompressed source out of the bundle. KTX2 is lossy and one-way.

### Realistic budget

| Metric | Mobile | Desktop |
|---|---|---|
| Initial JS (gz) | < 250 KB | < 400 KB |
| Total transfer to first interactive | < 4 MB | < 8 MB |
| Total tri count (visible) | 80–120k | 200–400k |
| Texture memory (VRAM) | < 60 MB | < 200 MB |
| Draw calls | < 60 | < 100 |
| Hero character | < 5k tris | < 15k tris |
| Background props | 100–800 tris each | up to 2k each |

### Critical gotchas

- **One material per object isn't free.** Each unique material = draw call. Atlas where possible.
- **KTX2Loader race**: `detectSupport(renderer)` *before* loading any GLTF with KTX2 textures, or cryptic errors. Bites everyone once.
- **Per-frame allocation in the render loop** = GC pauses. Reuse vectors/quats; pre-allocate buffers.
- **Transparent objects** lose early-Z; double cost. Use alpha-test or order-independent transparency only for things that need it.
- **Render target reads on mobile** choke some Mali GPUs. Profile early.

---

## 7. Performance budget reality check

- **M1 MacBook Air**: 60 fps locked with everything on. Shadow ceiling = one cascaded directional, 2048².
- **Mid-range Android** (Pixel 6a / mid-Snapdragon 7-gen): 30–60 fps if you (a) disable bloom + SMAA, (b) drop shadow map to 1024², (c) cap DPR to `Math.min(devicePixelRatio, 1.5)`, (d) KTX2 everywhere, (e) keep tri count near the mobile budget.

### First-paint strategy

1. SvelteKit SSG the route HTML — hero text in the DOM regardless of canvas state.
2. Static low-res WebP splash renders immediately.
3. `requestIdleCallback` → dynamic-import the Three.js chunk.
4. Preload KTX2 transcoder + critical-room GLB in parallel.
5. Crossfade splash → canvas when `KTX2Loader.detectSupport()` + GLB are ready.
6. Lazy-load station-specific assets on approach.

---

## 8. Mobile strategy

**Same scene, simpler.** Don't ship a separate page — half the value of a 3D portfolio is a recruiter trying it on the train. The high-craft pattern (Messenger, Bruno Simon) is: same scene, lower DPR, smaller textures, simplified post stack, optionally disable the walk-camera in favor of an auto-tour.

A **"view static" toggle in the header** is the real accessibility answer, not a separate code path. Static view = the same SvelteKit project routes, no canvas.

---

## 9. Accessibility & SEO floor

Non-negotiable:

- **SSG all marketing copy** — H1, project titles, descriptions, links, CTA. Lives in the DOM regardless of canvas state.
- **Per-project SvelteKit routes** (`/projects/[slug]`) with proper `<title>`, OG tags, text-first body. The 3D camera animates to that station on client; SSG renders the project copy.
- **Persistent "Text version" link** in the header → no-canvas list view.
- **`<noscript>`** inside the canvas wrapper with hero copy duplicated.
- **`prefers-reduced-motion: reduce`** → static splash + station nav via DOM buttons; no camera moves.
- **Canvas** needs `role="img" aria-label="..."` + `tabindex="-1"`.
- **Keyboard nav** for station jumping (number keys / tab cycle through DOM nav).

---

## 10. Hosting

**Cloudflare Pages** for the static SvelteKit build. Ship the GLB + KTX2 inside the Pages build — simpler, free edge cache, no CORS. **R2** only if a hero asset exceeds 25 MB (Pages per-file cap) or you want to swap assets without redeploy.

If R2 becomes necessary:
- Custom subdomain on the bucket (`assets.matt.is`) — Cloudflare cache + zero egress.
- CORS: allow your Pages origin, expose `Range`, `Content-Length`, `Content-Type`.
- `Cache-Control: public, max-age=31536000, immutable` on hashed asset names.
- Don't read R2 through SvelteKit endpoints — `adapter-static` means no server. Serve directly from the public R2 domain.

---

## 11. Risk register (a strong-React-weak-3D engineer, 3–4 weeks)

In rough order of likelihood × impact:

1. **The art is the project, not the code.** ~60% of time will be in Blender / texture paint, not JS. If textures are weak, the result is "Three.js demo," not "Summer Afternoon." **Single biggest risk.**
2. **The character controller is harder than it looks.** Foot-IK, foot-slide, corner-stuck, collision tunnelling. Budget a week for polish *or* commit to archetype D (fixed-camera waypoints) and skip the controller entirely.
3. **Svelte 5 muscle memory.** `$state` proxies, `$derived` semantics, `$effect` cleanup. Mitigation: all Three.js state in plain classes; runes only touch one boolean (`activeStation`).
4. **`onBeforeCompile` chunk-injection brittleness.** Breaks across r-versions. Pin Three.js to one release for the build.
5. **`KTX2Loader.detectSupport()` race** with GLTF loading. See §6.
6. **Shader debugging on mobile.** Add an in-canvas debug HUD; Spector.js doesn't help on phones.
7. **Theatre.js studio in prod bundle** if not gated behind `import.meta.env.DEV`.
8. **Audio autoplay policy.** Resume audio context on first user gesture (keypress / click), never on load.
9. **Cloudflare Pages preview OOM** during SvelteKit prerender if image processing runs in `+page.server.ts`. Keep image work out of SSR.
10. **Scope creep** — every demo on Codrops will look like it should be in your site too. Lock the station list early.

---

## 12. Realistic week-by-week plan

| Week | Goal |
|---|---|
| **0 — Spike (1 day)** | Vite + SvelteKit scaffold; one Blender corner with one workbench + window; `MeshToonMaterial` + baked AO + EffectComposer with bloom+vignette. Decide: green-light or fall back to flat paper. |
| **1 — Blockout** | Full room geometry (no textures yet), camera waypoints for each station, GSAP transitions between them, project-data wired in. Choose archetype D (waypoints) or B (wandering). |
| **2 — Look** | Texture paint pass on all hero meshes. Toon ramp tuning. Custom `onBeforeCompile` extensions. Postprocessing pass finalised. |
| **3 — Content & interaction** | Station content panels, project routes (`/projects/[slug]`), text-version fallback, station audio, hover/click states, idle behaviour. |
| **4 — Polish & ship** | a11y, SEO meta per route, mobile DPR/post cuts, perf pass against the budget table (§7), Cloudflare Pages deploy, custom-domain DNS, OG image gen. |

**Cut order if slipping**: positional audio → custom shader extensions (keep `MeshToonMaterial` baseline) → idle behaviour → character animation (fall back to archetype D if not already there).

---

## 13. Open questions to resolve before week 1 (decision => current hyperproduct.club can go)

- **Domain.** Does `hyperproduct.club` stay (Matt at the apex; HPC as a sub-page) or move (new domain, HPC stays as-is)? See [[memory/user_role]] / open consulting context.
- **Tom & Nick's call.** If the consulting trio brand has weight worth keeping, the new personal site has to coexist with it without confusing visitors. (decision => remove)
- **Archetype B or D?** D is the conservative ship; B is the stretch. Decide at end of week 1 based on what the blockout *feels* like.
- **Static-view treatment.** What does the "View static" version look like? Quiet archive (Aino-style) or simple stacked cards?
- **Hero copy.** Headline resolved in §2 to *"Crafted AI systems. Built to last."* The Ben Lister "rare blend of skills" quote (previous placeholder) hasn't been placed — demote to a pull-quote on the Engagements station, drop, or use as the static-view header? Decide before week 3.

---

## Sources

### Live references
- [Summer Afternoon](https://summer-afternoon.vlucendo.com/) · [forum case study](https://discourse.threejs.org/t/summer-afternoon/46963)
- [Messenger](https://messenger.abeto.co/) · [forum analysis](https://discourse.threejs.org/t/ultra-cool-cartoonish-vibes-a-closer-look-into-abeto-co-website/87264)
- [Henry Heffernan](https://henryheffernan.com/)
- [Joseph Santamaria](https://joseph-san.com/)
- [Thibault Introvigne](https://www.thibault-introvigne.com/) · [Awwwards](https://www.awwwards.com/sites/thibault-introvigne-portfolio)
- [Susurrus](https://susurrus.vercel.app/) · [Codrops](https://tympanus.net/codrops/2026/04/24/susurrus-crafting-a-cozy-watercolor-world-with-three-js-and-shaders/)
- [Jordan Breton](https://jordan-breton.com/)
- [itomdev](https://itomdev.com/) · [Codrops](https://tympanus.net/codrops/2026/06/11/sketching-the-impossible-a-3d-portfolio-built-without-a-single-3d-model/)
- [Aimee Wei — Papercraft World](https://aimees-papercraft-world.com/)
- [WoraWork](https://worawork.vercel.app/)
- [Corentin Bernadou](https://corentinbernadou.com/) · [Codrops](https://tympanus.net/codrops/2026/03/05/inside-corentin-bernadous-portfolio-swiss-inspired-layouts-webgl-geometry-and-thoughtful-motion/)

### Tech docs & guides
- [Three.js r170 release](https://github.com/mrdoob/three.js/releases/tag/r170) · [migration guide](https://github.com/mrdoob/three.js/wiki/Migration-Guide) · [What's New in Three.js 2026](https://www.utsubo.com/blog/threejs-2026-what-changed)
- [MeshToonMaterial](https://threejs.org/docs/pages/MeshToonMaterial.html) · [Maya N. tutorial](https://www.maya-ndljk.com/blog/threejs-basic-toon-shader)
- [Maxime Heckel — Painterly Shaders](https://blog.maximeheckel.com/posts/on-crafting-painterly-shaders/) · [oil-on-threejs template](https://github.com/Sekuta82/oil-on-threejs-template)
- [Rim Lighting](https://lettier.github.io/3d-game-shaders-for-beginners/rim-lighting.html)
- [MatCap primer](https://discourse.threejs.org/t/learn-about-matcap-materials/32485)
- [pmndrs/postprocessing](https://github.com/pmndrs/postprocessing) · [Complete Guide 2026](https://threejsroadmap.com/blog/the-complete-guide-to-threejs-post-processing-in-2026)
- [gltf-transform.dev](https://gltf-transform.dev/) · [gltfpack](https://meshoptimizer.org/gltf/) · [gltf.report](https://gltf.report/) · [3D model optimisation](https://www.axl-devhub.me/en/blog/optimizing-3d-models)
- [KTX2Loader](https://threejs.org/docs/pages/KTX2Loader.html) · [Polygon count guide](https://blog.neural4d.com/user-guide/polygon-count-for-3d-game-assets-printing-and-webar/) · [100 Three.js Tips](https://www.utsubo.com/blog/threejs-best-practices-100-tips)
- [Three.js animation system](https://discoverthreejs.com/book/first-steps/animation-system/) · [GSAP camera transitions](https://waelyasmina.net/articles/animating-camera-transitions-in-three-js-using-gsap/)
- [three-mesh-bvh](https://github.com/gkjohnson/three-mesh-bvh) · [BVHEcctrl character controller](https://github.com/pmndrs/BVHEcctrl)
- [Three.js PositionalAudio](https://threejs.org/docs/pages/PositionalAudio.html) · [MDN Web Audio spatialization](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Web_audio_spatialization_basics)
- [LYGIA Shader Library](https://lygia.xyz/) · [Tweakpane v4](https://tweakpane.github.io/docs/)
- [Svelte 5 lifecycle](https://svelte.dev/docs/svelte/lifecycle-hooks) · [SvelteKit + Three.js guide](https://threejsresources.com/frameworks/three-js-svelte) · [SvelteKit a11y](https://svelte.dev/docs/kit/accessibility)
- [Bun + SvelteKit](https://bun.com/docs/guides/ecosystem/sveltekit) · [Vite/Bun freeze report](https://github.com/vitejs/vite/discussions/17851)
- [SvelteKit on Cloudflare Pages](https://developers.cloudflare.com/pages/framework-guides/deploy-a-svelte-kit-site/) · [R2 + Pages](https://developers.cloudflare.com/pages/tutorials/use-r2-as-static-asset-storage-for-pages/) · [R2 CORS](https://developers.cloudflare.com/r2/buckets/cors/) · [R2 cache interaction](https://developers.cloudflare.com/cache/interaction-cloudflare-products/r2/)
- [WebGPU + Three.js migration 2026](https://www.utsubo.com/blog/webgpu-threejs-migration-guide) · [Field Guide to TSL](https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/)
- [WebGL/Three.js SEO guide 2026](https://www.utsubo.com/blog/webgl-three-js-site-seo-rankable-guide)
