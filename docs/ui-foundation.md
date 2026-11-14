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

| Token                    | Value                   | Use                                                                                |
| ------------------------ | ----------------------- | ---------------------------------------------------------------------------------- |
| `primary`                | `#130066`               | Primary actions, active states, module tiles                                       |
| `primary-pressed`        | `#0c0044`               | Pressed primary                                                                    |
| `on-primary`             | `#ffffff`               | Text and icons on `primary`                                                        |
| `primary-soft`           | `#eeeafb`               | Soft buttons, info cards, icon wells, `info` badge                                 |
| `lavender`               | `#c9b4ff`               | Selected filter chip, pressed soft surfaces, highlights                            |
| `ink`                    | `#0b0b1a`               | Headings and primary text                                                          |
| `ink-muted`              | `#5b6270`               | Secondary text, captions, placeholders                                             |
| `ground`                 | `#eceef7`               | The ground of every screen (`Screen`): a soft lavender-gray the white cards sit on |
| `surface`                | `#ffffff`               | Cards, inputs, unselected chips, segmented control, round buttons, sheets, modals  |
| `surface-gray`           | `#f4f5f7`               | Neutral fills inside a white card: `neutral` badge, skeleton blocks, pressed rows  |
| `border`                 | `#e5e7eb`               | Hairlines between rows                                                             |
| `glass`                  | `rgba(255,255,255,0.7)` | Reference swatch on the design system board; the bottom nav no longer uses it      |
| `control-off`            | `#868c98`               | Toggle track when off                                                              |
| `success` / `success-bg` | `#176a42` / `#e6f4ec`   | Success text and fill                                                              |
| `danger` / `danger-bg`   | `#b42318` / `#fde8e8`   | Errors, destructive                                                                |
| `warning` / `warning-bg` | `#8a5a00` / `#fff4d6`   | Warnings, waiting states                                                           |

**Background rule.** The app background is `ground`, never white. Cards, list groups and sheets are `surface` (white) with a thin `border border-border` (no shadow). Controls that sit straight on the ground (inputs, unselected chips, the segmented control, round buttons) are `surface` too; an input inside a white card keeps its `border-border` hairline so it still reads. `surface-gray` is only for fills inside a white card.

The app is light only. There is no dark palette.

### Type

Always through `AppText`. Defaults for the whole app: every bold style is weight 500 (Rubik Medium; the app loads only Regular 400 and Medium 500, each as its own family: `font-rubik` and `font-rubik-medium`, because native ignores `font-weight` for custom fonts; `AppText` picks the family: Regular for `body` and any `tone="muted"` text, Medium for the rest), and sizes sit two steps below the old scale, floored at 13 for text and 12 for labels. Bottom navigation (`label`) and the Price Approval list and detail screens were already at 13/12 and did not change size. Native text does not inherit the font from a parent `View`.

| `variant`        | Size / line, weight | Use                                                                                                           |
| ---------------- | ------------------- | ------------------------------------------------------------------------------------------------------------- |
| `avatar`         | 32 / 40, 500        | Initials in the large `Avatar` only                                                                           |
| `display`        | 20 / 22, 500        | Marketing or splash moments only                                                                              |
| `heading`        | 17 / 22, 500        | Screen title                                                                                                  |
| `title`          | 16 / 20, 500        | Section title, empty-state title, stepper value                                                               |
| `module-title`   | 13 / 20, 500        | Card title                                                                                                    |
| `info-title`     | 13 / 20, 500        | Title inside an `InfoCard`                                                                                    |
| `body`           | 13 / 20, 400        | Default text                                                                                                  |
| `body-strong`    | 13 / 20, 500        | Row labels, emphasized body                                                                                   |
| `caption`        | 13 / 20, 500        | Meta, helper text, timestamps                                                                                 |
| `caption-strong` | 13 / 20, 500        | Dense card titles and totals, where `module-title` is too large                                               |
| `button`         | 13 / 20, 500        | Button text (set by `Button`)                                                                                 |
| `label`          | 12 / 16, 500        | Field labels, nav labels                                                                                      |
| `micro`          | 10 / 12, 500        | Tags that must stay quiet, such as the role `Badge` (`size="xs"`). Not for anything the user must read to act |

