// Pre-commit lint config for staged files.
//
// ESLint uses flat config, which is resolved relative to the process cwd
// (no eslintrc-style upward cascading). Nx therefore gives every app/lib its
// own eslint.config.mjs and runs `eslint .` with `cwd` set to that project's
// folder (see apps/*/eslint.config.mjs, libs/*/eslint.config.mjs). To reuse
// those exact per-project rules (Nuxt/Vue overrides, Storybook rules, etc.)
// on staged files, each staged file is linted with `--config` pointing at
// its owning project's config file instead of relying on cwd auto-discovery.
//
// Stylelint keeps a single root-level .stylelintrc.json and already walks up
// the directory tree from each linted file, so it can be run as-is.
//
// Formatting is owned by Prettier. For `.ts`/`.js`/`.vue` files it runs as
// part of `eslint --fix` (via eslint-plugin-prettier, wired into every
// eslint.config.mjs). Plain `.css` files aren't touched by ESLint at all, so
// they need an explicit `prettier --write` pass.

import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const workspaceRoot = process.cwd();

function discoverProjectEslintConfigs() {
  const projects = [];

  for (const groupDir of ['apps', 'libs']) {
    const groupPath = join(workspaceRoot, groupDir);
    if (!existsSync(groupPath)) continue;

    for (const projectName of readdirSync(groupPath, { withFileTypes: true })) {
      if (!projectName.isDirectory()) continue;

      const projectDir = `${groupDir}/${projectName.name}`;
      const configPath = join(workspaceRoot, projectDir, 'eslint.config.mjs');
      if (existsSync(configPath)) {
        projects.push({ projectDir, configPath });
      }
    }
  }

  return projects;
}

const quote = (files) => files.map((file) => `"${file}"`).join(' ');

const config = {
  // Root-level TS/JS files that don't belong to any app/lib (e.g. eslint.config.mjs,
  // vitest.config.ts). `*` (single star) never crosses path separators, so this
  // only ever matches files that live directly at the workspace root.
  '*.{js,jsx,ts,tsx,mjs,cjs}': (files) => `eslint --fix ${quote(files)}`,

  // Plain CSS files: Prettier formats, Stylelint checks code quality.
  '**/*.css': (files) => [`prettier --write ${quote(files)}`, `stylelint --fix ${quote(files)}`],

  // Vue SFC `<style>` blocks: Stylelint only (formatting already happens via
  // the per-project `eslint --fix` entries registered below).
  '**/*.vue': (files) => `stylelint --fix ${quote(files)}`,
};

for (const { projectDir, configPath } of discoverProjectEslintConfigs()) {
  config[`${projectDir}/**/*.{js,jsx,ts,tsx,vue}`] = (files) =>
    `eslint --config "${configPath}" --fix ${quote(files)}`;
}

export default config;
