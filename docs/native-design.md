# Media Native Design Brief

Brought over from `vannputh/analytics-app` when that Expo workspace was folded into this monorepo. It applies to `apps/native` only.



## Intent

The native media feature should feel like a Notion-style personal workspace translated into iOS, not a web page wrapped in React Native.

The target mood is:

- editorial information hierarchy
- monochrome by default
- restrained iOS 26 liquid glass
- readable, calm, and tactile

The design should preserve the existing media behavior while making the UI easy to edit, extend, and restyle through small feature-local components.

## Core Direction

- Prefer composition over screen monoliths. Route files should stay thin and feature screens should mostly coordinate state and navigation.
- Use feature-local section components for each visible region: hero, filter notice, section stack, summary, metadata controls, history blocks, action rows, and form groups.
- Use monochrome surfaces and typography first. Accent color is not the baseline language for media.
- Use liquid glass for floating controls, pills, overlays, and selected secondary surfaces. Do not blur every layer.
- Keep touch targets generous and shapes continuous. Use native spacing and platform-safe scroll containers.

## Tokens

The canonical media tokens live in [apps/native/features/media/media-ui.ts](/Users/mac/Developer/analytics/analytics-app/apps/native/features/media/media-ui.ts).

Key token groups:

- Backgrounds: `MEDIA_PAGE_BACKGROUND`, `MEDIA_SHEET_BACKGROUND`, `MEDIA_DETAIL_BACKGROUND`
- Surfaces: `MEDIA_CARD_BACKGROUND`, `MEDIA_DETAIL_SURFACE`, `MEDIA_DETAIL_SURFACE_RAISED`
- Borders and shadow: `MEDIA_CARD_BORDER`, `MEDIA_DETAIL_BORDER`, `MEDIA_CARD_SHADOW`, `MEDIA_CARD_SELECTED_SHADOW`
- Radius: `MEDIA_CARD_RADIUS`, `MEDIA_PANEL_RADIUS`, `MEDIA_CONTROL_RADIUS`, `MEDIA_PILL_RADIUS`
- Layout: `MEDIA_LAYOUT_SIDE_PADDING`, `MEDIA_SCREEN_GAP`, `MEDIA_SECTION_GAP`, `MEDIA_PANEL_GAP`
- Control sizing: `MEDIA_BUTTON_HEIGHT`, `MEDIA_COMPACT_BUTTON_HEIGHT`, `MEDIA_INPUT_MIN_HEIGHT`
- Glass intensity: `MEDIA_GLASS_INTENSITY_SOFT`, `MEDIA_GLASS_INTENSITY_MEDIUM`, `MEDIA_GLASS_INTENSITY_STRONG`

All new media surfaces should consume these tokens instead of introducing one-off sizes, colors, or radii.

## Glass Usage Rules

- Use `AdaptiveGlass` as the only platform abstraction for liquid glass and blur fallback.
- Reserve glass for:
  - section pills and counters
  - overlay panels on posters
  - floating selection toolbars
  - search bars and segmented scope controls
  - small utility buttons and contextual chrome
- Prefer solid or lightly tinted surfaces for:
  - long forms
  - long reading blocks
  - dense editable content
  - detail summaries where contrast matters
- Do not stack multiple heavy blur layers on top of each other unless the effect is intentional and still readable.

## Typography And Spacing

- Use strong hierarchy with compact labels, medium body copy, and confident section titles.
- Keep titles short and route-level. Do not recreate large custom page titles inside the scroll content.
- Favor short vertical gaps and grouped surfaces over large isolated blocks.
- Prefer editorial pacing:
  - intro copy
  - control cluster
  - content section
  - action footer

## Component Inventory

Shared primitives:

- [media-screen-scroll-view.tsx](/Users/mac/Developer/analytics/analytics-app/apps/native/features/media/primitives/media-screen-scroll-view.tsx)
- [media-action-button.tsx](/Users/mac/Developer/analytics/analytics-app/apps/native/features/media/primitives/media-action-button.tsx)
- [media-pill.tsx](/Users/mac/Developer/analytics/analytics-app/apps/native/features/media/primitives/media-pill.tsx)
- [media-form-field.tsx](/Users/mac/Developer/analytics/analytics-app/apps/native/features/media/primitives/media-form-field.tsx)
- [media-text-field.tsx](/Users/mac/Developer/analytics/analytics-app/apps/native/features/media/primitives/media-text-field.tsx)
- [media-empty-state.tsx](/Users/mac/Developer/analytics/analytics-app/apps/native/features/media/primitives/media-empty-state.tsx)

Feature sections:

- Diary: empty state, filter notice, section stack
- Detail: hero, summary, quick actions, episode history, metadata, status history
- Editor: core details, metadata/poster, progress/dates, ratings/notes, footer actions

Existing feature components such as cards, poster grids, watching strips, and toolbars should plug into these primitives rather than re-inventing surface and button styles.

## Route Composition Map

- `/media`
  - header actions
  - optional filter notice
  - watching section
  - watched section
  - planned section
  - paused and dropped section
  - floating selection toolbar
- `/search`
  - iOS header search bar, with glass field fallback on non-iOS
  - global media-diary search guidance
  - result list
- `/media/filters`
  - intro card
  - date range block
  - filter groups
  - footer actions
- `/media/watch-this`
  - selected planned entry card
  - synopsis block
  - footer actions
- `/media/display-preferences`
  - intro card
  - grouped preference toggles
  - done action
- `/media/entry/[id]`
  - hero/actions
  - summary
  - quick actions when watching
  - episode history
  - metadata refresh and review
  - status history
- `/media/add` and `/media/entry/[id]/edit`
  - core details
  - metadata/poster
  - metadata review
  - progress/dates
  - ratings/notes
  - footer actions

## Fallback Behavior

- On supported iOS versions, use liquid glass through `expo-glass-effect`.
- On unsupported devices, `AdaptiveGlass` should fall back to blur without changing structure or interaction.
- Layout, spacing, and contrast must remain acceptable even when glass renders as a simpler blur material.

## Do And Don’t

Do:

- keep screen files thin
- add new media UI as small feature-local sections
- reuse tokenized surfaces, fields, pills, and buttons
- keep the visual language monochrome and editorial
- use glass to support hierarchy, not to replace hierarchy

Don’t:

- port web Tailwind layouts into native line for line
- introduce bright accent colors as the default media language
- rebuild large multi-region screens in a single file
- add one-off shadows, radii, or blur values when a media token already exists
- use glass on dense form content when a solid surface reads better
