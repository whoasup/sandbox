<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue';

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    title?: string;
    description?: string;
    size?: 'sm' | 'md' | 'lg' | 'full';
    closeOnOverlay?: boolean;
    closeOnEscape?: boolean;
    hideCloseButton?: boolean;
  }>(),
  {
    size: 'md',
    closeOnOverlay: true,
    closeOnEscape: true,
    hideCloseButton: false,
  }
);

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  close: [];
  open: [];
}>();

const uid = useId();
const titleId = computed(() => `ui-modal-title-${uid}`);
const descriptionId = computed(() => `ui-modal-description-${uid}`);

/** Teleport must stay disabled until mounted, otherwise SSR markup cannot hydrate. */
const isMounted = ref(false);
const dialogRef = ref<HTMLElement | null>(null);
let previouslyFocused: HTMLElement | null = null;

function close() {
  emit('update:modelValue', false);
  emit('close');
}

function onOverlayClick() {
  if (props.closeOnOverlay) close();
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.closeOnEscape) {
    event.stopPropagation();
    close();
    return;
  }
  if (event.key === 'Tab') trapFocus(event);
}

function focusableElements(): HTMLElement[] {
  if (!dialogRef.value) return [];
  return Array.from(
    dialogRef.value.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  );
}

function trapFocus(event: KeyboardEvent) {
  const elements = focusableElements();
  if (elements.length === 0) return;

  const first = elements[0];
  const last = elements[elements.length - 1];
  const active = document.activeElement;

  if (event.shiftKey && active === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
}

watch(
  () => props.modelValue,
  async (isOpen) => {
    if (typeof document === 'undefined') return;

    if (isOpen) {
      previouslyFocused = document.activeElement as HTMLElement | null;
      document.body.style.overflow = 'hidden';
      emit('open');
      await nextTick();
      (focusableElements()[0] ?? dialogRef.value)?.focus();
    } else {
      document.body.style.overflow = '';
      previouslyFocused?.focus();
      previouslyFocused = null;
    }
  }
);

onMounted(() => {
  isMounted.value = true;
});

onBeforeUnmount(() => {
  if (typeof document !== 'undefined') document.body.style.overflow = '';
});
</script>

<template>
  <Teleport to="body" :disabled="!isMounted">
    <Transition name="ui-modal">
      <div
        v-if="modelValue && isMounted"
        class="ui-modal"
        @keydown="onKeydown"
      >
        <div class="ui-modal__overlay" @click="onOverlayClick" />

        <div
          ref="dialogRef"
          class="ui-modal__dialog"
          :class="`ui-modal__dialog--${size}`"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="title ? titleId : undefined"
          :aria-describedby="description ? descriptionId : undefined"
          tabindex="-1"
        >
          <header v-if="title || $slots.header || !hideCloseButton" class="ui-modal__header">
            <div class="ui-modal__heading">
              <slot name="header">
                <h2 v-if="title" :id="titleId" class="ui-modal__title">{{ title }}</h2>
                <p v-if="description" :id="descriptionId" class="ui-modal__description">
                  {{ description }}
                </p>
              </slot>
            </div>
            <button
              v-if="!hideCloseButton"
              class="ui-modal__close"
              type="button"
              aria-label="Close dialog"
              @click="close"
            >
              &#10005;
            </button>
          </header>

          <div class="ui-modal__body">
            <slot />
          </div>

          <footer v-if="$slots.footer" class="ui-modal__footer">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.ui-modal {
  position: fixed;
  inset: 0;
  z-index: var(--ui-z-modal);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--ui-space-4);
  font-family: var(--ui-font-family-base);
}

.ui-modal__overlay {
  position: absolute;
  inset: 0;
  z-index: var(--ui-z-overlay);
  background-color: var(--ui-color-overlay);
  backdrop-filter: blur(2px);
}

.ui-modal__dialog {
  position: relative;
  z-index: var(--ui-z-modal);
  display: flex;
  flex-direction: column;
  width: 100%;
  max-height: calc(100vh - var(--ui-space-7));
  background-color: var(--ui-color-surface-raised);
  border: var(--ui-border-width) solid var(--ui-color-border);
  border-radius: var(--ui-radius-lg);
  box-shadow: var(--ui-shadow-lg);
  outline: none;
}

.ui-modal__dialog--sm {
  max-width: 22rem;
}

.ui-modal__dialog--md {
  max-width: 32rem;
}

.ui-modal__dialog--lg {
  max-width: 48rem;
}

.ui-modal__dialog--full {
  max-width: none;
  height: 100%;
}

.ui-modal__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--ui-space-4);
  padding: var(--ui-space-5) var(--ui-space-5) var(--ui-space-3);
}

.ui-modal__heading {
  display: flex;
  flex-direction: column;
  gap: var(--ui-space-1);
}

.ui-modal__title {
  margin: 0;
  color: var(--ui-color-text);
  font-size: var(--ui-font-size-xl);
  font-weight: var(--ui-font-weight-semibold);
  line-height: var(--ui-line-height-tight);
}

.ui-modal__description {
  margin: 0;
  color: var(--ui-color-text-muted);
  font-size: var(--ui-font-size-sm);
}

.ui-modal__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 2rem;
  height: 2rem;
  background: transparent;
  border: none;
  border-radius: var(--ui-radius-sm);
  color: var(--ui-color-text-muted);
  cursor: pointer;
  transition: background-color var(--ui-duration-fast) var(--ui-easing-standard);
}

.ui-modal__close:hover {
  background-color: var(--ui-color-surface-muted);
  color: var(--ui-color-text);
}

.ui-modal__close:focus-visible {
  outline: none;
  box-shadow: 0 0 0 var(--ui-focus-ring-width) var(--ui-color-focus-ring);
}

.ui-modal__body {
  flex: 1;
  overflow-y: auto;
  padding: 0 var(--ui-space-5) var(--ui-space-5);
  color: var(--ui-color-text);
}

.ui-modal__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--ui-space-2);
  padding: var(--ui-space-3) var(--ui-space-5) var(--ui-space-5);
  border-top: var(--ui-border-width) solid var(--ui-color-border);
}

.ui-modal-enter-active,
.ui-modal-leave-active {
  transition: opacity var(--ui-duration-base) var(--ui-easing-standard);
}

.ui-modal-enter-active .ui-modal__dialog,
.ui-modal-leave-active .ui-modal__dialog {
  transition: transform var(--ui-duration-base) var(--ui-easing-standard);
}

.ui-modal-enter-from,
.ui-modal-leave-to {
  opacity: 0;
}

.ui-modal-enter-from .ui-modal__dialog,
.ui-modal-leave-to .ui-modal__dialog {
  transform: translateY(12px) scale(0.98);
}
</style>
