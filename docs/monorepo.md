# Monorepo

`vannputh/analytics` is the home for analythika. The Expo client that previously lived in `vannputh/analytics-app` is folded in here. That repository was the native migration workspace; it is not the product home.

## Layout

- `apps/web` — the Next.js analythika app (https://analyticka.vercel.app/).
- `apps/native` — Expo SDK 55 app, including the food tab, insights, and place search work from analytics-app PRs #1 and #2 (`slops/food-qol-features-e876` @ `d654326`).
- `packages/domain` — shared types, Supabase row shapes, and pure analytics math.
- `packages/data` — Supabase repositories used by the native app.
- `packages/hooks` — framework-light hooks over the domain package.

Web-only status labels (`Finished`, `Plan to Watch`, and the rest of the diary vocabulary) stay in `apps/web`. The native diary uses the lowercase status set already stored by the Expo client. Those two vocabularies are intentionally separate. Shared calculations and the database types are not.

## Vercel

Set the project Root Directory to `apps/web` before the next production deploy. Install still runs from the repository root so Bun can link the workspaces. `apps/web/next.config.ts` traces files from the monorepo root.

## Native

```bash
bun run native:dev
```

Expo reads public configuration from the root `.env.local`. Do not commit that file.

## Follow-ups

- Device QA for the Expo food and insights flows.
- Archive `vannputh/analytics-app` once this monorepo is the only place native work lands.
