import type { SceneDocument } from '../model/SceneDocument';
import type { Point2 } from '../model/WallObject';
import { Svg2DFurnitureView } from '../render/svg/Svg2DFurnitureView';
import { Svg2DRoomView } from '../render/svg/Svg2DRoomView';
import { Svg2DShapeView } from '../render/svg/Svg2DShapeView';
import { Svg2DStairView } from '../render/svg/Svg2DStairView';
import { Svg2DWallView } from '../render/svg/Svg2DWallView';
import { createSurfacePatternDefs } from '../render/svg/svgTexturePatterns';

const SVG_NS = 'http://www.w3.org/2000/svg';
const PX_PER_UNIT = 46;
const PADDING_M = 1;

interface Bounds {
  minX: number;
  minZ: number;
  maxX: number;
  maxZ: number;
}

/**
 * Builds a standalone SVG floor-plan string from the document model
 * (not the live DOM). Safe for headless / unit-test use in jsdom.
 */
export class SvgExportBuilder {
  public static build(document: SceneDocument, options: { includeGrid?: boolean } = {}): string {
    const walls = document.listWalls();
    const rooms = document.listRooms();
    const openings = document.listOpenings();
    const shapes = document.list();
    const furniture = document.listFurniture();
    const stairs = document.listStairs();
    const settings = document.settings;

    const bounds = expandBounds(collectBounds(document), PADDING_M);
    const widthPx = Math.max((bounds.maxX - bounds.minX) * PX_PER_UNIT, 1);
    const heightPx = Math.max((bounds.maxZ - bounds.minZ) * PX_PER_UNIT, 1);
    const origin = {
      x: -bounds.minX * PX_PER_UNIT,
      y: -bounds.minZ * PX_PER_UNIT,
    };

    const root = globalThis.document.createElementNS(SVG_NS, 'svg');
    root.setAttribute('xmlns', SVG_NS);
    root.setAttribute('width', String(Math.round(widthPx)));
    root.setAttribute('height', String(Math.round(heightPx)));
    root.setAttribute('viewBox', `0 0 ${widthPx} ${heightPx}`);
    root.setAttribute('data-export', 'floor-plan');

    root.appendChild(createSurfacePatternDefs());

    const field = globalThis.document.createElementNS(SVG_NS, 'rect');
    field.setAttribute('x', '0');
    field.setAttribute('y', '0');
    field.setAttribute('width', String(widthPx));
    field.setAttribute('height', String(heightPx));
    field.setAttribute('fill', settings.floor.color);
    field.setAttribute('opacity', '0.55');
    root.appendChild(field);

    if (options.includeGrid !== false && settings.field.gridVisible) {
      root.appendChild(buildGrid(settings.field.gridStep, bounds, origin));
    }

    const roomsGroup = group('rooms');
    for (const room of rooms) {
      const view = new Svg2DRoomView(room);
      view.update(room, PX_PER_UNIT, origin, false);
      roomsGroup.appendChild(view.group);
    }
    root.appendChild(roomsGroup);

    const wallsGroup = group('walls');
    for (const wall of walls) {
      const view = new Svg2DWallView(wall);
      const wallOpenings = openings.filter((o) => o.wallId === wall.id);
      view.update(wall, wallOpenings, PX_PER_UNIT, origin, false, null);
      wallsGroup.appendChild(view.group);
    }
    root.appendChild(wallsGroup);

    const shapesGroup = group('shapes');
    for (const shape of shapes) {
      const view = new Svg2DShapeView(shape);
      view.update(shape, PX_PER_UNIT, origin, false);
      shapesGroup.appendChild(view.group);
    }
    root.appendChild(shapesGroup);

    const furnitureGroup = group('furniture');
    for (const item of furniture) {
      const view = new Svg2DFurnitureView(item);
      view.update(item, PX_PER_UNIT, origin, false);
      furnitureGroup.appendChild(view.group);
    }
    root.appendChild(furnitureGroup);

    const stairsGroup = group('stairs');
    for (const stair of stairs) {
      const view = new Svg2DStairView(stair);
      view.update(stair, PX_PER_UNIT, origin, false);
      stairsGroup.appendChild(view.group);
    }
    root.appendChild(stairsGroup);

    return new XMLSerializer().serializeToString(root);
  }
}

