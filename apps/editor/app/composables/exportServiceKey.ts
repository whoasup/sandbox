import type { InjectionKey, ShallowRef } from 'vue';
import type { ExportService } from '../core/export/ExportService';

export const exportServiceKey: InjectionKey<ShallowRef<ExportService | null>> =
  Symbol('exportService');
