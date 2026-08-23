import './styles/index.css';

export { default as UiButton } from './components/UiButton/UiButton.vue';
export { default as UiInput } from './components/UiInput/UiInput.vue';
export { default as UiModal } from './components/UiModal/UiModal.vue';
export { default as UiText } from './components/UiText/UiText.vue';

export { useTheme } from './composables/useTheme';

export * from './tokens';

export type { UiSize, UiTheme } from './types';
export type { UiButtonVariant } from './components/UiButton/types';
export type { UiTextTone, UiTextVariant, UiTextWeight } from './components/UiText/types';
