import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { ExportService } from '../core/export/ExportService';
import { SceneDocument } from '@sandbox/editor-core';
import EditorExportMenu from './EditorExportMenu.vue';

describe('EditorExportMenu', () => {
  it('invokes the correct exporter for each menu item', async () => {
    const doc = new SceneDocument();
    const service = new ExportService({
      getFloor: async () => ({
        projectName: 'Тест',
        floorName: 'Этаж 1',
        snapshot: doc.toSnapshot(),
      }),
    });
    const downloadPng = vi.spyOn(service, 'downloadPng').mockResolvedValue();
    const downloadSvg = vi.spyOn(service, 'downloadSvg').mockResolvedValue();
    const downloadGltf = vi.spyOn(service, 'downloadGltf').mockResolvedValue();

    const wrapper = mount(EditorExportMenu, {
      props: {
        exportService: service,
        projectId: 'proj_1',
        floorId: 'floor_1',
      },
    });

    await wrapper.get('[data-testid="export-menu-trigger"]').trigger('click');
    await wrapper.get('[data-testid="export-png"]').trigger('click');
    expect(downloadPng).toHaveBeenCalledWith({ projectId: 'proj_1', floorId: 'floor_1' });

    await wrapper.get('[data-testid="export-menu-trigger"]').trigger('click');
    await wrapper.get('[data-testid="export-svg"]').trigger('click');
    expect(downloadSvg).toHaveBeenCalledWith({ projectId: 'proj_1', floorId: 'floor_1' });

    await wrapper.get('[data-testid="export-menu-trigger"]').trigger('click');
    await wrapper.get('[data-testid="export-gltf"]').trigger('click');
    expect(downloadGltf).toHaveBeenCalledWith({ projectId: 'proj_1', floorId: 'floor_1' });
  });

  it('emits exportJson for Проект JSON…', async () => {
    const service = new ExportService({
      getFloor: async () => null,
    });
    const wrapper = mount(EditorExportMenu, {
      props: {
        exportService: service,
        projectId: 'proj_1',
        floorId: 'floor_1',
      },
    });

    await wrapper.get('[data-testid="export-menu-trigger"]').trigger('click');
    await wrapper.get('[data-testid="export-json"]').trigger('click');
    expect(wrapper.emitted('exportJson')).toHaveLength(1);
  });

  it('closes the menu on outside pointerdown', async () => {
    const service = new ExportService({
      getFloor: async () => null,
    });
    const wrapper = mount(EditorExportMenu, {
      props: {
        exportService: service,
        projectId: 'proj_1',
        floorId: 'floor_1',
      },
      attachTo: document.body,
    });

    await wrapper.get('[data-testid="export-menu-trigger"]').trigger('click');
    expect(wrapper.find('[data-testid="export-menu-panel"]').exists()).toBe(true);

    document.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-testid="export-menu-panel"]').exists()).toBe(false);

    wrapper.unmount();
  });
});
