// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

// Dependency direction: app / providers / navigation / bootstrap  ->  modules  ->  shared, core
// core and shared never import upward; shared never imports core. See "Frontend architecture" in AGENTS.md.
const deepModuleImport = {
  group: ['@/modules/*/*', '**/modules/*/*'],
  message: 'Import a module only through its public index.ts, e.g. "@/modules/PriceApproval".',
};
const appShell = ['@/app/**', '@/providers/**', '@/navigation/**', '@/bootstrap/**'];

const restrict = (...patterns) => ({
  'no-restricted-imports': ['error', { patterns: [deepModuleImport, ...patterns] }],
});

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', '.expo/*'],
  },
  {
    settings: {
      'import/resolver': {
        // Understands the "@/..." aliases from tsconfig.json.
        typescript: { project: './tsconfig.json' },
      },
    },
    rules: {
      'import/no-cycle': 'error',
      ...restrict(),
    },
  },
  {
    files: ['src/core/**'],
    rules: restrict({
      group: ['@/shared/**', '@/modules/**', ...appShell],
      message: 'core is the lowest layer: it must not import shared, modules, or the app shell.',
    }),
  },
  {
    files: ['src/shared/**'],
    rules: restrict({
      group: ['@/core/**', '@/modules/**', ...appShell],
      message: 'shared is reusable UI/utilities: it must not import core, modules, or the app shell.',
    }),
  },
  {
    files: ['src/modules/**'],
    rules: restrict({
      group: appShell,
      message: 'Modules must not import the app shell. The shell imports modules, not the reverse.',
    }),
  },
]);