Dates and money are formatted only through `@/shared/utils/format`: `formatDate` ("1 Okt 2026"), `formatDateTime` ("1 Okt 2026 14:30") and `formatMoney` ("Rp 20,000", "Rp 20,000.50": always the Rp symbol, decimals only when present). Never format them per module.

`tone`: `ink` (default), `muted`, `primary`, `on-primary`, `success`, `danger`, `warning`.

Give a screen title `role="heading"`.

### Spacing

| Utility                          | px  | Use                                                 |
| -------------------------------- | --- | --------------------------------------------------- |
| `p-5` / `px-5`                   | 20  | **Screen margin**: the side padding of every screen |
| `gap-4`                          | 16  | Between cards and between sections                  |
| `p-4`                            | 16  | Card padding (`p-3` inside `ModuleCard`)            |
| `gap-3`                          | 12  | Between a control's icon and label                  |
| `gap-1`–`gap-2`                  | 4–8 | Between a title and its meta                        |
| `size-touch`                     | 48  | Minimum touch target                                |
| `min-h-control` / `size-control` | 56  | Buttons, inputs, list rows, icon buttons            |
| `h-tabbar`                       | 72  | Bottom nav                                          |
| `size-tile`                      | 112 | Module card tile                                    |

`sizes.screenTopGap` (16) is the gap between the safe-area top and the first content.

### Radius and shadow

| Utility        | px  | Use                                              |
| -------------- | --- | ------------------------------------------------ |
| `rounded-pill` | 999 | Buttons, chips, badges, bottom nav, icon buttons |
| `rounded-2xl`  | 32  | The black Home header card                       |
| `rounded-xl`   | 24  | Cards, list groups, sheets                       |
| `rounded-lg`   | 16  | Inputs, info cards, alerts, module tiles         |
| `rounded-md`   | 12  | Icon wells, pressable rows                       |
| `rounded-sm`   | 8   | Skeleton blocks                                  |

Shadows: Cards use `border border-border` (1px gray hairline) instead of a shadow. `shadow-glass` is internal to `BottomNav`, which is solid `ink` with a `lavender` pill on the active item. A card inside another card gets no shadow.

## Layout rules

- **Ground and width.** Every screen is wrapped in `Screen`: `surface` (white) ground, content held to `max-w-phone` (480) and centered on wide displays.
- **Margins.** Content is inset `px-5`. Items in a stack are separated by `gap-4`. Use `gap`, not margins, for rhythm.
- **Safe area.** The screen adds it, not the component. `TopAppBar` pads the status bar itself, so a screen under it adds none; only a screen with no bar (Home) pads the top with `useSafeAreaInsets().top + sizes.screenTopGap`. Above the bottom nav, pad the bottom with `useBottomNavInset()`. Elsewhere pad with `bottom`.
- **Screen header.** `TopAppBar`: a round back button on the left, the title centered, one round action on the right, straight on the `ground` (no white block). A tab has no back button. Search and filters sit under the bar, `px-5 pb-4`, also on the ground. Stacks use it as `header: renderTopAppBar`; tabs get it from `TabHeader`.
- **Scrolling.** Use `ScrollView` for short content and `FlatList` for long or paged lists. Both take `contentContainerClassName`.
- **Class names only reach React Native primitives** (`View`, `Text`, `Pressable`, `ScrollView`, `FlatList`, `TextInput`). Third-party components (`Animated.View`, `expo-image`, `GlassView`, safe-area views) take `style`, or wrap a plain `View`. The browser hides this bug; a native build shows it.
- **`className` is for layout only** (width, flex, margin, alignment). Looks come from `variant` and `tone`. CSS order decides conflicts, not class order.

## Component catalog

All from `@/shared/ui`.

### Structure