function group(name: string): SVGGElement {
  const g = globalThis.document.createElementNS(SVG_NS, 'g') as SVGGElement;
  g.setAttribute('data-layer', name);
  return g;
}

function expandBounds(bounds: Bounds, pad: number): Bounds {
  return {
    minX: bounds.minX - pad,
    minZ: bounds.minZ - pad,
    maxX: bounds.maxX + pad,
    maxZ: bounds.maxZ + pad,
  };
}

function collectBounds(document: SceneDocument): Bounds {
  const points: Point2[] = [];

  for (const wall of document.listWalls()) {
    points.push(wall.start, wall.end);
  }
  for (const room of document.listRooms()) {
    points.push(...room.polygon);
  }
  for (const shape of document.list()) {
    const hw = shape.footprint.width / 2;
    const hd = shape.footprint.depth / 2;
    points.push(
      { x: shape.position.x - hw, z: shape.position.z - hd },
      { x: shape.position.x + hw, z: shape.position.z + hd },
    );
  }
  for (const item of document.listFurniture()) {
    const hw = item.footprint.width / 2;
    const hd = item.footprint.depth / 2;
    points.push(
      { x: item.position.x - hw, z: item.position.z - hd },
      { x: item.position.x + hw, z: item.position.z + hd },
    );
  }
  for (const stair of document.listStairs()) {
    const hw = stair.width / 2;
    const hd = stair.depth / 2;
    points.push(
      { x: stair.position.x - hw, z: stair.position.z - hd },
      { x: stair.position.x + hw, z: stair.position.z + hd },
    );
  }

  if (points.length === 0) {
    const { width, depth } = document.settings.field;
    return { minX: -width / 2, minZ: -depth / 2, maxX: width / 2, maxZ: depth / 2 };
  }

  let minX = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxZ = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    minZ = Math.min(minZ, p.z);
    maxX = Math.max(maxX, p.x);
    maxZ = Math.max(maxZ, p.z);
  }
  return { minX, minZ, maxX, maxZ };
}

function buildGrid(
  gridStep: number,
  bounds: Bounds,
  origin: { x: number; y: number },
): SVGGElement {
  const g = group('grid');
  const step = Math.max(gridStep, 0.1);
  const minX = origin.x + bounds.minX * PX_PER_UNIT;
  const maxX = origin.x + bounds.maxX * PX_PER_UNIT;
  const minY = origin.y + bounds.minZ * PX_PER_UNIT;
  const maxY = origin.y + bounds.maxZ * PX_PER_UNIT;

  const startX = Math.ceil(bounds.minX / step) * step;
  const startZ = Math.ceil(bounds.minZ / step) * step;

  for (let x = startX; x <= bounds.maxX + 1e-6; x += step) {
    const px = origin.x + x * PX_PER_UNIT;
    const line = globalThis.document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', String(px));
    line.setAttribute('y1', String(minY));
    line.setAttribute('x2', String(px));
    line.setAttribute('y2', String(maxY));
    line.setAttribute('stroke', 'rgba(0,0,0,0.12)');
    line.setAttribute('stroke-width', '1');
    g.appendChild(line);
  }
  for (let z = startZ; z <= bounds.maxZ + 1e-6; z += step) {
    const py = origin.y + z * PX_PER_UNIT;
    const line = globalThis.document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', String(minX));
    line.setAttribute('y1', String(py));
    line.setAttribute('x2', String(maxX));
    line.setAttribute('y2', String(py));
    line.setAttribute('stroke', 'rgba(0,0,0,0.12)');
    line.setAttribute('stroke-width', '1');
    g.appendChild(line);
  }

  return g;
}
