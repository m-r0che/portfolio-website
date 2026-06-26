"""Build the workshop bench, headless.

Run from the repo root:
    blender --background --python assets/scripts/workbench.py

Produces assets/raw/workbench.glb. The bench is intentionally crude —
this script exists to prove the pipeline. Treat the geometry as a
placeholder; the real workbench gets modelled interactively via the
official Blender MCP server, then exported by hand or by a similar script.

Style targets (see webgl-workshop-portfolio.md §6):
    < 2k tris, single material, hand-paintable UVs.
"""

import bpy
import math
import os
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
OUT = REPO_ROOT / "assets" / "raw" / "workbench.glb"


def reset_scene() -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)


def make_bench() -> bpy.types.Object:
    # Top: 1.10 x 0.70 x 0.10
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, 0.0, 0.80))
    top = bpy.context.active_object
    top.scale = (1.10, 0.70, 0.10)
    top.name = "Workbench"

    # Legs: four 0.08 x 0.08 x 0.80 posts
    legs: list[bpy.types.Object] = []
    inset_x = 1.10 / 2.0 - 0.08
    inset_y = 0.70 / 2.0 - 0.08
    for sx in (-1, 1):
        for sy in (-1, 1):
            bpy.ops.mesh.primitive_cube_add(
                size=1.0,
                location=(sx * inset_x, sy * inset_y, 0.40),
            )
            leg = bpy.context.active_object
            leg.scale = (0.08, 0.08, 0.80)
            legs.append(leg)

    # Stretcher rail across the back, helps it read as a bench not a table.
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, -inset_y, 0.18))
    rail = bpy.context.active_object
    rail.scale = (1.10 - 0.20, 0.06, 0.06)

    # Apply transforms so the export keeps dimensions clean.
    for obj in [top, rail, *legs]:
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)

    # Join everything under the top.
    bpy.ops.object.select_all(action="DESELECT")
    for obj in [rail, *legs]:
        obj.select_set(True)
    top.select_set(True)
    bpy.context.view_layer.objects.active = top
    bpy.ops.object.join()

    # Single wood material; final colour is set in MeshToonMaterial,
    # but glTF still wants a baseColor so the editor preview reads.
    mat = bpy.data.materials.new("Wood")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (0.49, 0.29, 0.15, 1.0)
    bsdf.inputs["Roughness"].default_value = 0.85
    top.data.materials.clear()
    top.data.materials.append(mat)

    # Slight bevel for the painterly silhouette.
    bevel = top.modifiers.new(name="Bevel", type="BEVEL")
    bevel.width = 0.015
    bevel.segments = 2
    bpy.context.view_layer.objects.active = top
    bpy.ops.object.modifier_apply(modifier=bevel.name)

    return top


def export_glb(target: bpy.types.Object, out_path: Path) -> None:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.object.select_all(action="DESELECT")
    target.select_set(True)
    bpy.context.view_layer.objects.active = target
    bpy.ops.export_scene.gltf(
        filepath=str(out_path),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_materials="EXPORT",
        export_yup=True,
    )


def main() -> None:
    reset_scene()
    bench = make_bench()
    export_glb(bench, OUT)
    print(f"[workbench.py] wrote {OUT} ({os.path.getsize(OUT)} bytes)")


if __name__ == "__main__":
    main()
    # Blender's headless mode exits cleanly without this, but be explicit.
    sys.exit(0)
