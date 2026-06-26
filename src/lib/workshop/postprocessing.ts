import {
  EffectComposer,
  EffectPass,
  RenderPass,
  BloomEffect,
  VignetteEffect,
  NoiseEffect,
  ToneMappingEffect,
  SMAAEffect,
  ToneMappingMode,
  BlendFunction,
  KernelSize
} from 'postprocessing';
import type { Camera, Scene, WebGLRenderer } from 'three';

export interface PipelineOpts {
  mobile?: boolean;
}

export function makePipeline(
  renderer: WebGLRenderer,
  scene: Scene,
  camera: Camera,
  opts: PipelineOpts = {}
): EffectComposer {
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  const vignette = new VignetteEffect({ darkness: 0.35, offset: 0.4 });
  const noise = new NoiseEffect({
    blendFunction: BlendFunction.SOFT_LIGHT,
    premultiply: true
  });
  noise.blendMode.opacity.value = 0.06;
  const tonemap = new ToneMappingEffect({ mode: ToneMappingMode.ACES_FILMIC });

  if (opts.mobile) {
    // §7 mobile cut: drop bloom + SMAA.
    composer.addPass(new EffectPass(camera, vignette, noise, tonemap));
  } else {
    const bloom = new BloomEffect({
      intensity: 0.4,
      luminanceThreshold: 0.85,
      luminanceSmoothing: 0.2,
      kernelSize: KernelSize.MEDIUM,
      mipmapBlur: true
    });
    const smaa = new SMAAEffect();
    composer.addPass(new EffectPass(camera, bloom, vignette, noise, tonemap, smaa));
  }

  return composer;
}
