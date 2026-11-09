# Astrindo Superapp UI foundation

The reference for every screen in this app. When you are asked to design or build a layout, **start here, compose it from the parts below, and invent nothing that is not listed.** If a layout needs something the system lacks, add it to the system first (see [Extending the system](#extending-the-system)), then use it.

Sources of truth, in order:

1. `src/global.css` → every color, type style, radius, shadow and spacing token (`@theme`).
2. `src/shared/ui/` → every component. Import only from `@/shared/ui`.
3. `src/shared/theme/tokens.ts` → the same colors and sizes as numbers, for native props that cannot take a class. `tokens.test.ts` fails if it drifts from `global.css`.
4. `/design-system` (the board) and `/design-system/demo` (a screen in context), in development builds only.

## How to design a layout

1. **Name the screen type** (see [Screen recipes](#screen-recipes)): launcher, list, form, settings or detail. Start from that recipe.
2. **Pick components from the [catalog](#component-catalog).** Prefer a component over a hand-built `View`. Hand-build only a module-local composition (for example a list card), and build it from tokens.
3. **Give every screen all of its states**: loading, empty, error, offline, and stale data after a failed refresh. See [States](#states).
4. **Run the [checklist](#checklist)** before calling it done.

## Tokens

All values are px, except line heights, which are unitless ratios with the px noted beside each: react-native-css reads a line-height that arrives through `var()` (every `text-*` utility) as a multiple of the font size, so `24px` rendered as 384 on Android. `tokens.test.ts` checks each ratio still resolves to its px. `--spacing` is 4, so `p-4` is 16 on every platform. Use named utilities only. No raw hex, no arbitrary values such as `p-[13px]`.

### Color

| Token | Value | Use |
|---|---|---|
| `primary` | `#130066` | Primary actions, active states, module tiles |
| `primary-pressed` | `#0c0044` | Pressed primary |
| `on-primary` | `#ffffff` | Text and icons on `primary` |
| `primary-soft` | `#eeeafb` | Soft buttons, info cards, icon wells, `info` badge |
| `lavender` | `#c9b4ff` | Selected filter chip, pressed soft surfaces, highlights |
| `ink` | `#0b0b1a` | Headings and primary text |
| `ink-muted` | `#5b6270` | Secondary text, captions, placeholders |
| `surface` | `#ffffff` | Cards, headers, sheets, modals |
| `surface-gray` | `#f4f5f7` | Inputs, unselected chips, neutral fills |
| `border` | `#e5e7eb` | Hairlines between rows |
| `glass` | `rgba(255,255,255,0.7)` | Bottom nav surface |
| `control-off` | `#868c98` | Toggle track when off |
| `success` / `success-bg` | `#176a42` / `#e6f4ec` | Success text and fill |
| `danger` / `danger-bg` | `#b42318` / `#fde8e8` | Errors, destructive |
| `warning` / `warning-bg` | `#8a5a00` / `#fff4d6` | Warnings, waiting states |

**Background rule.** The app background is `surface` (white). Inputs and unselected chips are `surface-gray`, so they stand out on it.

The app is light only. There is no dark palette.

### Type

Always through `AppText`. Defaults for the whole app: every bold style is weight 500 (Rubik Medium; the app loads only Regular 400 and Medium 500, each as its own family: `font-rubik` and `font-rubik-medium`, because native ignores `font-weight` for custom fonts; `AppText` picks the family from the variant), and sizes sit two steps below the old scale, floored at 13 for text and 12 for labels. Bottom navigation (`label`) and the Price Approval list and detail screens were already at 13/12 and did not change size. Native text does not inherit the font from a parent `View`.

| `variant` | Size / line, weight | Use |
|---|---|---|
| `display` | 20 / 22, 500 | Marketing or splash moments only |
| `heading` | 17 / 22, 500 | Screen title |
| `title` | 16 / 20, 500 | Section title, empty-state title, stepper value |
| `module-title` | 13 / 20, 500 | Card title |
| `info-title` | 13 / 20, 500 | Title inside an `InfoCard` |
| `body` | 13 / 20, 400 | Default text |
| `body-strong` | 13 / 20, 500 | Row labels, emphasized body |
| `caption` | 13 / 20, 500 | Meta, helper text, timestamps |
| `caption-strong` | 13 / 20, 500 | Dense card titles and totals, where `module-title` is too large |
| `button` | 13 / 20, 500 | Button text (set by `Button`) |
| `label` | 12 / 16, 500 | Field labels, nav labels |

Dates and money are formatted only through `@/shared/utils/format`: `formatDate` ("1 Okt 2026"), `formatDateTime` ("1 Okt 2026 14:30") and `formatMoney` ("Rp 20,000", "Rp 20,000.50": always the Rp symbol, decimals only when present). Never format them per module.

`tone`: `ink` (default), `muted`, `primary`, `on-primary`, `success`, `danger`, `warning`.

Give a screen title `role="heading"`.

### Spacing

| Utility | px | Use |
|---|---|---|
| `p-5` / `px-5` | 20 | **Screen margin**: the side padding of every screen |
| `gap-4` | 16 | Between cards and between sections |
| `p-4` | 16 | Card padding (`p-3` inside `ModuleCard`) |
| `gap-3` | 12 | Between a control's icon and label |
| `gap-1`–`gap-2` | 4–8 | Between a title and its meta |
| `size-touch` | 48 | Minimum touch target |
| `min-h-control` / `size-control` | 56 | Buttons, inputs, list rows, icon buttons |
| `h-tabbar` | 72 | Bottom nav |
| `size-tile` | 112 | Module card tile |

`sizes.screenTopGap` (16) is the gap between the safe-area top and the first content.

### Radius and shadow

| Utility | px | Use |
|---|---|---|
| `rounded-pill` | 999 | Buttons, chips, badges, bottom nav, icon buttons |
| `rounded-xl` | 24 | Cards, list groups, screen headers (`rounded-b-xl`) |
| `rounded-lg` | 16 | Inputs, info cards, alerts, module tiles |
| `rounded-md` | 12 | Icon wells, pressable rows |
| `rounded-sm` | 8 | Skeleton blocks |

Shadows: `shadow-card` on a white card sitting on the white ground. `shadow-glass` is internal to `BottomNav`. A card inside another card gets no shadow.

## Layout rules

- **Ground and width.** Every screen is wrapped in `Screen`: `surface` (white) ground, content held to `max-w-phone` (480) and centered on wide displays.
- **Margins.** Content is inset `px-5`. Items in a stack are separated by `gap-4`. Use `gap`, not margins, for rhythm.
- **Safe area.** The screen adds it, not the component. Under the app's own header, pad the top with `useSafeAreaInsets().top + sizes.screenTopGap`. Under a native stack header, add no top inset. Above the bottom nav, pad the bottom with `useBottomNavInset()`. Elsewhere pad with `bottom`.
- **Screen header.** A `rounded-b-xl bg-surface px-5 pb-5` block holds the title, search and filters. That makes the white ground inputs and chips need.
- **Scrolling.** Use `ScrollView` for short content and `FlatList` for long or paged lists. Both take `contentContainerClassName`.
- **Class names only reach React Native primitives** (`View`, `Text`, `Pressable`, `ScrollView`, `FlatList`, `TextInput`). Third-party components (`Animated.View`, `expo-image`, `GlassView`, safe-area views) take `style`, or wrap a plain `View`. The browser hides this bug; a native build shows it.
- **`className` is for layout only** (width, flex, margin, alignment). Looks come from `variant` and `tone`. CSS order decides conflicts, not class order.

## Component catalog

All from `@/shared/ui`.

### Structure

| Component | Use it for | Key props |
|---|---|---|
| `Screen` | The ground of every screen | `children`, `className` |
| `Logo` | Brand mark. Minimum width 96 | `variant` (`dark` on light, `light` on `primary`), `width` |
| `BottomNav` | App navigation, up to 4 items. An item may carry `badge` (unread count, hidden at 0, `99+` above 99) | `items`, `activeKey`, `onChange`, `placement` |
| `useBottomNavInset()` | Bottom padding so content clears the nav | |

### Content

| Component | Use it for | Key props |
|---|---|---|
| `AppText` | All text | `variant`, `tone` |
| `ModuleCard` | A launchable module: tile, title, department, badges, meta, Open | `title`, `icon`, `department`, `badges`, `meta`, `favorite`, `onOpen`, or `loading` for the skeleton |
| `InfoCard` | A tappable highlight, such as "3 approvals waiting" | `icon`, `title`, `description`, `onPress` |
| `ListGroup` + `ListRow` | Settings and key-value rows, hairlines between | `label`, `icon`, `value`, `onPress` (adds a chevron) |
| `Badge` | Status or count. Always has a text label | `label`, `tone` (`neutral`, `info`, `success`, `danger`, `warning`), `icon` |
| `Icon` | Glyphs. Decorative unless `label` is set | `name`, `size`, `color` (a color token), `filled` |

Icon names: `home grid search bell user calendar settings building box wallet users chart truck clipboard doc chat heart bookmark share pin lock eye eye-off sliders list map cart star plus more copy download upload minus check x alert info arrow-right chevron-right`. Icons are Lucide, drawn at 24px, 1.75 stroke.

### Actions and input

| Component | Use it for | Key props |
|---|---|---|
| `Button` | Text actions | `variant` (`primary`, `secondary`, `soft`), `block`, `iconLeft`, `iconRight`, `loading`, `disabled`. Children is a string |
| `IconButton` | Icon-only actions | `icon`, `label` (required), `active` |
| `TextField` | Text input | `label`, `type` (`text`, `password`), `icon`, `help`, `error`, `trailing` |
| `Chip` / `ChipGroup` | Single-select filters | `ChipGroup`: `label`, `options`, `value`, `onChange`. An option with an `icon` becomes a department switch |
| `SegmentedControl` | Choose one of 2–4 views | `label`, `options`, `value`, `onChange` |
| `Toggle` | On/off setting | `label`, `value`, `onValueChange` |
| `ListToolbar` | Top row of a module index: search, filter, actions buttons plus the module chips. See the recipe | `search`, `onFilter`, `filterActive`, `actions`, `children` |
| `Fab` | Create button, floats bottom right. Last child of `Screen`, only with the create permission | `label`, `icon` |
| `Sheet` | Bottom sheet: filter form, action menu | `visible`, `title`, `onClose`, `footer` |
| `Stepper` | A small number, such as a quantity | `label`, `value`, `min`, `max`, `onChange` |

Button choice: `primary` is the one main action per screen. `secondary` (white with shadow) is only a subtle lift on the white ground. Prefer `soft` on white, because `secondary` nearly disappears. Buttons stretch with `block` in forms and stay content-width elsewhere.

### Feedback

| Component | Use it for | Key props |
|---|---|---|
| `Alert` | An inline message in the flow | `tone` (`success`, `danger`, `warning`, `info`), `message` (one sentence), `onDismiss` |
| `useToast().show` | A short confirmation after an action | `{ tone, message }`. Needs `ToastProvider`, which today is mounted only in the design-system layout |
| `EmptyState` | Nothing to show, or a failed load. Fills its space | `title`, `description`, `icon`, `children` for the next step |
| `Loading` | Spinner for a short wait: a list footer, a small area | `label` |
| `Skeleton` + `SkeletonGroup` | First load of a screen. Compose pulsing blocks in the shape of the real content; the group announces one loading state | `Skeleton`: `className` (size and shape). `SkeletonGroup`: `label` |

## Screen recipes

Each recipe is the layout. Copy the skeleton, swap the content.

### Launcher (home)

The app has four tabs: Home, Apps, Inbox (count badge), AI chat. Each tab screen starts with `TabHeader` (`src/navigation/tab-header.tsx`).

- **Home**: header (`Logo`, account `IconButton`, `heading`) → `InfoCard` for the inbox. Reference: `src/navigation/home-screen.tsx`.
- **Apps**: `TabHeader` with a search `TextField` → `ListGroup` of `ListRow`s, one per module the user may open (icon, title, chevron). Empty: `EmptyState icon="grid"`, no match: `icon="search"`. Reference: `src/navigation/apps-screen.tsx`. A new module appears here through its manifest.
- Account is not a tab: it opens from the Home header as a stack screen.

### List with filters

Under a native stack header. `surface` block with a horizontal `ChipGroup` → list of cards, `gap-4 px-5 py-4`, pull to refresh, paged with `onEndReached` and a `Loading` footer. Reference: `src/modules/PriceApproval/screens/price-approval-list-screen.tsx`.

```tsx
<Screen>
  <View className="rounded-b-xl bg-surface pb-5 pt-4">{/* ChipGroup in a horizontal ScrollView, px-5 */}</View>
  <FlatList contentContainerClassName="gap-4 px-5 py-4" … />
</Screen>
```

A list card is `rounded-xl bg-surface p-4 shadow-card gap-2`: `module-title` + `Badge` on the first row, `body` for the subject, `caption muted` for meta. Reference: `price-approval-card.tsx`.

### Module index (list with toolbar)

Every module index starts with `ListToolbar`, on the white header block. Buttons, left to right: search, filter, actions (`more`), then the module chips, which scroll beside them. A button shows only when its prop is passed, so each module declares what it supports:

- `search`: the button opens a field with Cancel. The module decides what the text matches (a server param when the API has one).
- `onFilter`: the module opens its own `Sheet` (title "Filter", sections, `footer` with a primary "Apply" button).
- `actions`: a list such as Export and Import. Pass only what the module supports, each gated with `useCan()`. An empty list hides the button.
- Create: `<Fab label="New …" onPress={…} />` as the last child of `Screen`, rendered only when `useCan()` allows the module's create permission.
- Chips (PriceApproval keeps its status chips) go in as `children`.

```tsx
<Screen>
  <View className="rounded-b-xl bg-surface pb-5 pt-4">
    <ListToolbar search={{ value, onChange }} onFilter={openFilter} actions={actions}>
      <StatusFilter … />
    </ListToolbar>
  </View>
  <FlatList … />
  {can('create_x') ? <Fab label="New x" onPress={create} /> : null}
</Screen>
```

Reference: `price-approval-list-screen.tsx` (search and chips only).

### Form

`Screen` → `ScrollView` (`gap-6 px-5`, `keyboardShouldPersistTaps="handled"`) → `Logo` (sign-in only) and `heading` → a `surface` card (`gap-4 rounded-xl p-5 shadow-card`) holding the `TextField`s → `Alert` for a form-level error → `Button block`. Field errors go on the field with `error`. Reference: `src/modules/Auth/screens/login-screen.tsx`.

### Settings and account

`heading` → `ListGroup` of `ListRow`s (`ListRow` has no trailing slot: a setting with a `Toggle` is a hand-built row inside the `ListGroup`) → destructive or exit action as `Button variant="secondary" block`. Keep long values (emails) out of `ListRow value`: they do not wrap. Put them in a card as in `account-screen.tsx`.

### Detail

Native stack header → `ScrollView` (`gap-4 px-5`, pull to refresh, `keyboardShouldPersistTaps="handled"`) → stale/offline `Alert` → `surface` summary card (`module-title` + `Badge`, `body` subject, `caption muted` meta ending in "Updated 10:42") → `ListGroup` of key-value rows → sections with a `title` heading over a `ListGroup` → the decision card at the bottom: one `primary` `Button block` for the main action, `soft` for the rest, only the actions the server allows. Reference: `src/modules/PriceApproval/screens/price-approval-detail-screen.tsx` and `components/approval-actions.tsx`. Data rules for actions: [data-management.md](data-management.md#writing-actions).

A tappable list card is a `Pressable` with `role="button"`, an `aria-label`, `active:bg-surface-gray` and `focusRing` (exported from `@/shared/ui`). Reference: `price-approval-card.tsx`.

## States

Every data screen has all of these. Do not flash "empty" during the first load.

| State | Show |
|---|---|
| First load | Skeletons shaped like the content (`SkeletonGroup` + `Skeleton`, `ModuleCard loading`). Reference: `PriceApproval/components/price-approval-skeletons.tsx`. Pulse stops with reduce motion |
| Empty | `EmptyState` with a task icon and one short line of why |
| Error, no data | `EmptyState icon="alert"`, the message, `Button variant="soft"` "Try again" |
| Offline, no data | `EmptyState icon="alert"` "You are offline" plus retry |
| Error, have data | Keep the list. `Alert tone="warning"` "Could not refresh. Showing data from 10:42." |
| Offline, have data | Keep the list. `Alert tone="warning"` "You are offline. Showing data from 10:42." Actions disabled with a caption saying why |
| Action result | `Alert` by the actions: success with the server's new status, warning on a conflict, danger when the outcome is unknown |
| Loading more | `Loading` as the list footer |

## Accessibility

- Use `role` and `aria-*`, which work on web and native. Add `accessibilityState` for selected state on native.
- A `View` with a `role` needs `accessible`, or screen readers skip it.
- Touch targets are at least 48. Keep the visible control smaller inside a 48 press area, as `Toggle` and `Stepper` do.
- Status is never color only: a `Badge` always has a label, an `Alert` always has an icon and text.
- Icon-only controls need a label (`IconButton` requires one). A field without a visible label needs `aria-label`.
- Errors are announced: `Alert` and `TextField` already do it. Do not add a second announcement.
- Interactive components carry the focus ring (`focusRing`, exported from `@/shared/ui` for module-local pressables). Keep it on anything new.

## Copy

Sentence case. Short. Second person. Verbs on buttons ("Sign in", "Try again", not "Submit"). No emoji. No exclamation marks. Errors say what happened and what to do, never the cause or a stack. Examples: "Could not load requests", "Your account has no access to any module."

## Checklist

Before a screen is done:

- [ ] Built from `@/shared/ui`; no import from a removed or legacy path.
- [ ] No raw hex, no arbitrary value, no `StyleSheet.create` for looks. Native props read `tokens.ts`.
- [ ] All text is `AppText`, titles have `role="heading"`.
- [ ] Wrapped in `Screen`; margins `px-5`; stack gap `gap-4`; safe-area and nav insets handled.
- [ ] Inputs and unselected chips sit on a white surface.
- [ ] One `primary` action at most; `soft` used on white cards.
- [ ] Loading, empty, error, offline and stale states exist.
- [ ] Touch targets ≥ 48, labels on icon-only controls, status not color only.
- [ ] Copy follows the rules above.
- [ ] `npx tsc --noEmit`, `npx expo lint`, `npm test` pass; the screen was looked at at phone width.

## Extending the system

Add to the system only when a real screen needs it and two or more modules will use it. Otherwise keep it module-local, built from tokens.

1. **New color, type style, radius or shadow:** add it to `@theme` in `src/global.css`. If a native prop needs it as a value, mirror it in `tokens.ts` (the test keeps them in sync). Add a row to the tables above.
2. **New component:** `src/shared/ui/<name>/<name>.tsx` and `<name>.test.tsx`; export from `src/shared/ui/index.ts`.
   - Function component, named export, a `NameProps` interface, `ref` as a prop.
   - Variant maps as `const` objects; `clsx` for classes; `className` for layout only.
   - Pressable things get a role, a 48 target, `focusRing` and pressed feedback.
   - `shared` never imports `core`, `modules` or the shell.
3. **New icon:** import it in `src/shared/ui/icon/icon.tsx` and add it to the `icons` map and the list above.
4. **Show it on the board:** add a card to `src/modules/DesignSystem/screens/board-screen.tsx`, so the reference stays complete.
5. **Update this document** in the same change.
