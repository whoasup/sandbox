import { onMounted, onUnmounted } from 'vue';
import { useEditorDocument, type EditorDocumentContext } from './useEditorDocument';

/**
 * Editor keyboard shortcuts when the page is focused (not inside an input).
 * Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z, Delete, arrows, Ctrl+C / Ctrl+V.
 *
 * Pass `ctx` when registering from the same component that called
 * `createEditorDocumentContext()` — Vue inject only reaches descendants.
 */
export function useEditorHotkeys(ctx?: EditorDocumentContext): void {
  const { undo, redo, removeSelected, nudgeSelected, copySelected, pasteClipboard, settings } =
    ctx ?? useEditorDocument();

  const onKeyDown = (event: KeyboardEvent): void => {
    const target = event.target as HTMLElement | null;
    const tag = target?.tagName?.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || target?.isContentEditable) return;

    const mod = event.ctrlKey || event.metaKey;
    const key = event.key.toLowerCase();

    if (mod && key === 'z' && !event.shiftKey) {
      event.preventDefault();
      undo();
      return;
    }
    if (mod && (key === 'y' || (key === 'z' && event.shiftKey))) {
      event.preventDefault();
      redo();
      return;
    }
    if (mod && key === 'c') {
      event.preventDefault();
      copySelected();
      return;
    }
    if (mod && key === 'v') {
      event.preventDefault();
      pasteClipboard();
      return;
    }
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      removeSelected();
      return;
    }

    const step = settings.value.field.gridStep || 0.5;
    const amount = event.shiftKey ? step * 4 : step;
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      nudgeSelected(-amount, 0);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      nudgeSelected(amount, 0);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      nudgeSelected(0, -amount);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      nudgeSelected(0, amount);
    }
  };

  onMounted(() => {
    window.addEventListener('keydown', onKeyDown);
  });
  onUnmounted(() => {
    window.removeEventListener('keydown', onKeyDown);
  });
}
