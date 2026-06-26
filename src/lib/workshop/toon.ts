import {
  DataTexture,
  LinearSRGBColorSpace,
  NearestFilter,
  RedFormat,
  type Material,
  type MeshToonMaterial
} from 'three';

export function makeToonGradient(steps = 4): DataTexture {
  const data = new Uint8Array(steps);
  for (let i = 0; i < steps; i++) {
    data[i] = Math.round(((i + 1) / steps) * 255);
  }
  const tex = new DataTexture(data, steps, 1, RedFormat);
  tex.minFilter = NearestFilter;
  tex.magFilter = NearestFilter;
  tex.generateMipmaps = false;
  tex.colorSpace = LinearSRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

interface RimUniforms {
  uRimColor: { value: [number, number, number] };
  uRimPower: { value: number };
  uRimStrength: { value: number };
}

export function extendWithRim(material: MeshToonMaterial, opts: Partial<{
  color: [number, number, number];
  power: number;
  strength: number;
}> = {}): RimUniforms {
  const uniforms: RimUniforms = {
    uRimColor: { value: opts.color ?? [1.0, 0.85, 0.65] },
    uRimPower: { value: opts.power ?? 2.0 },
    uRimStrength: { value: opts.strength ?? 0.5 }
  };

  const prev = (material as Material & { onBeforeCompile?: unknown }).onBeforeCompile;
  material.onBeforeCompile = (shader) => {
    if (typeof prev === 'function') (prev as (s: typeof shader) => void)(shader);
    shader.uniforms.uRimColor = uniforms.uRimColor;
    shader.uniforms.uRimPower = uniforms.uRimPower;
    shader.uniforms.uRimStrength = uniforms.uRimStrength;

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      `#include <common>
      uniform vec3 uRimColor;
      uniform float uRimPower;
      uniform float uRimStrength;`
    );

    // Inject rim after the toon lighting has been folded into outgoingLight.
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <output_fragment>',
      `
      {
        vec3 N = normalize(vNormal);
        vec3 V = normalize(vViewPosition);
        float fres = 1.0 - max(dot(N, V), 0.0);
        float rim = pow(fres, uRimPower);
        // Only on lit faces — fade by approximate brightness so shadowed sides
        // don't get a fake outline.
        float lit = clamp(dot(outgoingLight, vec3(0.299, 0.587, 0.114)) * 1.4, 0.0, 1.0);
        outgoingLight += uRimColor * (rim * uRimStrength * lit);
      }
      #include <output_fragment>`
    );
  };

  // Force re-compile on next use.
  material.needsUpdate = true;
  return uniforms;
}
