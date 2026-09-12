# Epic 13 — Scene export (PNG / SVG / glTF)

Status: **planned**  
Branch: `epic/13-export`  
Depends on: Epic 11, Epic 12  
Owners: `apps/editor`

Parent: [docs/roadmap.md](../roadmap.md)

## 1. Goals

1. Export the **active floor** as:
   - **PNG** — raster of the 3D viewport (or offscreen three.js capture)
   - **SVG** — 2D floor-plan vector of the current floor
   - **glTF** — 3D mesh scene (walls, openings, primitives, furniture,
     stairs)
2. Expose a single **Экспорт** menu in the editor (and optionally a
   one-click export from the project library for the last-opened floor).
3. Keep Epic 05 **JSON project** export as the archival format — link to
   it from the same menu, do not reimplement.

## 2. User stories

- As a user, I export a PNG screenshot of my 3D view to share a quick
  preview.
- As a user, I download an SVG plan of the current floor for markup
  elsewhere.
- As a user, I export glTF including furniture and stairs for use in
  another 3D tool.

## 3. Domain / pipeline

```ts
interface ExportService {
  exportPng(opts: { projectId: string; floorId: string }): Promise<Blob>;
  exportSvg(opts: { projectId: string; floorId: string }): Promise<Blob>;
  exportGltf(opts: { projectId: string; floorId: string }): Promise<Blob>;
}
```

- **PNG**: read pixels from the live WebGL canvas (`preserveDrawingBuffer`
  if required) or render once offscreen with `ThreeRenderer` / a thin
  capture helper. Filename: `{projectName}-{floorName}.png`.
- **SVG**: serialize the current 2D plan (walls, openings, rooms fills,
  shapes, furniture footprints, stairs symbols, grid optional). Prefer
  building from the document model, not scraping the live DOM, so export
  works headlessly in tests.
- **glTF**: use three.js `GLTFExporter` on a scene built from the same
  mesh factories as the editor (or a dedicated export scene builder).
  One **active floor** only.
- Trigger download via `URL.createObjectURL` + `<a download>`.
- Errors: toast / inline message; never leave a corrupted partial file.

### Snapshot note

No schema bump required unless export metadata is stored (it is not).
Depends on 11+12 so exported scenes include furniture and stairs.

## 4. UI

- Editor header / toolbar menu **Экспорт** with items: PNG, SVG, glTF,
  «Проект JSON…» (delegates to Epic 05).
- Disable items while document is loading; show brief busy state during
  export.
- Library page may offer «Экспорт PNG» only if cheap; otherwise editor-
  only is enough for DoD.

## 5. Files to touch (expected)

- `apps/editor/app/core/export/ExportService.ts` (+ svg builder, gltf
  builder, png capture)
- Specs with fake document fixtures (SVG string contains wall paths;
  glTF JSON/`Blob` non-empty)
- `EditorExportMenu.vue`
- Wire `preserveDrawingBuffer` / capture path in `ThreeRenderer` if
  needed
- README note on export formats

## 6. Tests

- SVG builder: closed square room → SVG with expected group counts /
  tags
- glTF builder: minimal floor with one wall + one chair → parsable glTF
  (or non-empty Blob + magic header)
- PNG: mock canvas `toBlob` / offscreen path returns Blob
- Menu invokes the correct exporter (component test)

## 7. Definition of Done

- [ ] PNG, SVG, and glTF download for the active floor
- [ ] Furniture and stairs appear in SVG footprints / glTF meshes
- [ ] JSON project export remains available via the same menu
- [ ] Unit tests cover SVG + glTF builders without a real browser download
- [ ] Green lint / typecheck / test / build

## 8. Out of scope

- PDF print packs with dimensions/annotations
- Cloud share links
- Multi-floor batch glTF in one file
- Video / turntable capture
- High-DPI print profiles / paper sizes
