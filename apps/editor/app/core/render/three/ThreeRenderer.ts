import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { SceneObject } from '../../model/SceneObject';
import type { ISceneRenderer, RendererInteractionEvents } from '../ISceneRenderer';
import { ThreeMeshFactory } from './ThreeMeshFactory';

const GROUND_SIZE = 40;
const DEFAULT_CAMERA_POSITION = new THREE.Vector3(6, 6, 8);

/**
 * OOP wrapper around a three.js scene graph: owns the renderer, camera,
 * controls and render loop, and keeps a `Mesh` per `SceneObject` in sync
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

  private container: HTMLElement | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private frameHandle = 0;
  private selectionHelper: THREE.BoxHelper | null = null;
  private draggingId: string | null = null;

  public constructor(private readonly interactions: RendererInteractionEvents = {}) {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.02;
    this.camera.position.copy(DEFAULT_CAMERA_POSITION);
    this.camera.lookAt(0, 0, 0);

    this.setupLighting();
    this.setupGround();
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

  public render(objects: readonly SceneObject[], selectedId: string | null): void {
    const seen = new Set<string>();

    for (const object of objects) {
      seen.add(object.id);
      const existing = this.meshes.get(object.id);
      if (existing) {
        ThreeMeshFactory.updateMesh(existing, object);
      } else {
        const mesh = ThreeMeshFactory.createMesh(object);
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

    this.updateSelection(selectedId);
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
    this.controls.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
    this.container = null;
  }

  private setupLighting(): void {
    const ambient = new THREE.AmbientLight(0xffffff, 0.55);
    const sun = new THREE.DirectionalLight(0xffffff, 1.1);
    sun.position.set(6, 10, 4);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    this.scene.add(ambient, sun);
    this.scene.background = new THREE.Color('#e7ebf0');
  }

  private setupGround(): void {
    const grid = new THREE.GridHelper(GROUND_SIZE, GROUND_SIZE, '#b7bfc9', '#d7dbe0');
    this.scene.add(grid);

    const groundGeometry = new THREE.PlaneGeometry(GROUND_SIZE, GROUND_SIZE);
    const groundMaterial = new THREE.ShadowMaterial({ opacity: 0.15 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
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

  private updateSelection(selectedId: string | null): void {
    if (this.selectionHelper) {
      this.scene.remove(this.selectionHelper);
      this.selectionHelper = null;
    }
    const mesh = selectedId ? this.meshes.get(selectedId) : undefined;
    if (!mesh) return;
    this.selectionHelper = new THREE.BoxHelper(mesh, 0x3b7ded);
    this.scene.add(this.selectionHelper);
  }

  private updatePointer(event: PointerEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private pickObjectId(): string | null {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hit = this.raycaster.intersectObjects([...this.meshes.values()], false)[0];
    return hit ? hit.object.name : null;
  }

  private readonly handlePointerDown = (event: PointerEvent): void => {
    this.updatePointer(event);
    const id = this.pickObjectId();
    this.interactions.onSelect?.(id);
    if (id) {
      this.draggingId = id;
      this.controls.enabled = false;
    }
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (!this.draggingId) return;
    this.updatePointer(event);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const point = new THREE.Vector3();
    if (this.raycaster.ray.intersectPlane(this.dragPlane, point)) {
      this.interactions.onMove?.(this.draggingId, point.x, point.z);
    }
  };

  private readonly handlePointerUp = (): void => {
    this.draggingId = null;
    this.controls.enabled = true;
  };
}
