import { Vector3 } from 'three';
import type { StationId } from '$lib/data/projects';

export interface Waypoint {
  position: Vector3;
  lookAt: Vector3;
}

// Workshop nook: one workbench against the back wall, one shelf above it,
// craftsman seated behind. Camera lives in front of the bench.
//
// Coordinate system: +Z is toward the viewer, -Z is back wall.
//   Bench top:   y = 0.85, z = -0.9, 2.0m wide.
//   Back shelf:  y = 1.70, z = -1.4, 2.0m wide.
//   Anglepoise: x ≈ -0.85 (frame-left), pools at world (0, 0.95, -0.9).
//   Window:     frame-right, z ≈ -0.9, x ≈ 1.4, faint magenta neon outside.

export const OVERVIEW: Waypoint = {
  // Mirrors the reference image angle: three-quarter on the bench, lamp
  // slightly left of frame, window with golden-hour spill at frame-right.
  position: new Vector3(-0.4, 1.55, 2.5),
  lookAt: new Vector3(0.45, 1.10, -1.0)
};

// Eight workpiece slots — four on the bench front row (closer to the
// viewer), four on the back shelf. Order is the natural reading order
// for someone sweeping their eye across the scene.
export const workpieceSlots: Record<StationId, Vector3> = {
  // Bench front row, y = 0.95 (just above the bench top).
  superstack:      new Vector3(-0.75, 0.95, -0.75),
  salesape:        new Vector3(-0.25, 0.95, -0.75),
  movetech:        new Vector3( 0.25, 0.95, -0.75),
  hpc:             new Vector3( 0.75, 0.95, -0.75),
  // Back shelf, y = 1.78 (sitting on the 1.70m shelf).
  writing:         new Vector3(-0.75, 1.78, -1.4),
  recommendations: new Vector3(-0.25, 1.78, -1.4),
  cv:              new Vector3( 0.25, 1.78, -1.4),
  contact:         new Vector3( 0.75, 1.78, -1.4)
};

// The anglepoise lamp sits at x ≈ -0.85; any bench camera that lands left
// of it stares into the bulb. Bias the leftmost shots rightward so the
// lamp falls outside the framing.
function lampSafeX(slotX: number): number {
  return slotX < -0.4 ? Math.max(slotX + 0.6, -0.2) : slotX;
}

function waypointForBenchSlot(slot: Vector3): Waypoint {
  // Straight-on three-quarter dolly to each bench specimen — camera 0.85m
  // forward, lifted 0.30m so we look slightly down.
  const cameraX = lampSafeX(slot.x);
  const position = new Vector3(cameraX, slot.y + 0.30, slot.z + 0.85);
  const lookAt = slot.clone().add(new Vector3(0, -0.05, 0));
  return { position, lookAt };
}

function waypointForShelfSlot(slot: Vector3): Waypoint {
  // Shelf specimens: camera below shelf line, looking up to the slot.
  // Tighter dolly than bench shots so the back shelf reads as the focus.
  const position = new Vector3(slot.x, slot.y - 0.15, slot.z + 1.05);
  const lookAt = slot.clone();
  return { position, lookAt };
}

export const stationWaypoints: Record<StationId, Waypoint> = {
  superstack:      waypointForBenchSlot(workpieceSlots.superstack),
  salesape:        waypointForBenchSlot(workpieceSlots.salesape),
  movetech:        waypointForBenchSlot(workpieceSlots.movetech),
  hpc:             waypointForBenchSlot(workpieceSlots.hpc),
  writing:         waypointForShelfSlot(workpieceSlots.writing),
  recommendations: waypointForShelfSlot(workpieceSlots.recommendations),
  cv:              waypointForShelfSlot(workpieceSlots.cv),
  contact:         waypointForShelfSlot(workpieceSlots.contact)
};
