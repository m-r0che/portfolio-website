"""Import a Mixamo FBX (rigged + animated) and export as GLB with
animations embedded, ready for three.js AnimationMixer.

Usage:
    blender --background --python assets/scripts/mixamo_to_glb.py -- \
        --in  "/path/to/Mixamo Clip.fbx" \
        --out "static/models/craftsman.glb"

The double-dash is important: Blender swallows args before it, the script
parses args after.
"""

import argparse
import bpy
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]


def parse_args() -> argparse.Namespace:
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1 :]
    else:
        argv = []
    parser = argparse.ArgumentParser()
    parser.add_argument("--in", dest="src", required=True)
    parser.add_argument("--out", dest="dst", required=True)
    parser.add_argument("--anim-name", default=None,
                        help="Rename the imported clip (Mixamo defaults to 'mixamo.com').")
    return parser.parse_args(argv)


def main() -> None:
    args = parse_args()
    src = Path(args.src).expanduser().resolve()
    dst = Path(args.dst)
    if not dst.is_absolute():
        dst = REPO_ROOT / dst
    dst.parent.mkdir(parents=True, exist_ok=True)

    bpy.ops.wm.read_factory_settings(use_empty=True)

    print(f"[mixamo→glb] importing {src}")
    bpy.ops.import_scene.fbx(
        filepath=str(src),
        use_image_search=False,
        use_anim=True,
        automatic_bone_orientation=True,
        ignore_leaf_bones=True,
    )

    # Mixamo names every clip 'mixamo.com'. Rename so three.js can find it
    # by a real name (mixer.clipAction(name)).
    rename_to = args.anim_name or src.stem.replace(" ", "_")
    actions_renamed = 0
    for action in bpy.data.actions:
        action.name = rename_to
        actions_renamed += 1
    print(f"[mixamo→glb] renamed {actions_renamed} action(s) to {rename_to!r}")

    # The mesh gets named 'Beta_Surface' or similar; rename for readability.
    for obj in bpy.context.scene.objects:
        if obj.type == 'MESH':
            obj.name = 'Character'
            if obj.data:
                obj.data.name = 'CharacterMesh'
        elif obj.type == 'ARMATURE':
            obj.name = 'Armature'

    print(f"[mixamo→glb] exporting {dst}")
    bpy.ops.export_scene.gltf(
        filepath=str(dst),
        export_format='GLB',
        export_animations=True,
        export_anim_single_armature=True,
        export_optimize_animation_size=True,
        export_apply=False,        # don't apply armature modifier
        export_yup=True,
        export_skins=True,
        export_morph=True,
    )

    size = dst.stat().st_size
    print(f"[mixamo→glb] wrote {dst} ({size:,} bytes)")


if __name__ == "__main__":
    main()
    sys.exit(0)
