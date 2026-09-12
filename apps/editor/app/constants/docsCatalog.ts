export interface DocsNavItem {
  to: string;
  label: string;
}

export const DOCS_NAV: readonly DocsNavItem[] = [
  { to: '/docs', label: 'Обзор' },
  { to: '/docs/foundations', label: 'Foundations' },
  { to: '/docs/components', label: 'Компоненты' },
  { to: '/docs/storybook', label: 'Storybook' },
];

export interface DocsPropRow {
  name: string;
  type: string;
  defaultValue?: string;
  description: string;
}

export interface DocsComponentMeta {
  slug: string;
  name: string;
  summary: string;
  props: DocsPropRow[];
}

export const DOCS_COMPONENTS: readonly DocsComponentMeta[] = [
  {
    slug: 'ui-button',
    name: 'UiButton',
    summary: 'Кнопка с вариантами primary / secondary / ghost и размерами.',
    props: [
      {
        name: 'variant',
        type: "'primary' | 'secondary' | 'ghost'",
        defaultValue: "'primary'",
        description: 'Визуальный стиль',
      },
      { name: 'size', type: "'sm' | 'md' | 'lg'", defaultValue: "'md'", description: 'Размер' },
      {
        name: 'disabled',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Отключает взаимодействие',
      },
      {
        name: 'pressed',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Состояние нажатия / toggle',
      },
    ],
  },
  {
    slug: 'ui-text',
    name: 'UiText',
    summary: 'Типографический примитив с полиморфным тегом `as`.',
    props: [
      {
        name: 'as',
        type: 'TextAs',
        defaultValue: "'p'",
        description: 'HTML-тег корневого элемента',
      },
      { name: 'size', type: 'TextSize', defaultValue: "'md'", description: 'Кегль' },
      {
        name: 'weight',
        type: 'TextWeight',
        defaultValue: "'regular'",
        description: 'Насыщенность',
      },
      { name: 'tone', type: 'TextTone', defaultValue: "'default'", description: 'Цветовой тон' },
    ],
  },
  {
    slug: 'ui-toggle-group',
    name: 'UiToggleGroup',
    summary: 'Сегментированный контроль (режимы редактора, тема и т.п.).',
    props: [
      { name: 'modelValue', type: 'TValue', description: 'Выбранное значение (v-model)' },
      { name: 'options', type: 'ToggleOption<TValue>[]', description: 'Список опций' },
      { name: 'size', type: "'sm' | 'md'", defaultValue: "'md'", description: 'Размер' },
      { name: 'disabled', type: 'boolean', defaultValue: 'false', description: 'Блокирует группу' },
    ],
  },
  {
    slug: 'ui-shape-icon',
    name: 'UiShapeIcon',
    summary: 'SVG-иконка примитива из `SHAPE_CATALOG`.',
    props: [
      { name: 'kind', type: 'ShapeKind', description: 'Тип фигуры' },
      { name: 'size', type: 'number', defaultValue: '24', description: 'Размер в px' },
    ],
  },
  {
    slug: 'ui-texture-swatch',
    name: 'UiTextureSwatch',
    summary: 'Превью procedural-текстуры поверхности.',
    props: [
      { name: 'surface', type: 'SurfaceKind', description: 'wood / fabric / stone' },
      { name: 'size', type: 'number', defaultValue: '40', description: 'Размер swatch' },
      { name: 'selected', type: 'boolean', defaultValue: 'false', description: 'Подсветка выбора' },
    ],
  },
  {
    slug: 'ui-theme-switcher',
    name: 'UiThemeSwitcher',
    summary: 'Переключатель light / dark / system (нужен `createThemeContext`).',
    props: [
      { name: 'size', type: "'sm' | 'md'", defaultValue: "'md'", description: 'Размер тоггла' },
      { name: 'labels', type: 'ThemeSwitcherLabels', description: 'Подписи сегментов' },
    ],
  },
];

export function getDocsComponent(slug: string): DocsComponentMeta | undefined {
  return DOCS_COMPONENTS.find((entry) => entry.slug === slug);
}
