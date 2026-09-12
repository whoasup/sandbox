import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  createDefaultSceneSettings,
  resolveBackgroundColor,
  type FurnitureObject,
  type Opening,
  type Room,
  type SceneObject,
  type SceneSettings,
  type SelectionRef,
  type StairObject,
  type WallObject,
} from '@sandbox/editor-core';
import type { ISceneRenderer, RendererInteractionEvents } from '../ISceneRenderer';
import { ThreeFurnitureMesh } from './ThreeFurnitureMesh';
import { ThreeMeshFactory } from './ThreeMeshFactory';
import { ThreeRoomFloorMesh } from './ThreeRoomFloorMesh';
import { ThreeStairMesh } from './ThreeStairMesh';
import { ThreeWallMesh } from './ThreeWallMesh';
import { resolveWalkMove } from './camera/walkCollision';
import type { CameraMode } from './cameraModes';

export type { CameraMode } from './cameraModes';

const DEFAULT_CAMERA_POSITION = new THREE.Vector3(6, 6, 8);
const EYE_HEIGHT = 1.6;

/**
 * OOP wrapper around a three.js scene graph: owns the renderer, camera,
 * controls and render loop, and keeps a `Mesh` per shape / wall in sync
 * with the document via `render()`. Vue only ever calls `mount`, `render`
 * and `dispose` — everything else is an implementation detail.
 */
