<script setup lang="ts">
import { computed, useId } from 'vue';
import type { UiSize } from '../../types';

const props = withDefaults(
  defineProps<{
    modelValue?: string | number;
    label?: string;
    hint?: string;
    error?: string;
    placeholder?: string;
    type?: 'text' | 'email' | 'password' | 'search' | 'number' | 'tel' | 'url';
    size?: UiSize;
    disabled?: boolean;
    readonly?: boolean;
    required?: boolean;
    id?: string;
  }>(),
  {
    modelValue: '',
    type: 'text',
    size: 'md',
    disabled: false,
    readonly: false,
    required: false,
  }
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
  focus: [event: FocusEvent];
  blur: [event: FocusEvent];
}>();

const generatedId = useId();
const inputId = computed(() => props.id ?? `ui-input-${generatedId}`);
const messageId = computed(() => `${inputId.value}-message`);
const message = computed(() => props.error || props.hint);
const hasError = computed(() => Boolean(props.error));

function onInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).value);
}
</script>

<template>
  <div class="ui-input" :class="[`ui-input--${size}`, { 'ui-input--invalid': hasError }]">
    <label v-if="label" class="ui-input__label" :for="inputId">
      {{ label }}
      <span v-if="required" class="ui-input__required" aria-hidden="true">*</span>
    </label>

    <div class="ui-input__field">
      <span v-if="$slots.leading" class="ui-input__affix"><slot name="leading" /></span>
      <input
        :id="inputId"
        class="ui-input__control"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :aria-invalid="hasError || undefined"
        :aria-describedby="message ? messageId : undefined"
        @input="onInput"
        @focus="emit('focus', $event)"
        @blur="emit('blur', $event)"
      />
      <span v-if="$slots.trailing" class="ui-input__affix"><slot name="trailing" /></span>
    </div>

    <p v-if="message" :id="messageId" class="ui-input__message">{{ message }}</p>
  </div>
</template>

<style scoped>
.ui-input {
  display: flex;
  flex-direction: column;
  gap: var(--ui-space-1);
  font-family: var(--ui-font-family-base);
  text-align: start;
}

.ui-input__label {
  color: var(--ui-color-text);
  font-size: var(--ui-font-size-sm);
  font-weight: var(--ui-font-weight-medium);
}

.ui-input__required {
  color: var(--ui-color-danger);
}

.ui-input__field {
  display: flex;
  align-items: center;
  gap: var(--ui-space-2);
  padding-inline: var(--ui-space-3);
  background-color: var(--ui-color-surface);
  border: var(--ui-border-width) solid var(--ui-color-border-strong);
  border-radius: var(--ui-radius-md);
  transition:
    border-color var(--ui-duration-fast) var(--ui-easing-standard),
    box-shadow var(--ui-duration-fast) var(--ui-easing-standard);
}

.ui-input__field:focus-within {
  border-color: var(--ui-color-primary);
  box-shadow: 0 0 0 var(--ui-focus-ring-width) var(--ui-color-focus-ring);
}

.ui-input--sm .ui-input__field {
  height: var(--ui-control-height-sm);
}

.ui-input--md .ui-input__field {
  height: var(--ui-control-height-md);
}

.ui-input--lg .ui-input__field {
  height: var(--ui-control-height-lg);
}

.ui-input--invalid .ui-input__field {
  border-color: var(--ui-color-danger);
}

.ui-input--invalid .ui-input__field:focus-within {
  box-shadow: 0 0 0 var(--ui-focus-ring-width) rgb(239 68 68 / 30%);
}

.ui-input__control {
  flex: 1;
  min-width: 0;
  padding: 0;
  background: transparent;
  border: none;
  outline: none;
  color: var(--ui-color-text);
  font-size: var(--ui-font-size-md);
}

.ui-input--sm .ui-input__control {
  font-size: var(--ui-font-size-sm);
}

.ui-input--lg .ui-input__control {
  font-size: var(--ui-font-size-lg);
}

.ui-input__control::placeholder {
  color: var(--ui-color-text-muted);
}

.ui-input__control:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.ui-input__affix {
  display: inline-flex;
  align-items: center;
  color: var(--ui-color-text-muted);
}

.ui-input__message {
  margin: 0;
  color: var(--ui-color-text-muted);
  font-size: var(--ui-font-size-xs);
}

.ui-input--invalid .ui-input__message {
  color: var(--ui-color-danger);
}
</style>
