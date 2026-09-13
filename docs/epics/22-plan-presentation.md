# Epic 22 — Plan presentation export

Status: **implemented**  
Branch: `epic/22-plan-presentation`  
Depends on: Epic 13 (export), Epic 18 (dimensions / areas)  
Owners: `apps/editor`

Parent: [docs/roadmap.md](../roadmap.md)

Raise export quality toward RoomSketcher / Sweet Home 3D “print-ready”
plans: annotated SVG/PNG, legend, a simple 360 capture, and a draught /
clean 2D style — still download-only, no PDF packs or cloud share.

## 1. Goals

1. SVG + PNG export include **wall lengths, room names/areas, and user
   dimensions** from Epic 18 when those layers are enabled.
2. Add a **legend** strip: project name, floor name, scale bar, date.
3. **360 preview**: capture an equirectangular (or 6-face cubemap
   stitched) image from the walk camera — not path-traced.
4. 2D view toggle **«Чертёж / Чистовик»**: furniture as simplified
   footprints vs richer fills (export respects the mode).

## 2. User stories

- As a user, I export SVG and open it elsewhere with room areas already
  labeled.
- As a user, I download a PNG plan with a scale bar and floor title.
- As a user, I export a 360 image from walk mode to spin in a viewer.
- As a user, I switch to «Чертёж» so the plan looks like a technical
  drawing before export.

## 3. Technical design

```ts
interface PlanExportOptions {
  projectId: string;
  floorId: string;
  style: 'clean' | 'draft';
  includeDimensions: boolean;
  includeLegend: boolean;
}
```

- Extend `SvgExportBuilder` / `PngCapture` (or a dedicated plan rasterizer
  that renders the SVG builder to canvas) to accept presentation options.
- Legend: drawn in SVG `<g>` (and mirrored for PNG). Scale bar derived from
  `SceneSettings.field.gridStep` / known meters-per-pixel.
- 360: from walk camera in `ThreeRenderer` — render cube faces or use a
  simple equirect helper; download `{project}-{floor}-360.png`. Menu item
  **«360»** under Экспорт; require 3D/walk context or spawn an offscreen
  walk camera at the current orbit target.
- Draught mode: SVG furniture paths use outline-only; hide textures /
  fills. Live 2D canvas shares the same flag via `useEditorDocument` or
  scene settings (`planStyle`).

Prefer **no schema bump** if `planStyle` is session UI only; if persisted
per floor, bump schema and migrate default `'clean'`.

## 4. UI

- Export menu: PNG, SVG, glTF, 360, Проект JSON… (Epic 13 layout).
- Scene panel or toolbar: «Чертёж / Чистовик»; toggles for include
  dimensions / legend on export (or always-on when Epic 18 layers are on).
- Busy states reuse Epic 17 short export label.

## 5. Files to touch (expected)

- `apps/editor/app/core/export/SvgExportBuilder.ts`
- `apps/editor/app/core/export/PngCapture.ts` / plan raster helper
- `apps/editor/app/core/export/ExportService.ts` — `download360`
- `apps/editor/app/components/EditorExportMenu.vue`
- `apps/editor/app/core/render/svg/*` — draught style
- `apps/editor/app/core/render/three/ThreeRenderer.ts` — 360 capture
- Specs: SVG string contains legend + room area; 360 blob non-empty
- README export section note

## 6. Tests

- SvgExportBuilder with a fixture floor includes room м² and dimension
  length text when flags are on.
- Legend group present with project/floor name.
- 360 capture returns a PNG `Blob` in unit test with a stubbed renderer.
- Draught style omits furniture fill patterns.

## 7. Definition of Done

- [x] Annotated SVG/PNG export with legend
- [x] 360 download from walk / offscreen capture
- [x] Чертёж / Чистовик affects live 2D + export
- [x] No PDF / cloud / DXF paths
- [x] Lint / typecheck / test / build green

## 8. Out of scope

- PDF print packs with multi-page annotations
- Cloud share links / hosted 360 viewers
- DXF / CAD
- Photoreal / path-traced 360
- Watermark / branding packs
