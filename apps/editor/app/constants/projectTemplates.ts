import {
  SceneDocument,
  addRectangularRoom,
  createDefaultFloor,
  type FloorRecord,
} from '@sandbox/editor-core';

export interface ProjectTemplateMeta {
  id: string;
  title: string;
  description: string;
  /** Build floor records for a new project (ids remapped on create). */
  buildFloors: () => FloorRecord[];
}

function floorFromDoc(doc: SceneDocument, name = 'Этаж 1'): FloorRecord {
  const floor = createDefaultFloor(doc.toSnapshot(), 1);
  floor.name = name;
  return floor;
}

/** Студия: one 6×4 room. */
function buildStudioFloors(): FloorRecord[] {
  const doc = new SceneDocument();
  addRectangularRoom(doc, {
    origin: { x: -3, z: -2 },
    width: 6,
    depth: 4,
    name: 'Студия',
    wallHeight: 2.7,
  });
  return [floorFromDoc(doc)];
}

/** 1-комнатная: living 5×4 + bedroom 3×4 sharing the east wall. */
function buildOneRoomFloors(): FloorRecord[] {
  const doc = new SceneDocument();
  addRectangularRoom(doc, {
    origin: { x: 0, z: 0 },
    width: 5,
    depth: 4,
    name: 'Гостиная',
    wallHeight: 2.7,
  });
  // Shares the vertical edge at x=5 (duplicate segment skipped by detectRooms).
  addRectangularRoom(doc, {
    origin: { x: 5, z: 0 },
    width: 3,
    depth: 4,
    name: 'Спальня',
    wallHeight: 2.7,
  });
  return [floorFromDoc(doc)];
}

/** Офис: open plan 8×6 with a meeting room 3×3 in the corner. */
function buildOfficeFloors(): FloorRecord[] {
  const doc = new SceneDocument();
  addRectangularRoom(doc, {
    origin: { x: 0, z: 0 },
    width: 8,
    depth: 6,
    name: 'Опенспейс',
    wallHeight: 3,
  });
  addRectangularRoom(doc, {
    origin: { x: 8, z: 0 },
    width: 3,
    depth: 3,
    name: 'Переговорная',
    wallHeight: 3,
  });
  return [floorFromDoc(doc)];
}

export const PROJECT_TEMPLATES: readonly ProjectTemplateMeta[] = [
  {
    id: 'studio',
    title: 'Студия',
    description: 'Одна комната 6×4 м — быстрый старт для маленькой квартиры.',
    buildFloors: buildStudioFloors,
  },
  {
    id: 'one-room',
    title: '1-комнатная',
    description: 'Гостиная 5×4 и спальня 3×4.',
    buildFloors: buildOneRoomFloors,
  },
  {
    id: 'office',
    title: 'Офис',
    description: 'Опенспейс 8×6 и переговорная 3×3.',
    buildFloors: buildOfficeFloors,
  },
];

export function getProjectTemplate(id: string): ProjectTemplateMeta | undefined {
  return PROJECT_TEMPLATES.find((t) => t.id === id);
}
