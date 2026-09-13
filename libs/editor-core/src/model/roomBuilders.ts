import type { SurfaceKind } from '@sandbox/ui-kit';
import { fingerprintPolygon, pointInPolygon } from './Room';
import type { SceneDocument } from './SceneDocument';
import type { Point2 } from './WallObject';

export interface RectangularRoomOpts {
  origin: Point2;
  width: number;
  depth: number;
  wallHeight?: number;
  thickness?: number;
  surface?: SurfaceKind;
  color?: string;
  name?: string;
}

export interface LShapedRoomOpts extends RectangularRoomOpts {
  /** Width of the cut-out taken from the far (+x / +z) corner. */
  cutWidth: number;
  /** Depth of the cut-out taken from the far (+x / +z) corner. */
  cutDepth: number;
}

function wallInit(
  start: Point2,
  end: Point2,
  opts: Pick<RectangularRoomOpts, 'wallHeight' | 'thickness' | 'surface' | 'color'>,
) {
  return {
    start,
    end,
    height: opts.wallHeight,
    thickness: opts.thickness,
    surface: opts.surface,
    color: opts.color,
  };
}

function findRoomForPolygon(
  doc: SceneDocument,
  polygon: Point2[],
  wallIds: string[],
): string | null {
  const expectedFp = fingerprintPolygon(polygon);
  const rooms = doc.listRooms();
  const byFp = rooms.find((room) => room.fingerprint === expectedFp);
  if (byFp) return byFp.id;

  const wallSet = new Set(wallIds);
  const byWalls = rooms.find(
    (room) => room.wallIds.length === wallIds.length && room.wallIds.every((id) => wallSet.has(id)),
  );
  if (byWalls) return byWalls.id;

  // Fallback: sample a point slightly inside from the first edge midpoint.
  const a = polygon[0]!;
  const b = polygon[1] ?? a;
  const sample = { x: (a.x + b.x) / 2, z: (a.z + b.z) / 2 };
  // Nudge toward polygon average so the sample sits inside concave L shapes.
  let sx = 0;
  let sz = 0;
  for (const p of polygon) {
    sx += p.x;
    sz += p.z;
  }
  const avg = { x: sx / polygon.length, z: sz / polygon.length };
  const probe = {
    x: sample.x * 0.7 + avg.x * 0.3,
    z: sample.z * 0.7 + avg.z * 0.3,
  };
  const containing = rooms.find((room) => pointInPolygon(probe, room.polygon));
  return containing?.id ?? null;
}

function applyRoomName(doc: SceneDocument, roomId: string | null, name?: string): void {
  if (!roomId || !name?.trim()) return;
  doc.setRoomName(roomId, name);
}

/**
 * Create four walls forming an axis-aligned rectangle.
 * `origin` is the min corner; `width` along +x, `depth` along +z.
 */
export function addRectangularRoom(
  doc: SceneDocument,
  opts: RectangularRoomOpts,
): { wallIds: string[]; roomId: string | null } {
  const width = Math.abs(opts.width);
  const depth = Math.abs(opts.depth);
  const ox = opts.origin.x + (opts.width < 0 ? opts.width : 0);
  const oz = opts.origin.z + (opts.depth < 0 ? opts.depth : 0);

  const p0 = { x: ox, z: oz };
  const p1 = { x: ox + width, z: oz };
  const p2 = { x: ox + width, z: oz + depth };
  const p3 = { x: ox, z: oz + depth };

  const wallIds = [
    doc.addWall(wallInit(p0, p1, opts)).id,
    doc.addWall(wallInit(p1, p2, opts)).id,
    doc.addWall(wallInit(p2, p3, opts)).id,
    doc.addWall(wallInit(p3, p0, opts)).id,
  ];

  const roomId = findRoomForPolygon(doc, [p0, p1, p2, p3], wallIds);
  applyRoomName(doc, roomId, opts.name);
  return { wallIds, roomId };
}

/**
 * L-shaped room as six outer walls (no shared interior segment).
 *
 * Full bounding box is `width` × `depth` from `origin`. A rectangular cut of
 * `cutWidth` × `cutDepth` is removed from the far (+x, +z) corner, leaving an
 * L whose outer boundary has six segments. The two rectangles that form the L
 * share an imaginary edge at the cut — that edge is **not** drawn as a wall.
 */
export function addLShapedRoom(
  doc: SceneDocument,
  opts: LShapedRoomOpts,
): { wallIds: string[]; roomId: string | null } {
  const width = Math.abs(opts.width);
  const depth = Math.abs(opts.depth);
  const cutWidth = Math.min(Math.abs(opts.cutWidth), width - 1e-3);
  const cutDepth = Math.min(Math.abs(opts.cutDepth), depth - 1e-3);
  const ox = opts.origin.x + (opts.width < 0 ? opts.width : 0);
  const oz = opts.origin.z + (opts.depth < 0 ? opts.depth : 0);

  // Outer path (6 vertices), cut taken from top-right:
  // (ox,oz) → (ox+W,oz) → (ox+W,oz+D-CD) → (ox+W-CW,oz+D-CD) → (ox+W-CW,oz+D) → (ox,oz+D)
  const pts: Point2[] = [
    { x: ox, z: oz },
    { x: ox + width, z: oz },
    { x: ox + width, z: oz + depth - cutDepth },
    { x: ox + width - cutWidth, z: oz + depth - cutDepth },
    { x: ox + width - cutWidth, z: oz + depth },
    { x: ox, z: oz + depth },
  ];

  const wallIds: string[] = [];
  for (let i = 0; i < pts.length; i++) {
    const start = pts[i]!;
    const end = pts[(i + 1) % pts.length]!;
    wallIds.push(doc.addWall(wallInit(start, end, opts)).id);
  }

  const roomId = findRoomForPolygon(doc, pts, wallIds);
  applyRoomName(doc, roomId, opts.name);
  return { wallIds, roomId };
}
