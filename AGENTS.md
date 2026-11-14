## Superapp

This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Frontend architecture (modular, feature-based)

Mirrors the Laravel modular monolith backend: one folder per business module, one shared infrastructure.

```
src/app/         routes only: thin re-exports of screens/layouts (no logic)
src/providers/   app-wide React providers        src/bootstrap/  splash/startup
src/navigation/  app shell: module registry, home launcher, root navigator, tabs
src/modules/<Name>/  business module: api/ components/ hooks/ screens/ navigation/ store/ types/ index.ts
src/core/        infrastructure: api (single HTTP client), auth, storage, permissions, config, errors
src/shared/      reusable UI + utils: components, hooks, theme, types
```

- **Dependency direction** (enforced by `eslint.config.js`): `app`/`providers`/`navigation`/`bootstrap` → `modules` → `shared`, `core`. `core` imports nothing else in `src`; `shared` never imports `core`/`modules`; modules never import the shell. `import/no-cycle` is on.
- **Module boundary**: other code imports a module only via `@/modules/<Name>` (its `index.ts`). No deep imports. Inside a module use relative imports. Export only what others need (manifest, layout, screens, public types).
- **One HTTP client**: `core/api`. A module owns its endpoints in `<name>Api.ts` and its data contract in `types/`. Do not duplicate auth, token, or permission logic in a module.
- **State**: server state → TanStack Query; auth session → `core/auth` (zustand); module UI state → a small zustand store inside the module. No global store holding business state.
- **Data management**: **before a module fetches or changes data, read `docs/data-management.md`**: query keys, refresh moments, the action (mutation) pattern, offline rules, persistence policy, sign-out cleanup and the backend contract. `PriceApproval` is the reference implementation. Update the doc whenever the pattern changes.
- **Adding a module**: create `src/modules/<Name>/` with a `manifest.ts` (+ `index.ts`), register the manifest in `src/navigation/registry.ts`, and add thin route files under `src/app/(app)/<route>/`. Nothing else in the shell changes. Routes behind sign-in must live under `src/app/(app)/`. A module reached only from its own tab (such as `AiChat`) has no manifest: the tab's screen in `src/navigation/` imports it from the module's `index.ts`.
- Only put something in `shared/` when two or more modules use it. File names: kebab-case for components/hooks, camelCase for api/store/type files.
- Typed routes on Windows: Expo's generator keeps `/index` for nested index routes, so `Href` has no `/` or `/<module>`; module manifests therefore hold `route` as a plain string and the shell casts to `Href` when linking.

## Design system

**Before designing or building any screen or layout, read `docs/ui-foundation.md`**: it is the reference for tokens, components, layout rules, screen recipes, states and the done checklist. Update it whenever the system changes.

`src/shared/ui` is the Astrindo design system; import it only from `@/shared/ui`. `src/shared/components` holds the older components still used by existing screens; build new UI from `shared/ui` and migrate old screens when they are touched. The reference lives at `/design-system` (the board) and `/design-system/demo` (a screen in context), in development builds only.

- **Tokens only.** Every color, type style, radius and shadow is a named utility from `@theme` in `src/global.css`. No raw hex or arbitrary values in components. Native props that cannot take a class (icon color, placeholder color) read `src/shared/theme/tokens.ts`; `tokens.test.ts` fails if it drifts from `global.css`.
- **Values are px** in `@theme`, because rem is 14 on native and 16 on web. Exception: `--text-*--line-height` must be a unitless ratio (native multiplies it by the font size). `--spacing` is 4px, so `p-4` is 16 on every platform.
- **Component pattern.** Function components with named exports, a `NameProps` interface, variant maps as `const` objects, `clsx` for classes, `ref` as a prop (React 19), and `className` for layout only (use `variant` and `tone` for looks, since CSS order decides conflicts, not class order). One folder per component: `name/name.tsx` and `name/name.test.tsx`.
- **Class names only reach React Native primitives.** Third-party components such as `GlassView`, `expo-image` and `Animated.View` take `style`, or wrap a plain `View`. The browser will not show this bug; a native build will.
- **Fonts on native.** Text must go through `AppText`: React Native does not inherit `font-rubik` from a parent `View`, and weight comes from the font family (`font-rubik-medium`), not `font-weight`.
- **Accessibility.** Use `role` and `aria-*`, which work on web and native, and add `accessibilityState` for selected state on native. A `View` with a `role` needs `accessible` or screen readers skip it. Touch targets are at least 48: keep the visible control smaller inside a 48 press area. Status is never color only.
- **Backgrounds.** The app background is `ground` (soft lavender-gray). Cards are `surface` (white) with a thin `border border-border` gray hairline and no shadow; inputs and unselected chips are `surface` too, and `surface-gray` is only for fills inside a white card. Every screen starts with `TopAppBar` (back, centered title, action).
- **Copy.** Sentence case, short, second person, verbs on buttons, no emoji, no exclamation marks.
- **`+html.tsx`** must render `useServerDocumentContext()`'s nodes. Without them the web page gets no scripts and never hydrates.

Other commands: `npm test` (Jest), `npm run typecheck`, `npm run format`.

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
