<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';

const SPLIT_RATIO_KEY = 'sandbox:splitRatio';
const MIN_RATIO = 0.25;
const MAX_RATIO = 0.75;
const DEFAULT_RATIO = 0.5;

const props = defineProps<{
  /** When false, skip pointer listeners (pane unmounted). */
  active?: boolean;
}>();

const emit = defineEmits<{
  ratioChange: [ratio: number];
}>();

const ratio = ref(DEFAULT_RATIO);
const dragging = ref(false);
const rootRef = ref<HTMLElement | null>(null);

function clampRatio(value: number): number {
  return Math.min(MAX_RATIO, Math.max(MIN_RATIO, value));
}

function loadRatio(): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(SPLIT_RATIO_KEY);
    const parsed = raw ? Number(raw) : NaN;
    if (Number.isFinite(parsed)) ratio.value = clampRatio(parsed);
  } catch {
    // ignore storage errors
  }
}

function persistRatio(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SPLIT_RATIO_KEY, String(ratio.value));
  } catch {
    // ignore
  }
  emit('ratioChange', ratio.value);
}

function setRatioFromClientX(clientX: number): void {
  const el = rootRef.value;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  if (rect.width <= 0) return;
  ratio.value = clampRatio((clientX - rect.left) / rect.width);
}

function onPointerDown(event: PointerEvent): void {
  dragging.value = true;
  const target = event.currentTarget as HTMLElement;
  if (typeof target.setPointerCapture === 'function') {
    try {
      target.setPointerCapture(event.pointerId);
    } catch {
      // jsdom / unsupported
    }
  }
  setRatioFromClientX(event.clientX);
}

function onPointerMove(event: PointerEvent): void {
  if (!dragging.value) return;
  setRatioFromClientX(event.clientX);
}

function onPointerUp(event: PointerEvent): void {
  if (!dragging.value) return;
  dragging.value = false;
  const target = event.currentTarget as HTMLElement;
  if (typeof target.releasePointerCapture === 'function') {
    try {
      target.releasePointerCapture(event.pointerId);
    } catch {
      // ignore
    }
  }
  persistRatio();
}

function onHandleKeydown(event: KeyboardEvent): void {
  const step = event.shiftKey ? 0.05 : 0.02;
  if (event.key === 'ArrowLeft') {
    event.preventDefault();
    ratio.value = clampRatio(ratio.value - step);
    persistRatio();
  } else if (event.key === 'ArrowRight') {
    event.preventDefault();
    ratio.value = clampRatio(ratio.value + step);
    persistRatio();
  }
}

onMounted(() => {
  loadRatio();
});

watch(
  () => props.active,
  (active) => {
    if (active === false) dragging.value = false;
  },
);

onUnmounted(() => {
  dragging.value = false;
});
</script>

<template>
  <div
    ref="rootRef"
    class="editor-split-pane flex h-full min-h-0 w-full min-w-0"
    data-testid="editor-split-pane"
    :class="{ 'select-none': dragging }"
  >
    <div
      class="relative min-h-0 min-w-0 overflow-hidden"
      :style="{ flexBasis: `${ratio * 100}%`, flexGrow: 0, flexShrink: 0 }"
      data-testid="editor-split-pane-2d"
    >
      <slot name="left" />
    </div>
    <div
      class="relative z-10 flex w-2 shrink-0 cursor-col-resize items-stretch justify-center bg-border hover:bg-text-muted/50 focus-within:bg-text-muted/50"
      role="separator"
      aria-orientation="vertical"
      aria-valuemin="25"
      aria-valuemax="75"
      :aria-valuenow="Math.round(ratio * 100)"
      tabindex="0"
      data-testid="editor-split-handle"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @keydown="onHandleKeydown"
    >
      <span class="sr-only">Изменить ширину панелей</span>
    </div>
    <div class="relative min-h-0 min-w-0 flex-1 overflow-hidden" data-testid="editor-split-pane-3d">
      <slot name="right" />
    </div>
  </div>
</template>
