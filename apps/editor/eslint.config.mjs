import { createConfigForNuxt } from '@nuxt/eslint-config/flat';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import baseConfig from '../../eslint.config.mjs';

export default createConfigForNuxt({
  features: {
    typescript: true,
  },
})
  .prepend(...baseConfig)
  .append(
    {
      files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx', '**/*.vue'],
      rules: {
        'vue/multi-word-component-names': 'off',
        'vue/require-default-prop': 'off',
        'vue/max-attributes-per-line': 'off',
        'vue/singleline-html-element-content-newline': 'off',
        'vue/html-self-closing': 'off',
        // Static factory classes (ShapeFactory, ThreeMeshFactory, TextureFactory) are
        // an intentional OOP pattern here, not an accidental namespace-as-class.
        '@typescript-eslint/no-extraneous-class': 'off',
      },
    },
    {
      ignores: ['.nuxt/**', '.output/**', 'node_modules', '**/*.d.ts', '**/*.vue.js'],
    },
    // Must stay last: re-disables any stylistic rules re-enabled by Nuxt's own
    // (unicorn/vue) presets above, so Prettier owns formatting.
    {
      ...prettierRecommended,
      rules: {
        ...prettierRecommended.rules,
        'prettier/prettier': 'error',
      },
    },
  );
