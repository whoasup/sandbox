// Side-effect import so the library's own build (`dist/index.css`) bundles
// Tailwind + the design tokens alongside each component's compiled styles,
// matching what `@sandbox/ui-kit/styles.css` resolves to for consumers that
// don't use the `@sandbox/source` dev condition (see `package.json`).
import './styles/index.css';

export { default as UiButton } from './components/UiButton/UiButton.vue';
export * from './components/UiButton/types';

export { default as UiText } from './components/UiText/UiText.vue';
export * from './components/UiText/types';

export { default as UiToggleGroup } from './components/UiToggleGroup/UiToggleGroup.vue';
export * from './components/UiToggleGroup/types';

export { default as UiShapeIcon } from './components/UiShapeIcon/UiShapeIcon.vue';

export { default as UiTextureSwatch } from './components/UiTextureSwatch/UiTextureSwatch.vue';

export { default as UiThemeSwitcher } from './components/UiThemeSwitcher/UiThemeSwitcher.vue';
export * from './components/UiThemeSwitcher/types';

export * from './composables/useTheme';

export * from './helpers';
export * from './shapes';
export * from './textures';
export * from './tokens';
export * from './utils';
