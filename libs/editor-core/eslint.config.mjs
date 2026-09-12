import prettierRecommended from 'eslint-plugin-prettier/recommended';
import baseConfig from '../../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      // Static factory classes (ShapeFactory) are an intentional OOP pattern.
      '@typescript-eslint/no-extraneous-class': 'off',
    },
  },
  {
    ...prettierRecommended,
    rules: {
      ...prettierRecommended.rules,
      'prettier/prettier': 'error',
    },
  },
];
