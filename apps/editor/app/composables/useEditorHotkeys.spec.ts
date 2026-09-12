import { mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createEditorDocumentContext } from './useEditorDocument';
import { useEditorHotkeys } from './useEditorHotkeys';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useEditorHotkeys', () => {
  it('accepts the provider context so hotkeys work in the same setup as createEditorDocumentContext', () => {
    const Harness = defineComponent({
      setup() {
        const ctx = createEditorDocumentContext();
        // Must not throw: inject() cannot see provide() from the same component.
        expect(() => useEditorHotkeys(ctx)).not.toThrow();
        return () => h('div');
      },
    });
    mount(Harness);
  });

  it('throws when called without context and without an ancestor provider', () => {
    const Harness = defineComponent({
      setup() {
        expect(() => useEditorHotkeys()).toThrow(/createEditorDocumentContext/);
        return () => h('div');
      },
    });
    mount(Harness);
  });
});
