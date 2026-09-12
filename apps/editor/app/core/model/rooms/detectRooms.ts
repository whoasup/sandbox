import type { Point2, WallObject } from '../WallObject';
import { fingerprintPolygon, polygonSignedArea, type RoomDraft } from '../Room';

const MERGE_EPSILON = 0.05;
const MIN_EDGE_LENGTH = 1e-4;
const MIN_ROOM_AREA = 0.05;

interface Vertex {
  id: number;
  x: number;
  z: number;
}

interface GraphEdge {
  wallId: string;
  a: number;
  b: number;
}

interface HalfEdge {
  key: string;
  from: number;
  to: number;
  wallId: string;
  twinKey: string;
  /** Next half-edge in CCW face walk. */
  nextKey: string | null;
}

function keyOf(from: number, to: number): string {
  return `${from}->${to}`;
}

function distSq(a: Point2, b: Point2): number {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return dx * dx + dz * dz;
}

/**
 * Snap-merge wall endpoints into graph vertices, then find minimal
 * interior faces (closed rooms). Outer unbounded face is discarded.
 */
export function detectRooms(walls: readonly WallObject[]): RoomDraft[] {
  if (walls.length < 3) return [];

  const vertices: Vertex[] = [];
  const findOrCreate = (point: Point2): number => {
    for (const v of vertices) {
      if (distSq(v, point) <= MERGE_EPSILON * MERGE_EPSILON) return v.id;
    }
    const id = vertices.length;
    vertices.push({ id, x: point.x, z: point.z });
    return id;
  };

  const edges: GraphEdge[] = [];
  const undirectedSeen = new Set<string>();

  for (const wall of walls) {
    if (wall.length < MIN_EDGE_LENGTH) continue;
    const a = findOrCreate(wall.start);
    const b = findOrCreate(wall.end);
    if (a === b) continue;
    const undirected = a < b ? `${a}|${b}` : `${b}|${a}`;
    if (undirectedSeen.has(undirected)) continue;
    undirectedSeen.add(undirected);
    edges.push({ wallId: wall.id, a, b });
  }

  if (edges.length < 3) return [];

  const halfEdges = new Map<string, HalfEdge>();
  const outgoing = new Map<number, HalfEdge[]>();

  for (const edge of edges) {
    const ab: HalfEdge = {
      key: keyOf(edge.a, edge.b),
      from: edge.a,
      to: edge.b,
      wallId: edge.wallId,
      twinKey: keyOf(edge.b, edge.a),
      nextKey: null,
    };
    const ba: HalfEdge = {
      key: keyOf(edge.b, edge.a),
      from: edge.b,
      to: edge.a,
      wallId: edge.wallId,
      twinKey: keyOf(edge.a, edge.b),
      nextKey: null,
    };
    halfEdges.set(ab.key, ab);
    halfEdges.set(ba.key, ba);
    const outA = outgoing.get(edge.a) ?? [];
    outA.push(ab);
    outgoing.set(edge.a, outA);
    const outB = outgoing.get(edge.b) ?? [];
    outB.push(ba);
    outgoing.set(edge.b, outB);
  }

  // Sort outgoing edges by angle; link each half-edge to the next CCW turn.
  for (const [vertexId, outs] of outgoing) {
    const origin = vertices[vertexId]!;
    outs.sort((ha, hb) => {
      const va = vertices[ha.to]!;
      const vb = vertices[hb.to]!;
      return (
        Math.atan2(va.z - origin.z, va.x - origin.x) - Math.atan2(vb.z - origin.z, vb.x - origin.x)
      );
    });
    for (let i = 0; i < outs.length; i++) {
      const twin = halfEdges.get(outs[i]!.twinKey);
      if (!twin) continue;
      // Arriving via twin; leave via previous outgoing (CW neighbor → CCW face).
      const prev = outs[(i - 1 + outs.length) % outs.length]!;
      twin.nextKey = prev.key;
    }
  }

  const visited = new Set<string>();
  const drafts: RoomDraft[] = [];

  for (const start of halfEdges.values()) {
    if (visited.has(start.key)) continue;

    const cycleKeys: string[] = [];
    const wallIds: string[] = [];
    let current: HalfEdge | undefined = start;
    let guard = 0;
    let closed = false;

    while (current && guard++ < halfEdges.size + 2) {
      if (visited.has(current.key)) break;
      visited.add(current.key);
      cycleKeys.push(current.key);
      wallIds.push(current.wallId);
      if (!current.nextKey) break;
      if (current.nextKey === start.key) {
        closed = true;
        break;
      }
      current = halfEdges.get(current.nextKey);
    }

    if (!closed || cycleKeys.length < 3) continue;

    const polygon: Point2[] = cycleKeys.map((k) => {
      const he = halfEdges.get(k)!;
      return { x: vertices[he.from]!.x, z: vertices[he.from]!.z };
    });

    const signedArea = polygonSignedArea(polygon);
    const absArea = Math.abs(signedArea);
    if (absArea < MIN_ROOM_AREA) continue;

    // Interior faces walk CCW (positive signed area in XZ). The outer
    // unbounded face walks CW (negative) — discard it.
    if (signedArea <= 0) continue;

    const uniqueWallIds = [...new Set(wallIds)].sort();
    drafts.push({
      polygon,
      wallIds: uniqueWallIds,
      fingerprint: fingerprintPolygon(polygon),
      signedArea,
    });
  }

  drafts.sort((a, b) => a.fingerprint.localeCompare(b.fingerprint));
  return drafts;
}