| Component             | Use it for                                                                                                                                                                                                                                             | Key props                                                  |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| `ActionBar`           | The bar pinned to the bottom of a screen with actions: on the `ground`, no card or hairline, safe area below. In a row, the main `primary` button is `flex-2` and the rest `secondary` with `flex-1 px-2`. Reference: Price Approval detail and create | `children`                                                 |
| `Screen`              | The ground of every screen                                                                                                                                                                                                                             | `children`, `className`                                    |
| `TopAppBar`           | The bar at the top of a screen. `renderTopAppBar` is the ready-made stack `header`                                                                                                                                                                     | `title`, `onBack`, `action` (`icon`, `label`, `onPress`)   |
| `Logo`                | Brand wordmark. Minimum width 64. Files in `assets/brand/`: `astrindo-logo.png` / `astrindo-logo-white.png` (wordmark, 4000x888) and `astrindo-icon.png` / `astrindo-icon-white.png` (the symbol alone), all transparent                               | `variant` (`dark` on light, `light` on `primary`), `width` |
| `BottomNav`           | App navigation, up to 4 items. An item may carry `badge` (unread count, hidden at 0, `99+` above 99)                                                                                                                                                   | `items`, `activeKey`, `onChange`, `placement`              |
| `useBottomNavInset()` | Bottom padding so content clears the nav                                                                                                                                                                                                               |                                                            |

### Content

| Component               | Use it for                                                                                                                                                                                                                                                                                                                                                        | Key props                                                                                                |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `AppText`               | All text                                                                                                                                                                                                                                                                                                                                                          | `variant`, `tone`                                                                                        |
| `ModuleCard`            | A launchable module: tile, title, department, badges, meta, Open                                                                                                                                                                                                                                                                                                  | `title`, `icon`, `department`, `badges`, `meta`, `favorite`, `onOpen`, or `loading` for the skeleton     |
| `InfoCard`              | A tappable highlight, such as "3 approvals waiting"                                                                                                                                                                                                                                                                                                               | `icon`, `title`, `description`, `onPress`                                                                |
| `ListGroup` + `ListRow` | Settings and key-value rows, hairlines between                                                                                                                                                                                                                                                                                                                    | `label`, `icon`, `value`, `onPress` (adds a chevron), `destructive` (danger color, no chevron: Sign out) |
| `StackedList`           | A scrolling list of cards (a `FlatList` with the same props, minus `onScroll`). A card pins at the top and shrinks to 0.94 while the next one slides over it. Keep the `py-4` list padding (the pin offset is 16), give cards the same width, and note that reduce motion turns the effect off. Reference: `PriceApproval/screens/price-approval-list-screen.tsx` | `FlatList` props                                                                                         |
| `Avatar`                | A person: their photo, or their initials on `lavender` when there is none. Named after the person for screen readers                                                                                                                                                                                                                                              | `name`, `uri`, `size` (`md` 56, `xl` 128)                                                                |
| `Badge`                 | Status or count. Always has a text label                                                                                                                                                                                                                                                                                                                          | `label`, `tone` (`neutral`, `info`, `success`, `danger`, `warning`), `icon`                              |
| `Icon`                  | Glyphs. Decorative unless `label` is set                                                                                                                                                                                                                                                                                                                          | `name`, `size`, `color` (a color token), `filled`                                                        |

Icon names: `home grid search bell user calendar settings building box wallet users chart truck clipboard doc chat heart bookmark share pin lock log-out pencil eye eye-off sliders list map cart star plus more copy download upload minus check x alert info arrow-up arrow-down arrow-right chevron-left chevron-right`. Icons are Lucide, drawn at 24px, 1.75 stroke.

### Actions and input

