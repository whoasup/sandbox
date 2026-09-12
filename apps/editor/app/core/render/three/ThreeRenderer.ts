import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { Opening } from '../../model/Opening';
import type { Room } from '../../model/Room';
import type { SceneObject } from '../../model/SceneObject';
import {
  createDefaultSceneSettings,
  resolveBackgroundColor,
  type SceneSettings,
} from '../../model/SceneSettings';
import type { SelectionRef } from '../../model/types';
import type { WallObject } from '../../model/WallObject';
import type { ISceneRenderer, RendererInteractionEvents } from '../ISceneRenderer';
import { ThreeMeshFactory } from './ThreeMeshFactory';
import { ThreeRoomFloorMesh } from './ThreeRoomFloorMesh';
import { ThreeWallMesh } from './ThreeWallMesh';

const DEFAULT_CAMERA_POSITION = new THREE.Vector3(6, 6, 8);

/**
 * OOP wrapper around a three.js scene graph: owns the renderer, camera,
 * controls and render loop, and keeps a `Mesh` per shape / wall in sync
 * with the document via `render()`. Vue only ever calls `mount`, `render`
 * and `dispose` — everything else is an implementation detail.
 */
export class ThreeRenderer implements ISceneRenderer {
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200);
  private readonly renderer = new THREE.WebGLRenderer({ antialias: true });
  private readonly controls: OrbitControls;
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private readonly dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private readonly meshes = new Map<string, THREE.Mesh>();
  private readonly wallMeshes = new Map<string, ThreeWallMesh>();
  private readonly roomMeshes = new Map<string, ThreeRoomFloorMesh>();

  private container: HTMLElement | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private frameHandle = 0;
  private selectionHelper: THREE.BoxHelper | null = null;
  private dragging: { type: 'shape'; id: string } | { type: 'wall'; id: string } | null = null;
  private latestSettings: SceneSettings = createDefaultSceneSettings();

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
    selection: SelectionRef,
    settings: SceneSettings,
  ): void {
    this.applyEnvironment(settings);
    this.syncRooms(rooms);
    this.syncShapes(objects);
    this.syncWalls(walls, openings);
    this.updateSelection(selection);
  }

  public dispose(): void {
    cancelAnimationFrame(this.frameHandle);
    this.resizeObserver?.disconnect();
    this.renderer.domElement.removeEventListener('pointerdown', this.handlePointerDown);
    this.renderer.domElement.removeEventListener('pointermove', this.handlePointerMove);
    this.renderer.domElement.removeEventListener('pointerup', this.handlePointerUp);
    this.renderer.domElement.removeEventListener('pointerleave', this.handlePointerUp);

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
    const tick = () => {
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
      this.frameHandle = requestAnimationFrame(tick);
    };
    tick();
  }

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

  private updatePointer(event: PointerEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private pickSelection(): SelectionRef {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const candidates: THREE.Object3D[] = [
      ...this.meshes.values(),
      ...[...this.roomMeshes.values()].map((view) => view.mesh),
    ];
    for (const view of this.wallMeshes.values()) {
      candidates.push(...view.mesh.children);
    }
    const hit = this.raycaster.intersectObjects(candidates, false)[0];
    if (!hit) return null;
    const entityType = hit.object.userData.entityType as
      'shape' | 'wall' | 'room' | 'opening' | undefined;
    if (entityType === 'wall') return { type: 'wall', id: hit.object.name };
    if (entityType === 'room') return { type: 'room', id: hit.object.name };
    if (entityType === 'opening') return { type: 'opening', id: hit.object.name };
    return { type: 'shape', id: hit.object.name };
  }

  private readonly handlePointerDown = (event: PointerEvent): void => {
    this.updatePointer(event);
    const selection = this.pickSelection();
    this.interactions.onSelect?.(selection);
    if (selection && (selection.type === 'shape' || selection.type === 'wall')) {
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
      } else {
        this.interactions.onMoveWall?.(this.dragging.id, point.x, point.z);
      }
    }
  };

  private readonly handlePointerUp = (): void => {
    if (this.dragging) this.interactions.onMoveGestureEnd?.();
    this.dragging = null;
    this.controls.enabled = true;
  };
}