export class ThreeRenderer implements ISceneRenderer {
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200);
  private readonly renderer = new THREE.WebGLRenderer({
    antialias: true,
    preserveDrawingBuffer: true,
  });
  private readonly controls: OrbitControls;
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private readonly dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private readonly meshes = new Map<string, THREE.Mesh>();
  private readonly wallMeshes = new Map<string, ThreeWallMesh>();
  private readonly roomMeshes = new Map<string, ThreeRoomFloorMesh>();
  private readonly furnitureMeshes = new Map<string, ThreeFurnitureMesh>();
  private readonly stairMeshes = new Map<string, ThreeStairMesh>();

  private container: HTMLElement | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private frameHandle = 0;
  private selectionHelper: THREE.BoxHelper | null = null;
  private dragging:
    | { type: 'shape'; id: string }
    | { type: 'wall'; id: string }
    | { type: 'furniture'; id: string }
    | { type: 'stair'; id: string }
    | null = null;
  private latestSettings: SceneSettings = createDefaultSceneSettings();
  private latestWalls: readonly WallObject[] = [];
  private cameraMode: CameraMode = 'orbit';
  private floorElevation = 0;
  private showCeiling = false;
  private ceilingMesh: THREE.Mesh | null = null;
  private belowFloorGroup: THREE.Group | null = null;
  private readonly keysDown = new Set<string>();
  private walkYaw = 0;
  private walkPitch = 0;
  private pointerLocked = false;

  private gridHelper: THREE.GridHelper | null = null;
  private ground: THREE.Mesh | null = null;
  private axesHelper: THREE.AxesHelper | null = null;

  public constructor(private readonly interactions: RendererInteractionEvents = {}) {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.02;
    this.camera.position.copy(DEFAULT_CAMERA_POSITION);
    this.camera.lookAt(0, 0, 0);

    this.setupLighting();
    this.applyEnvironment(this.latestSettings);
  }

  public setCameraMode(mode: CameraMode): void {
    this.cameraMode = mode;
    if (mode === 'orbit') {
      this.exitPointerLock();
      this.controls.enabled = true;
      this.controls.enableRotate = true;
      this.camera.position.copy(DEFAULT_CAMERA_POSITION);
      this.camera.lookAt(0, this.floorElevation, 0);
      this.controls.target.set(0, this.floorElevation, 0);
    } else if (mode === 'top') {
      this.exitPointerLock();
      this.controls.enabled = true;
      this.controls.enableRotate = false;
      this.camera.position.set(0, this.floorElevation + 18, 0.01);
      this.controls.target.set(0, this.floorElevation, 0);
      this.camera.lookAt(0, this.floorElevation, 0);
    } else {
      this.controls.enabled = false;
      this.camera.position.set(0, this.floorElevation + EYE_HEIGHT, 4);
      this.walkYaw = 0;
      this.walkPitch = 0;
      this.applyWalkLook();
    }
  }

  public setFloorElevation(elevation: number): void {
    this.floorElevation = elevation;
    this.dragPlane.constant = -elevation;
  }

  public setShowCeiling(show: boolean): void {
    this.showCeiling = show;
    this.syncCeiling();
  }

  /** Capture the current 3D view as a PNG Blob (requires preserveDrawingBuffer). */
  public capturePng(): Promise<Blob> {
    this.renderer.render(this.scene, this.camera);
    return new Promise((resolve, reject) => {
      this.renderer.domElement.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('PNG capture failed'));
      }, 'image/png');
    });
  }

  public setBelowFloor(
    walls: readonly WallObject[],
    rooms: readonly Room[],
    openings: readonly Opening[],
  ): void {
    if (this.belowFloorGroup) {
      this.scene.remove(this.belowFloorGroup);
      this.belowFloorGroup.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else (obj.material as THREE.Material).dispose();
        }
      });
      this.belowFloorGroup = null;
    }
    if (walls.length === 0 && rooms.length === 0) return;

    const group = new THREE.Group();
    group.position.y = -3;
    for (const room of rooms) {
      const mesh = new ThreeRoomFloorMesh(room);
      const mat = mesh.mesh.material as THREE.MeshStandardMaterial;
      mat.transparent = true;
      mat.opacity = 0.35;
      group.add(mesh.mesh);
    }
    for (const wall of walls) {
      const view = new ThreeWallMesh(wall);
      view.update(
        wall,
        openings.filter((o) => o.wallId === wall.id),
      );
      view.mesh.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          const mat = obj.material as THREE.MeshStandardMaterial;
          mat.transparent = true;
          mat.opacity = 0.35;
        }
      });
      group.add(view.mesh);
    }
    this.belowFloorGroup = group;
    this.scene.add(group);
  }

  public mount(container: HTMLElement): void {
    if (this.container) {
      throw new Error('ThreeRenderer is already mounted; call dispose() before mounting again.');
    }
    this.container = container;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.resize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);

    this.renderer.domElement.addEventListener('pointerdown', this.handlePointerDown);
    this.renderer.domElement.addEventListener('pointermove', this.handlePointerMove);
    this.renderer.domElement.addEventListener('pointerup', this.handlePointerUp);
    this.renderer.domElement.addEventListener('pointerleave', this.handlePointerUp);
    this.renderer.domElement.addEventListener('dblclick', this.handleDoubleClick);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    document.addEventListener('pointerlockchange', this.handlePointerLockChange);
    this.renderer.domElement.addEventListener('mousemove', this.handleMouseLook);

    this.resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      this.resize(entry.contentRect.width, entry.contentRect.height);
    });
    this.resizeObserver.observe(container);

    this.startLoop();
  }

  public render(
    objects: readonly SceneObject[],
    walls: readonly WallObject[],
    rooms: readonly Room[],
    openings: readonly Opening[],
    furniture: readonly FurnitureObject[],
    stairs: readonly StairObject[],
    selection: SelectionRef,
    settings: SceneSettings,
  ): void {
    this.latestWalls = walls;
    this.applyEnvironment(settings);
    this.syncRooms(rooms);
    this.syncShapes(objects);
    this.syncWalls(walls, openings);
    this.syncFurniture(furniture);
    this.syncStairs(stairs);
    this.syncCeiling();
    this.updateSelection(selection);
  }

  public dispose(): void {
    cancelAnimationFrame(this.frameHandle);
    this.resizeObserver?.disconnect();
    this.renderer.domElement.removeEventListener('pointerdown', this.handlePointerDown);
    this.renderer.domElement.removeEventListener('pointermove', this.handlePointerMove);
    this.renderer.domElement.removeEventListener('pointerup', this.handlePointerUp);
    this.renderer.domElement.removeEventListener('pointerleave', this.handlePointerUp);
    this.renderer.domElement.removeEventListener('dblclick', this.handleDoubleClick);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    document.removeEventListener('pointerlockchange', this.handlePointerLockChange);
    this.renderer.domElement.removeEventListener('mousemove', this.handleMouseLook);
    this.exitPointerLock();
    this.setBelowFloor([], [], []);
    if (this.ceilingMesh) {
      this.scene.remove(this.ceilingMesh);
      this.ceilingMesh.geometry.dispose();
      (this.ceilingMesh.material as THREE.Material).dispose();
      this.ceilingMesh = null;
    }

    for (const mesh of this.meshes.values()) {
      mesh.geometry.dispose();
    }
    this.meshes.clear();
    for (const wall of this.wallMeshes.values()) {
      this.scene.remove(wall.mesh);
      wall.dispose();
    }
    this.wallMeshes.clear();
    for (const room of this.roomMeshes.values()) {
      this.scene.remove(room.mesh);
      room.dispose();
    }
    this.roomMeshes.clear();
    for (const item of this.furnitureMeshes.values()) {
      this.scene.remove(item.mesh);
      item.dispose();
    }
    this.furnitureMeshes.clear();
    for (const stair of this.stairMeshes.values()) {
      this.scene.remove(stair.mesh);
      stair.dispose();
    }
    this.stairMeshes.clear();
    this.clearEnvironment();
    this.controls.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
    this.container = null;
  }

  private syncShapes(objects: readonly SceneObject[]): void {
    const seen = new Set<string>();

    for (const object of objects) {
      seen.add(object.id);
      const existing = this.meshes.get(object.id);
      if (existing && existing.userData.shapeKind === object.kind) {
        ThreeMeshFactory.updateMesh(existing, object);
      } else {
        if (existing) {
          this.scene.remove(existing);
          existing.geometry.dispose();
          this.meshes.delete(object.id);
        }
        const mesh = ThreeMeshFactory.createMesh(object);
        mesh.userData.shapeKind = object.kind;
        mesh.userData.entityType = 'shape';
        this.meshes.set(object.id, mesh);
        this.scene.add(mesh);
      }
    }

    for (const [id, mesh] of this.meshes) {
      if (seen.has(id)) continue;
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      this.meshes.delete(id);
    }
  }

  private syncWalls(walls: readonly WallObject[], openings: readonly Opening[]): void {
    const seen = new Set<string>();

    for (const wall of walls) {
      seen.add(wall.id);
      let view = this.wallMeshes.get(wall.id);
      const wallOpenings = openings.filter((o) => o.wallId === wall.id);
      if (!view) {
        view = new ThreeWallMesh(wall);
        this.wallMeshes.set(wall.id, view);
        this.scene.add(view.mesh);
      }
      view.update(wall, wallOpenings);
    }

    for (const [id, view] of this.wallMeshes) {
      if (seen.has(id)) continue;
      this.scene.remove(view.mesh);
      view.dispose();
      this.wallMeshes.delete(id);
    }
  }

  private syncRooms(rooms: readonly Room[]): void {
    const seen = new Set<string>();

    for (const room of rooms) {
      seen.add(room.id);
      let view = this.roomMeshes.get(room.id);
      if (!view) {
        view = new ThreeRoomFloorMesh(room);
        this.roomMeshes.set(room.id, view);
        this.scene.add(view.mesh);
      } else {
        view.update(room);
      }
    }

    for (const [id, view] of this.roomMeshes) {
      if (seen.has(id)) continue;
      this.scene.remove(view.mesh);
      view.dispose();
      this.roomMeshes.delete(id);
    }
  }

  private syncFurniture(furniture: readonly FurnitureObject[]): void {
    const seen = new Set<string>();

    for (const item of furniture) {
      seen.add(item.id);
      let view = this.furnitureMeshes.get(item.id);
      if (!view) {
        view = new ThreeFurnitureMesh(item);
        this.furnitureMeshes.set(item.id, view);
        this.scene.add(view.mesh);
      } else {
        view.update(item);
      }
    }

    for (const [id, view] of this.furnitureMeshes) {
      if (seen.has(id)) continue;
      this.scene.remove(view.mesh);
      view.dispose();
      this.furnitureMeshes.delete(id);
    }
  }

  private syncStairs(stairs: readonly StairObject[]): void {
    const seen = new Set<string>();

    for (const stair of stairs) {
      seen.add(stair.id);
      let view = this.stairMeshes.get(stair.id);
      if (!view) {
        view = new ThreeStairMesh(stair);
        this.stairMeshes.set(stair.id, view);
        this.scene.add(view.mesh);
      } else {
        view.update(stair);
      }
    }

    for (const [id, view] of this.stairMeshes) {
      if (seen.has(id)) continue;
      this.scene.remove(view.mesh);
      view.dispose();
      this.stairMeshes.delete(id);
    }
  }

  private setupLighting(): void {
    const ambient = new THREE.AmbientLight(0xffffff, 0.55);
    const sun = new THREE.DirectionalLight(0xffffff, 1.1);
    sun.position.set(6, 10, 4);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    this.scene.add(ambient, sun);
  }

  private applyEnvironment(settings: SceneSettings): void {
    const prev = this.latestSettings;
    const unchanged =
      prev.background.mode === settings.background.mode &&
      prev.background.color === settings.background.color &&
      prev.background.preset === settings.background.preset &&
      prev.field.width === settings.field.width &&
      prev.field.depth === settings.field.depth &&
      prev.field.gridVisible === settings.field.gridVisible &&
      prev.field.gridStep === settings.field.gridStep &&
      prev.field.axesVisible === settings.field.axesVisible &&
      prev.floor.color === settings.floor.color;

    this.latestSettings = settings;
    this.scene.background = new THREE.Color(resolveBackgroundColor(settings.background));
    if (unchanged && this.ground) return;

    const size = Math.max(settings.field.width, settings.field.depth);
    const divisions = Math.max(1, Math.round(size / Math.max(settings.field.gridStep, 0.1)));

    this.clearEnvironment();

    if (settings.field.gridVisible) {
      this.gridHelper = new THREE.GridHelper(size, divisions, '#b7bfc9', '#d7dbe0');
      this.scene.add(this.gridHelper);
    }

    const groundGeometry = new THREE.PlaneGeometry(settings.field.width, settings.field.depth);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(settings.floor.color),
      roughness: 0.95,
      metalness: 0,
    });
    this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.y = -0.01;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);

    if (settings.field.axesVisible) {
      this.axesHelper = new THREE.AxesHelper(Math.min(size, 8) * 0.5);
      this.scene.add(this.axesHelper);
    }
  }

  private clearEnvironment(): void {
    if (this.gridHelper) {
      this.scene.remove(this.gridHelper);
      this.gridHelper.geometry.dispose();
      const gridMat = this.gridHelper.material;
      if (Array.isArray(gridMat)) gridMat.forEach((m) => m.dispose());
      else gridMat.dispose();
      this.gridHelper = null;
    }
    if (this.ground) {
      this.scene.remove(this.ground);
      this.ground.geometry.dispose();
      (this.ground.material as THREE.Material).dispose();
      this.ground = null;
    }
    if (this.axesHelper) {
      this.scene.remove(this.axesHelper);
      this.axesHelper.dispose();
      this.axesHelper = null;
    }
  }

  private resize(width: number, height: number): void {
    if (width <= 0 || height <= 0) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private startLoop(): void {
    const clock = new THREE.Clock();
    const tick = () => {
      const dt = Math.min(clock.getDelta(), 0.05);
      if (this.cameraMode === 'walk') this.updateWalk(dt);
      else this.controls.update();
      this.renderer.render(this.scene, this.camera);
      this.frameHandle = requestAnimationFrame(tick);
    };
    tick();
  }

  private syncCeiling(): void {
    if (this.ceilingMesh) {
      this.scene.remove(this.ceilingMesh);
      this.ceilingMesh.geometry.dispose();
      (this.ceilingMesh.material as THREE.Material).dispose();
      this.ceilingMesh = null;
    }
    if (!this.showCeiling) return;
    const { width, depth } = this.latestSettings.field;
    const geo = new THREE.PlaneGeometry(width, depth);
    const mat = new THREE.MeshStandardMaterial({
      color: '#e8e4dc',
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
    });
    this.ceilingMesh = new THREE.Mesh(geo, mat);
    this.ceilingMesh.rotation.x = Math.PI / 2;
    this.ceilingMesh.position.y = this.floorElevation + 2.5;
    this.scene.add(this.ceilingMesh);
  }

  private updateWalk(dt: number): void {
    const speed =
      (this.keysDown.has('ShiftLeft') || this.keysDown.has('ShiftRight') ? 4.5 : 2.4) * dt;
    let forward = 0;
    let strafe = 0;
    if (this.keysDown.has('KeyW') || this.keysDown.has('ArrowUp')) forward += 1;
    if (this.keysDown.has('KeyS') || this.keysDown.has('ArrowDown')) forward -= 1;
    if (this.keysDown.has('KeyA') || this.keysDown.has('ArrowLeft')) strafe -= 1;
    if (this.keysDown.has('KeyD') || this.keysDown.has('ArrowRight')) strafe += 1;
    if (forward !== 0 || strafe !== 0) {
      const sin = Math.sin(this.walkYaw);
      const cos = Math.cos(this.walkYaw);
      const dx = (forward * sin + strafe * cos) * speed;
      const dz = (forward * cos - strafe * sin) * speed;
      const from = { x: this.camera.position.x, z: this.camera.position.z };
      const to = { x: from.x + dx, z: from.z + dz };
      const resolved = resolveWalkMove(from, to, this.latestWalls);
      this.camera.position.x = resolved.x;
      this.camera.position.z = resolved.z;
    }
    this.camera.position.y = this.floorElevation + EYE_HEIGHT;
  }

  private applyWalkLook(): void {
    const euler = new THREE.Euler(this.walkPitch, this.walkYaw, 0, 'YXZ');
    this.camera.quaternion.setFromEuler(euler);
  }

  private exitPointerLock(): void {
    if (document.pointerLockElement) document.exitPointerLock();
    this.pointerLocked = false;
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    this.keysDown.add(event.code);
    if (event.key === 'Escape' && this.cameraMode === 'walk') {
      this.setCameraMode('orbit');
      this.interactions.onCameraModeChange?.('orbit');
    }
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    this.keysDown.delete(event.code);
  };

  private readonly handlePointerLockChange = (): void => {
    this.pointerLocked = document.pointerLockElement === this.renderer.domElement;
  };

  private readonly handleMouseLook = (event: MouseEvent): void => {
    if (this.cameraMode !== 'walk' || !this.pointerLocked) return;
    this.walkYaw -= event.movementX * 0.0025;
    this.walkPitch -= event.movementY * 0.0025;
    this.walkPitch = Math.max(-1.2, Math.min(1.2, this.walkPitch));
    this.applyWalkLook();
  };

  private updateSelection(selection: SelectionRef): void {
    if (this.selectionHelper) {
      this.scene.remove(this.selectionHelper);
      this.selectionHelper = null;
    }
    if (!selection) return;
    let target: THREE.Object3D | undefined;
    if (selection.type === 'shape') target = this.meshes.get(selection.id);
    else if (selection.type === 'wall') target = this.wallMeshes.get(selection.id)?.mesh;
    else if (selection.type === 'room') target = this.roomMeshes.get(selection.id)?.mesh;
    else if (selection.type === 'furniture') target = this.furnitureMeshes.get(selection.id)?.mesh;
    else if (selection.type === 'stair') target = this.stairMeshes.get(selection.id)?.mesh;
    else if (selection.type === 'opening') {
      for (const view of this.wallMeshes.values()) {
        const found = view.mesh.children.find(
          (c) => c.userData.entityType === 'opening' && c.name === selection.id,
        );
        if (found) {
          target = found;
          break;
        }
      }
    }
    if (!target) return;
    this.selectionHelper = new THREE.BoxHelper(target, 0x3b7ded);
    this.scene.add(this.selectionHelper);
  }

  private updatePointer(event: MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private pickSelection(): SelectionRef {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const candidates: THREE.Object3D[] = [
      ...this.meshes.values(),
      ...[...this.roomMeshes.values()].map((view) => view.mesh),
      ...[...this.furnitureMeshes.values()].map((view) => view.mesh),
      ...[...this.stairMeshes.values()].map((view) => view.mesh),
    ];
    for (const view of this.wallMeshes.values()) {
      candidates.push(...view.mesh.children);
    }
    const hit = this.raycaster.intersectObjects(candidates, true)[0];
    if (!hit) return null;
    let current: THREE.Object3D | null = hit.object;
    while (current) {
      const entityType = current.userData.entityType as
        'shape' | 'wall' | 'room' | 'opening' | 'furniture' | 'stair' | undefined;
      if (entityType === 'wall') return { type: 'wall', id: current.name };
      if (entityType === 'room') return { type: 'room', id: current.name };
      if (entityType === 'opening') return { type: 'opening', id: current.name };
      if (entityType === 'furniture') return { type: 'furniture', id: current.name };
      if (entityType === 'stair') return { type: 'stair', id: current.name };
      if (entityType === 'shape' || (!entityType && this.meshes.has(current.name))) {
        return { type: 'shape', id: current.name };
      }
      current = current.parent;
    }
    return null;
  }

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (this.cameraMode === 'walk') {
      this.renderer.domElement.requestPointerLock();
      return;
    }
    this.updatePointer(event);
    const selection = this.pickSelection();
    this.interactions.onSelect?.(selection);
    if (
      selection &&
      (selection.type === 'shape' ||
        selection.type === 'wall' ||
        selection.type === 'furniture' ||
        selection.type === 'stair')
    ) {
      this.dragging = selection;
      this.controls.enabled = false;
      this.interactions.onMoveGestureStart?.();
    }
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (!this.dragging) return;
    this.updatePointer(event);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const point = new THREE.Vector3();
    if (this.raycaster.ray.intersectPlane(this.dragPlane, point)) {
      if (this.dragging.type === 'shape') {
        this.interactions.onMoveShape?.(this.dragging.id, point.x, point.z);
      } else if (this.dragging.type === 'wall') {
        this.interactions.onMoveWall?.(this.dragging.id, point.x, point.z);
      } else if (this.dragging.type === 'furniture') {
        this.interactions.onMoveFurniture?.(this.dragging.id, point.x, point.z);
      } else {
        this.interactions.onMoveStair?.(this.dragging.id, point.x, point.z);
      }
    }
  };

  private readonly handlePointerUp = (): void => {
    if (this.dragging) this.interactions.onMoveGestureEnd?.();
    this.dragging = null;
    this.controls.enabled = true;
  };

  private readonly handleDoubleClick = (event: MouseEvent): void => {
    if (this.cameraMode === 'walk') return;
    this.updatePointer(event);
    const selection = this.pickSelection();
    if (selection?.type === 'stair') {
      this.interactions.onActivateStair?.(selection.id);
    }
  };
}