| Component            | Use it for                                                                                                                                                             | Key props                                                                                                                                                                                                   |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Button`             | Text actions                                                                                                                                                           | `variant` (`primary`, `secondary`, `soft`), `block`, `iconLeft`, `iconRight`, `loading`, `disabled`. Children is a string                                                                                   |
| `IconButton`         | Icon-only actions                                                                                                                                                      | `icon`, `label` (required), `active`, `size` (`md` 56, `sm`: a 40 circle in a 48 press area, or `xs`: a 32 lavender circle with a 16 icon in a 48 press area, for card row actions such as edit and remove) |
| `TextField`          | Text input                                                                                                                                                             | `label`, `type` (`text`, `password`), `icon`, `help`, `error`, `trailing`                                                                                                                                   |
| `Chip` / `ChipGroup` | Single-select filters                                                                                                                                                  | `ChipGroup`: `label`, `options`, `value`, `onChange`. An option with an `icon` becomes a department switch                                                                                                  |
| `SegmentedControl`   | Choose one of 2–4 views                                                                                                                                                | `label`, `options`, `value`, `onChange`                                                                                                                                                                     |
| `Toggle`             | On/off setting                                                                                                                                                         | `label`, `value`, `onValueChange`                                                                                                                                                                           |
| `ListToolbar`        | Top row of a module index: filter, actions buttons plus the module chips, and the search field while open (its button is in the top app bar). See the recipe           | `search`, `onFilter`, `filterActive`, `actions`, `children`                                                                                                                                                 |
| `DateRangePicker`    | Month calendar to pick a start and end day (Monday first, same day twice for one day). Days are `YYYY-MM-DD` strings. JS only, so it works on web and needs no rebuild | `value: { from, to }`, `onChange`, `initialMonth`                                                                                                                                                           |
| `Fab`                | Create button, floats bottom right. Last child of `Screen`, only with the create permission                                                                            | `label`, `icon`                                                                                                                                                                                             |
| `Sheet`              | Bottom sheet: filter form, action menu                                                                                                                                 | `visible`, `title`, `onClose`, `footer`, `fullHeight` (keeps full height with few rows: a searchable picker)                                                                                                |
| `Stepper`            | A small number, such as a quantity                                                                                                                                     | `label`, `value`, `min`, `max`, `onChange`                                                                                                                                                                  |

Pinned bottom actions always use `ActionBar` (never a white bar with a hairline). Button choice: `primary` is the one main action per screen. `secondary` (white with shadow) is only a subtle lift on the white ground. Prefer `soft` on white, because `secondary` nearly disappears. Buttons stretch with `block` in forms and stay content-width elsewhere.

### Feedback

| Component                    | Use it for                                                                                                                                                                            | Key props                                                                                                                                                                                                                                                                                                     |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Alert`                      | An inline message in the flow                                                                                                                                                         | `tone` (`success`, `danger`, `warning`, `info`), `message` (one sentence), `onDismiss`                                                                                                                                                                                                                        |
| `useToast().show`            | A short confirmation after an action                                                                                                                                                  | `{ tone, message }`. Needs `ToastProvider`, which today is mounted only in the design-system layout                                                                                                                                                                                                           |
| `useConfirm()`               | A confirm dialog before an action that changes data. Replaces `Alert.alert` and `window.confirm`: icon in a soft circle, title, optional message, and a split Cancel / confirm footer | `confirm({ title, message?, confirmLabel, cancelLabel?, icon?, destructive?, reason?: { label, required, maxLength?, requiredMessage? }, onConfirm(reason) })`. `reason` adds a text field in the dialog and blocks confirm while a required one is empty. Needs `ConfirmProvider`, mounted in `AppProviders` |
| `EmptyState`                 | Nothing to show, or a failed load. Fills its space                                                                                                                                    | `title`, `description`, `icon`, `children` for the next step                                                                                                                                                                                                                                                  |
| `Loading`                    | Spinner for a short wait: a list footer, a small area                                                                                                                                 | `label`                                                                                                                                                                                                                                                                                                       |
| `Skeleton` + `SkeletonGroup` | First load of a screen. Compose pulsing blocks in the shape of the real content; the group announces one loading state                                                                | `Skeleton`: `className` (size and shape). `SkeletonGroup`: `label`                                                                                                                                                                                                                                            |

## Screen recipes

Each recipe is the layout. Copy the skeleton, swap the content.

### Launcher (home)

The app has four tabs: Home, Apps, Inbox (count badge), AI chat. Each tab screen starts with `TabHeader` (`src/navigation/tab-header.tsx`).

