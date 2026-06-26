import {
  AmbientLight,
  AnimationMixer,
  BoxGeometry,
  Clock,
  Color,
  CylinderGeometry,
  DirectionalLight,
  Fog,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshToonMaterial,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  Scene,
  SkinnedMesh,
  SRGBColorSpace,
  SpotLight,
  Vector3,
  WebGLRenderer
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import type { EffectComposer } from 'postprocessing';
import gsap from 'gsap';

import { makePipeline } from './postprocessing';
import { extendWithRim, makeToonGradient } from './toon';
import { OVERVIEW, workpieceSlots, stationWaypoints } from './stations';
import { stations, type StationId } from '$lib/data/projects';

// Workshop nook dimensions. The room is small on purpose — single
// workstation in the corner, bench against the back wall.
const ROOM_W = 5.2;
const ROOM_D = 4.0;
const ROOM_H = 2.8;

// Bench: centred on x = 0, against the back wall at z = -0.9.
const BENCH_W = 2.2;
const BENCH_D = 0.9;
const BENCH_H = 0.85;
const BENCH_Z = -0.9;

// Shelf above the bench.
const SHELF_W = 2.0;
const SHELF_D = 0.3;
const SHELF_T = 0.04;
const SHELF_Y = 1.70;
const SHELF_Z = -1.40;

const PALETTE = {
  floor: new Color('#5a3a1e'),
  wall: new Color('#7a5634'),
  beam: new Color('#3a2412'),
  bench: new Color('#6e4220'),
  shelf: new Color('#5e3818'),
  window: new Color('#1a1226'),    // deep evening night-sky outside
  neon: new Color('#ff3aa8'),      // magenta 修理屋 (repair shop) sign
  neonCyan: new Color('#3ad8ff'),  // small cyan accent in the distance
  lampShade: new Color('#c08545'),
  lampGlow: new Color('#ffd9a0'),
  pendantShade: new Color('#3a2418'),
  pendantGlow: new Color('#ffba70'),
  workpiece: [
    new Color('#c5562d'),
    new Color('#3a7a78'),
    new Color('#d8a93e'),
    new Color('#6f4ca8'),
    new Color('#3f8a52'),
    new Color('#b0445e'),
    new Color('#2e6aa3'),
    new Color('#e08a3a')
  ]
};

const isMobile = () =>
  typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

export class WorkshopScene {
  private readonly canvas: HTMLCanvasElement;
  private readonly renderer: WebGLRenderer;
  private readonly scene: Scene;
  private readonly camera: PerspectiveCamera;
  private readonly composer: EffectComposer;
  private readonly gradient = makeToonGradient(4);
  private readonly lookTarget = new Vector3().copy(OVERVIEW.lookAt);

  private rafId = 0;
  private disposed = false;
  private readonly disposers: Array<() => void> = [];
  private currentStation: StationId | null = null;
  private readonly clock = new Clock();
  private characterMixer: AnimationMixer | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    const mobile = isMobile();

    this.renderer = new WebGLRenderer({
      canvas,
      antialias: false,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.5 : 2));
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.shadowMap.enabled = !mobile;
    this.renderer.shadowMap.type = PCFSoftShadowMap;

    this.scene = new Scene();
    this.scene.background = new Color('#100a1a');
    this.scene.fog = new Fog('#100a1a', 8, 20);

    this.camera = new PerspectiveCamera(44, 1, 0.1, 60);
    this.camera.position.copy(OVERVIEW.position);
    this.camera.lookAt(OVERVIEW.lookAt);

    this.composer = makePipeline(this.renderer, this.scene, this.camera, { mobile });

    this.buildLighting(mobile);
    this.buildRoom();
    this.buildStations();
    this.loadCharacter('/models/craftsman.glb');

    this.handleResize();
    window.addEventListener('resize', this.handleResize);
    this.disposers.push(() => window.removeEventListener('resize', this.handleResize));

    this.loop();
  }

  setStation(id: StationId | null) {
    if (id === this.currentStation) return;
    this.currentStation = id;
    const target = id ? stationWaypoints[id] : OVERVIEW;

    gsap.to(this.camera.position, {
      x: target.position.x,
      y: target.position.y,
      z: target.position.z,
      duration: 1.4,
      ease: 'power3.inOut'
    });
    gsap.to(this.lookTarget, {
      x: target.lookAt.x,
      y: target.lookAt.y,
      z: target.lookAt.z,
      duration: 1.4,
      ease: 'power3.inOut'
    });
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    cancelAnimationFrame(this.rafId);
    gsap.killTweensOf(this.camera.position);
    gsap.killTweensOf(this.lookTarget);
    this.disposers.forEach((d) => d());
    this.scene.traverse((obj) => {
      const mesh = obj as Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const material = mesh.material;
      if (Array.isArray(material)) material.forEach((m) => m.dispose());
      else if (material) material.dispose();
    });
    this.gradient.dispose();
    this.composer.dispose();
    this.renderer.dispose();
  }

  private readonly handleResize = () => {
    const { clientWidth, clientHeight } = this.canvas;
    const w = clientWidth || window.innerWidth;
    const h = clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
    this.composer.setSize(w, h);
  };

  private readonly loop = () => {
    if (this.disposed) return;
    const dt = this.clock.getDelta();
    if (this.characterMixer) this.characterMixer.update(dt);
    this.camera.lookAt(this.lookTarget);
    this.composer.render();
    this.rafId = requestAnimationFrame(this.loop);
  };

  private async loadCharacter(url: string) {
    try {
      const gltf = await this.getLoader().loadAsync(url);
      const root = gltf.scene;
      // Mixamo characters are typically ~100cm tall — Tripo source said
      // ~94cm, so scale to ~1.7m apparent height.
      root.scale.setScalar(1.7);
      // Mixamo's Sitting clip places the pelvis at floor — lift to chair
      // height so he reads as sitting *on* something, and push back so the
      // bench isn't crowded. Replace with a real stool model later.
      root.position.set(0, 0.45, BENCH_Z - 0.4);
      root.rotation.y = 0;

      // Swap PBR materials for our toon material so the craftsman matches the room.
      const craftsmanMat = this.toon(new Color('#d8c4a0'));
      root.traverse((child) => {
        const skin = child as SkinnedMesh;
        if (skin.isSkinnedMesh || (child as Mesh).isMesh) {
          (child as Mesh).material = craftsmanMat;
          (child as Mesh).castShadow = true;
          (child as Mesh).receiveShadow = true;
          // SkinnedMeshes need the original frustum bounds; turn culling off
          // until we recompute, otherwise the character flickers when bones
          // move outside the rest-pose bbox.
          (child as Mesh).frustumCulled = false;
        }
      });

      this.scene.add(root);

      if (gltf.animations.length > 0) {
        this.characterMixer = new AnimationMixer(root);
        const action = this.characterMixer.clipAction(gltf.animations[0]);
        action.play();
        console.info(
          `[WorkshopScene] character animation: ${gltf.animations[0].name} (${gltf.animations.length} clip(s))`
        );
      }
    } catch (err) {
      console.info('[WorkshopScene] character not loaded', (err as Error).message);
    }
  }

  private toon(color: Color): MeshToonMaterial {
    const mat = new MeshToonMaterial({ color, gradientMap: this.gradient });
    return mat;
  }

  private buildLighting(mobile: boolean) {
    // Warm ambient — late golden hour, indoors. Room reads warm overall.
    this.scene.add(new AmbientLight('#7a5234', 0.85));

    // Golden hour sun raking in through the right-side window. Low angle,
    // strong warm hue, primary key light for the whole room.
    const sun = new DirectionalLight('#ffb878', 3.8);
    sun.position.set(3.2, 1.8, 0.6);
    sun.target.position.set(-0.3, BENCH_H, BENCH_Z);
    if (!mobile) {
      sun.castShadow = true;
      sun.shadow.mapSize.set(2048, 2048);
      sun.shadow.camera.near = 0.2;
      sun.shadow.camera.far = 10;
      const s = 3.5;
      sun.shadow.camera.left = -s;
      sun.shadow.camera.right = s;
      sun.shadow.camera.top = s;
      sun.shadow.camera.bottom = -s;
      sun.shadow.bias = -0.0008;
      sun.shadow.normalBias = 0.04;
    }
    this.scene.add(sun);
    this.scene.add(sun.target);

    // Brass anglepoise pool — secondary now that the sun is the key.
    // Adds the practical-light pool around the workpiece he's tinkering with.
    const lamp = new SpotLight('#ffd09a', 4.5, 3.5, Math.PI / 3.2, 0.55, 1.4);
    lamp.position.set(-0.85, 1.05, -0.55);
    lamp.target.position.set(0.15, BENCH_H, BENCH_Z);
    this.scene.add(lamp);
    this.scene.add(lamp.target);

    // Cool bounce from the dimmer side of the room so shadows aren't dead.
    const bounce = new PointLight('#9a7a4a', 0.7, 6, 1.4);
    bounce.position.set(-1.5, 1.8, 1.0);
    this.scene.add(bounce);

    // The magenta neon is *just starting to come on* — present but faint.
    const neonSpill = new PointLight(PALETTE.neon, 0.55, 2.2, 2.0);
    neonSpill.position.set(1.55, 1.35, -0.6);
    this.scene.add(neonSpill);

    // CRT glow — small cool green/cyan accent from the back shelf area.
    const crt = new PointLight('#4ce0a8', 0.35, 1.5, 2.0);
    crt.position.set(0.95, 1.42, -1.30);
    this.scene.add(crt);
  }

  private buildRoom() {
    const group = new Group();
    group.name = 'room';

    const floorMat = this.toon(PALETTE.floor);
    const floor = new Mesh(new PlaneGeometry(ROOM_W, ROOM_D), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    group.add(floor);

    const wallMat = this.toon(PALETTE.wall);

    const back = new Mesh(new PlaneGeometry(ROOM_W, ROOM_H), wallMat);
    back.position.set(0, ROOM_H / 2, -ROOM_D / 2);
    back.receiveShadow = true;
    group.add(back);

    const left = new Mesh(new PlaneGeometry(ROOM_D, ROOM_H), wallMat);
    left.position.set(-ROOM_W / 2, ROOM_H / 2, 0);
    left.rotation.y = Math.PI / 2;
    left.receiveShadow = true;
    group.add(left);

    const right = new Mesh(new PlaneGeometry(ROOM_D, ROOM_H), wallMat);
    right.position.set(ROOM_W / 2, ROOM_H / 2, 0);
    right.rotation.y = -Math.PI / 2;
    right.receiveShadow = true;
    group.add(right);

    // Window in the right-side wall — layered from outside-in:
    // wall (occluded by frame opening) → frame → bright glass → mullions.
    // Lower x value = closer to the room (camera), since the right wall
    // is at x = ROOM_W/2 with its inside surface facing -X.
    const winY = 1.45;
    const winZ = -0.45;
    const wallX = ROOM_W / 2;

    // Wood frame, sits flush against the wall.
    const winFrame = new Mesh(
      new PlaneGeometry(1.55, 1.25),
      this.toon(PALETTE.beam)
    );
    winFrame.position.set(wallX - 0.005, winY, winZ);
    winFrame.rotation.y = -Math.PI / 2;
    group.add(winFrame);

    // Bright emissive glass IN FRONT of the frame (closer to room).
    // MeshBasicMaterial ignores lighting, perfect for a self-lit panel.
    // High-luminance warm so the bloom pass picks it up.
    const winGlass = new Mesh(
      new PlaneGeometry(1.35, 1.05),
      new MeshBasicMaterial({ color: '#fff0c0' })
    );
    winGlass.position.set(wallX - 0.015, winY, winZ);
    winGlass.rotation.y = -Math.PI / 2;
    group.add(winGlass);

    // Cross-mullions ON the glass so it reads as a window, not a rectangle.
    const mullionMat = this.toon(PALETTE.beam);
    const vMullion = new Mesh(new BoxGeometry(0.02, 1.05, 0.04), mullionMat);
    vMullion.position.set(wallX - 0.025, winY, winZ);
    group.add(vMullion);
    const hMullion = new Mesh(new BoxGeometry(0.02, 0.04, 1.35), mullionMat);
    hMullion.position.set(wallX - 0.025, winY, winZ);
    group.add(hMullion);

    // Faint magenta cast as a coloured strip layered onto the glass —
    // simulates the neon outside without needing to render through the
    // opaque wall. Small and offset to read as "distant".
    const neon = new Mesh(
      new PlaneGeometry(0.45, 0.10),
      new MeshBasicMaterial({ color: PALETTE.neon, transparent: true, opacity: 0.6 })
    );
    neon.position.set(wallX - 0.02, winY + 0.32, winZ - 0.35);
    neon.rotation.y = -Math.PI / 2;
    group.add(neon);

    // Ceiling.
    const ceil = new Mesh(new PlaneGeometry(ROOM_W, ROOM_D), wallMat);
    ceil.position.set(0, ROOM_H, 0);
    ceil.rotation.x = Math.PI / 2;
    group.add(ceil);

    // A couple of subtle beams — fewer than the v1, the room is smaller.
    const beamMat = this.toon(PALETTE.beam);
    for (let i = -1; i <= 1; i++) {
      const beam = new Mesh(new BoxGeometry(ROOM_W, 0.12, 0.12), beamMat);
      beam.position.set(0, ROOM_H - 0.12, i * 1.0);
      beam.castShadow = true;
      group.add(beam);
    }

    this.scene.add(group);
  }

  private gltfLoader: GLTFLoader | null = null;
  private getLoader(): GLTFLoader {
    if (!this.gltfLoader) {
      this.gltfLoader = new GLTFLoader();
      // Meshopt-compressed GLBs (§3 spec) need this decoder.
      this.gltfLoader.setMeshoptDecoder(MeshoptDecoder);
    }
    return this.gltfLoader;
  }

  private async loadModel(url: string): Promise<Group> {
    const gltf = await this.getLoader().loadAsync(url);
    return gltf.scene;
  }

  private async tryReplaceWithGLB(placeholder: Mesh, url: string, material: MeshToonMaterial) {
    try {
      const root = await this.loadModel(url);
      root.position.copy(placeholder.position);
      // The bench script bakes a 0.80m top — place the model so its origin
      // matches the placeholder's centre-of-mass at y = 0.425.
      root.position.y = 0;
      root.traverse((child) => {
        const mesh = child as Mesh;
        if (mesh.isMesh) {
          mesh.material = material;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
        }
      });
      placeholder.parent?.add(root);
      placeholder.removeFromParent();
      placeholder.geometry.dispose();
    } catch (err) {
      // Asset hasn't been built yet, fall through to the placeholder box.
      console.info('[WorkshopScene] skipping model', url, (err as Error).message);
    }
  }

  private buildStations() {
    const group = new Group();
    group.name = 'stations';

    // ── single workbench against the back wall ──────────────────────────
    const benchMat = this.toon(PALETTE.bench);
    const benchTop = new Mesh(
      new BoxGeometry(BENCH_W, 0.08, BENCH_D),
      benchMat
    );
    benchTop.position.set(0, BENCH_H, BENCH_Z);
    benchTop.castShadow = true;
    benchTop.receiveShadow = true;
    group.add(benchTop);

    // Four legs.
    const legGeo = new BoxGeometry(0.08, BENCH_H - 0.04, 0.08);
    const legInsetX = BENCH_W / 2 - 0.08;
    const legInsetZ = BENCH_D / 2 - 0.08;
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const leg = new Mesh(legGeo, benchMat);
        leg.position.set(sx * legInsetX, (BENCH_H - 0.04) / 2, BENCH_Z + sz * legInsetZ);
        leg.castShadow = true;
        group.add(leg);
      }
    }

    // ── shelf above the bench ───────────────────────────────────────────
    const shelfMat = this.toon(PALETTE.shelf);
    const shelf = new Mesh(
      new BoxGeometry(SHELF_W, SHELF_T, SHELF_D),
      shelfMat
    );
    shelf.position.set(0, SHELF_Y, SHELF_Z);
    shelf.castShadow = true;
    shelf.receiveShadow = true;
    group.add(shelf);

    // Shelf brackets.
    const bracket = new BoxGeometry(0.06, 0.18, SHELF_D);
    for (const sx of [-0.85, 0.85]) {
      const br = new Mesh(bracket, shelfMat);
      br.position.set(sx, SHELF_Y - 0.1, SHELF_Z);
      group.add(br);
    }

    // ── brass anglepoise on bench-left ──────────────────────────────────
    this.buildLamp(group);

    // ── 8 workpiece slots (4 on bench, 4 on shelf) ──────────────────────
    const benchPlinthGeo = new BoxGeometry(0.32, 0.04, 0.32);
    const benchPlinthMat = this.toon(new Color('#3a2418'));
    stations.forEach((station, i) => {
      const slot = workpieceSlots[station.id];
      const onBench = slot.y < 1.5;

      // Small dark plinth so the workpiece reads as placed on the surface.
      const plinthY = onBench ? BENCH_H + 0.04 : SHELF_Y + SHELF_T / 2 + 0.02;
      const plinth = new Mesh(benchPlinthGeo, benchPlinthMat);
      plinth.position.set(slot.x, plinthY, slot.z);
      plinth.receiveShadow = true;
      group.add(plinth);

      // Coloured workpiece. Hero rim light to pop under the lamp pool.
      const workMat = this.toon(PALETTE.workpiece[i % PALETTE.workpiece.length]);
      extendWithRim(workMat, { strength: 0.7, power: 2.2 });
      const work = new Mesh(new BoxGeometry(0.28, 0.32, 0.28), workMat);
      work.position.set(slot.x, slot.y, slot.z);
      work.castShadow = true;
      group.add(work);
    });

    this.scene.add(group);
  }

  private buildLamp(parent: Group) {
    // Brass anglepoise stub — a base, a single arm, a shade. Replace with
    // the Blender-modelled lamp once that lands.
    const brassMat = this.toon(PALETTE.lampShade);
    const armMat = this.toon(new Color('#3a2418'));

    const base = new Mesh(
      new CylinderGeometry(0.12, 0.14, 0.04, 16),
      brassMat
    );
    base.position.set(-0.85, BENCH_H + 0.02, -0.55);
    base.castShadow = true;
    parent.add(base);

    const arm = new Mesh(
      new CylinderGeometry(0.015, 0.015, 0.55, 8),
      armMat
    );
    arm.position.set(-0.85, BENCH_H + 0.3, -0.55);
    arm.rotation.z = Math.PI / 7;
    arm.castShadow = true;
    parent.add(arm);

    const shade = new Mesh(
      new CylinderGeometry(0.08, 0.16, 0.18, 16, 1, true),
      brassMat
    );
    shade.position.set(-0.7, BENCH_H + 0.55, -0.55);
    shade.rotation.x = Math.PI;
    shade.rotation.z = -Math.PI / 6;
    shade.castShadow = true;
    parent.add(shade);

    // Tiny emissive bulb at the shade opening to sell the light source.
    const bulb = new Mesh(
      new CylinderGeometry(0.06, 0.06, 0.02, 12),
      new MeshBasicMaterial({ color: PALETTE.lampGlow })
    );
    bulb.position.set(-0.7, BENCH_H + 0.47, -0.55);
    parent.add(bulb);
  }
}