- **Home**: a lavender-to-white `expo-linear-gradient` (`style`, not `className`) holding a top row (dark `Logo`, width 112, left; small (`size="sm"`) profile `IconButton` right) and a solid `bg-ink` card (`rounded-2xl`, `p-5`, `gap-2`) with the date, the user's name (`display`, `on-primary`) and a small role `Badge` (`size="xs"`, `info`, first role plus "+N") → "Favorite apps" (a 4-column grid of `FavoriteAppTile`, "Manage apps" link) → "Favorite inbox" (`InboxRow`s in a `ListGroup`, five newest from the favorite apps). Reference: `src/navigation/home-screen.tsx`.
- **Manage apps**: stack screen (`/manage-apps`, stack header) with "Favorite apps" (move up, move down, remove) and "More apps" (add). Moving is by buttons, not drag, so it works with a screen reader. Reference: `src/navigation/manage-apps-screen.tsx`.
- **Inbox**: `TabHeader` → `ListGroup` of `InboxRow`s, "Show more" when there are more pages. Reference: `src/navigation/inbox-screen.tsx`.
- **Apps**: `TabHeader` with a search `TextField` → `ListGroup` of `ListRow`s, one per module the user may open (icon, title, chevron). Empty: `EmptyState icon="grid"`, no match: `icon="search"`. Reference: `src/navigation/apps-screen.tsx`. A new module appears here through its manifest.
- Profile is not a tab: it opens from the Home header (`IconButton`, label "Profile") as a stack screen, see [Settings and account](#settings-and-account).

### List with filters

Under the top app bar (stack header). A horizontal `ChipGroup` on the ground → list of cards, `gap-4 px-5 py-4`, pull to refresh, paged with `onEndReached` and a `Loading` footer. Reference: `src/modules/PriceApproval/screens/price-approval-list-screen.tsx`.

```tsx
<Screen>
  <View className="pb-4 pt-2">{/* ChipGroup in a horizontal ScrollView, px-5 */}</View>
  <FlatList contentContainerClassName="gap-4 px-5 py-4" … />
</Screen>
```

A list card is `rounded-xl bg-surface p-4 border border-border gap-2`: `module-title` + `Badge` on the first row, `body` for the subject, `caption muted` for meta. Reference: `price-approval-card.tsx`.

### Module index (list with toolbar)

Every module index starts with `ListToolbar`, on the screen ground. Buttons, left to right: filter, actions (`more`), then the module chips, which scroll beside them. A button shows only when its prop is passed, so each module declares what it supports:

- Search: the button sits at the right of the top app bar. The screen sets it with `<Stack.Screen options={{ headerRight }} />` (an `IconButton size="sm" icon="search"`, `active` while searching or a query is set) and owns `searching` state. `search={{ open, onClose, value, onChange }}` shows the field with Cancel in place of the toolbar row while `open`. The module decides what the text matches (a server param when the API has one).
- `onFilter`: the module opens its own `Sheet` (title "Filter", sections, `footer` with a primary "Apply" button).
- `actions`: a list such as Export and Import. Pass only what the module supports, each gated with `useCan()`. An empty list hides the button.
- Create: `<Fab label="New …" onPress={…} />` as the last child of `Screen`, rendered only when `useCan()` allows the module's create permission.
- Chips (PriceApproval keeps its status chips) go in as `children`.

```tsx
<Screen>
  <View className="pb-4 pt-2">
    <ListToolbar search={{ open, onClose, value, onChange }} onFilter={openFilter} actions={actions}>
      <StatusFilter … />
    </ListToolbar>
  </View>
  <FlatList … />
  {can('create_x') ? <Fab label="New x" onPress={create} /> : null}
</Screen>
```

Reference: `price-approval-list-screen.tsx` (search and chips only).

### Form

`Screen` → `ScrollView` (`gap-6 px-5`, `keyboardShouldPersistTaps="handled"`) → `Logo` (sign-in only) and `heading` → a `surface` card (`gap-4 rounded-xl p-5 border border-border`) holding the `TextField`s → `Alert` for a form-level error → `Button block`. Field errors go on the field with `error`. Reference: `src/modules/Auth/screens/login-screen.tsx`.

### Settings and account

**Profile** (`/profile`, stack header "Profile", `src/modules/Auth/screens/profile-screen.tsx`): a centered `Avatar size="xl"` with the dark pencil dot (`AvatarEditButton`, opens Edit profile) → the name (`display`, `role="heading"`) → the role `Badge` (`size="xs"`, `info`, same text as Home) → a `label` muted "Account" over a `ListGroup`: Edit profile, Change password, and Sign out as a `destructive` row. Sign out asks first (`useConfirm` from `@/shared/ui`).

Its sub-screens are Form recipes under the stack header: **Edit profile** (`/edit-profile`: the avatar with a pencil dot that opens the photo library, a card with the name `TextField` and the email and role as plain label-and-value text, because only the name and photo can change, then "Save changes", disabled until something changed) and **Change password** (`/change-password`: a card of three password `TextField`s, then "Change password"). Both show the result in an `Alert` and the server's field errors on the fields.

For a plain settings list: `heading` → `ListGroup` of `ListRow`s (`ListRow` has no trailing slot: a setting with a `Toggle` is a hand-built row inside the `ListGroup`) → a destructive exit as a `destructive` `ListRow`, or `Button variant="secondary" block` when it stands alone. Keep long values (emails) out of `ListRow value`: they do not wrap. Put them in a card, as Edit profile does.

### Detail

Top app bar (stack header) → `ScrollView` (`gap-4 px-5`, pull to refresh, `keyboardShouldPersistTaps="handled"`) → stale/offline `Alert` → `surface` summary card (`module-title` + `Badge`, `body` subject, `caption muted` meta ending in "Updated 10:42") → `ListGroup` of key-value rows → sections with a `title` heading over a `ListGroup` → the decision bar at the bottom (`ActionBar`): one `primary` `Button block` for the main action, `secondary` for the rest, only the actions the server allows. Reference: `src/modules/PriceApproval/screens/price-approval-detail-screen.tsx` and `components/approval-actions.tsx`. Data rules for actions: [data-management.md](data-management.md#writing-actions).

A tappable list card is a `Pressable` with `role="button"`, an `aria-label`, `active:bg-surface-gray` and `focusRing` (exported from `@/shared/ui`). Reference: `price-approval-card.tsx`.

## States

Every data screen has all of these. Do not flash "empty" during the first load.

| State              | Show                                                                                                                                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| First load         | Skeletons shaped like the content (`SkeletonGroup` + `Skeleton`, `ModuleCard loading`). Reference: `PriceApproval/components/price-approval-skeletons.tsx`. Pulse stops with reduce motion |
| Empty              | `EmptyState` with a task icon and one short line of why                                                                                                                                    |
| Error, no data     | `EmptyState icon="alert"`, the message, `Button variant="soft"` "Try again"                                                                                                                |
| Offline, no data   | `EmptyState icon="alert"` "You are offline" plus retry                                                                                                                                     |
| Error, have data   | Keep the list. `Alert tone="warning"` "Could not refresh. Showing data from 10:42."                                                                                                        |
| Offline, have data | Keep the list. `Alert tone="warning"` "You are offline. Showing data from 10:42." Actions disabled with a caption saying why                                                               |
| Action result      | `Alert` by the actions: success with the server's new status, warning on a conflict, danger when the outcome is unknown                                                                    |
| Loading more       | `Loading` as the list footer                                                                                                                                                               |

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
- [ ] The screen sits on `ground`; cards are `surface`; the top app bar is used, not a white header block.
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

### Multi-step form

A long create flow (reference: `PriceApproval/screens/price-approval-create-screen.tsx`): `Screen` → a step indicator (module-local `StepIndicator`: the step name as `title` and "Step 2 of 4" above one bar per step) → `ScrollView` (`gap-4 px-5`) holding the current step → a pinned `ActionBar` with a `secondary` Back and a `primary` Next, which becomes "Submit request" on the last step. Fields sit straight on the `ground` (white inputs and chips), grouped under `title` headings. A choice of a few options is a `ChipGroup` with no preselection; a long list is a `PickerField` that opens a searchable `Sheet`. A repeated record (items) is a card list with Edit and Remove, edited in place of the list with Save and Cancel. The last step summarises everything in cards with an edit button per section, and a total.

### Required and optional fields

A required field's label ends with a red asterisk (`required` on `TextField`, or `FieldLabel required` when you build a field by hand; module pickers pass it through). An optional field gets no mark and no "(optional)" text: unmarked means optional. The asterisk is hidden from screen readers; the field's error says what is missing. `FieldLabel` is the only place a field label is drawn.

### Money inputs

A rupiah field shows thousands grouped with commas while the user types ("100,000", decimals with a point), the same as `formatMoney`. Keep the raw value as plain digits in state and group only for display (`groupThousands` and `sanitizeMoney`, reference: `PriceApproval/create/calculate-line.ts`).
