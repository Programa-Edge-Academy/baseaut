# Copilot instructions for `baseaut`

## Commands

| Task       | Command                        |
| ---------- | ------------------------------ |
| Install    | `npm install`                  |
| Dev server | `npm start` / `npx expo start` |
| Android    | `npm run android`              |
| iOS        | `npm run ios`                  |
| Web        | `npm run web`                  |
| Lint       | `npm run lint`                 |

No automated test script yet — lint and manual validation are the current checks.

---

## Architecture

This is an **Expo Router** app with **NativeWind** and **Supabase**.

```
app/              # Routes only — keep files thin
features/         # Domain logic grouped by feature
  auth/
  students/
  exercises/
  sessions/
  teams/
  analysis/
  reports/
  forms/
components/       # Shared, reusable UI primitives
lib/              # Shared app helpers (supabase client, utils)
```

### Feature module anatomy

Every feature follows this internal structure:

```
features/<domain>/
  hooks/          # use-*.ts — data fetching, mutations, state
  components/     # UI components scoped to this feature
  constants/      # Feature-specific constants
  screens/        # Thin screen compositions (if needed outside app/)
  types.ts        # Domain types for this feature
```

Screens compose hooks. Hooks own all data fetching, mutation, and business logic.

### Key files

- **`lib/supabase.ts`** — Single Supabase client; fails fast if `EXPO_PUBLIC_SUPABASE_URL` or `EXPO_PUBLIC_SUPABASE_ANON_KEY` are missing.
- **`app/_layout.tsx`** — Loads Inter fonts, applies `app/global.css`, hides splash screen, processes recovery deep links → `/reset-password`.
- **`app/index.tsx`** — Auth gate: checks session, reads profile, signs out pending non-coordinator users, redirects to `/students`.
- **`supabase/migrations/`** — Source of truth for the DB schema. Check here before writing queries.

### CI/CD

GitHub Actions validates migrations on PRs and pushes them to staging/prod from `develop`, `staging`, and `main`.

---

## Conventions

### TypeScript & imports

- Strict TypeScript throughout. Use `@/*` path alias (see `tsconfig.json`).
- Naming: `PascalCase` components/screens, `useCamelCase` hooks, `kebab-case` filenames outside route files.

### Data & Supabase

- Deletes are **soft**: set `ativo: false`, never remove rows.
- Team-scoped queries resolve `equipe_id` via `resolveEquipeId()` or a join on `membros_equipe`/`equipes`. Do not hardcode IDs.
- Access Supabase **only inside hooks**, never directly from route files or UI components.

### Navigation

- Use `router.replace` after auth events (login, logout) to prevent back-navigation to auth screens.
- Use `router.push` for normal forward navigation.

### Error handling

- Surface user-facing errors in Portuguese via the established toast/alert pattern in nearby screens — don't introduce a new error UI primitive.

### Styling

- NativeWind utility classes + shared tokens from `app/global.css`: `text-header-*`, `text-default-*`, `shadow-*`.
- Never use `StyleSheet.create` — use NativeWind classes instead.

### Media uploads (cross-platform gotcha)

- **Web**: `fetch(uri).blob()` then upload to Supabase Storage.
- **Native**: `expo-file-system` + `base64-arraybuffer`, then upload.
- Never assume one path works on both platforms.

### Copy

- All user-facing text is in **Brazilian Portuguese**. Preserve that in new screens, errors, labels, and placeholders.

---

## Before changing code

1. **Find the existing feature first.** Check `features/` before creating anything new. If a hook, component, or helper already handles the domain, extend it — don't add a parallel abstraction.
2. **Match the query shape of nearby files.** Look at an existing `use-*.ts` in the same feature before writing a new Supabase query.
3. **Keep changes local.** Touch only the files relevant to the task. Avoid "while I'm here" refactors.
4. **Routes are composition layers.** If you're adding logic to an `app/` file, that logic belongs in a hook inside `features/`.
5. **Check migrations before assuming schema.** If unsure about a column name, type, or relationship, look in `supabase/migrations/` rather than guessing.

---

## Anti-patterns to avoid

- ❌ Importing `supabase` client directly in route files or UI components
- ❌ Using `StyleSheet.create` anywhere
- ❌ Hard-deleting rows (`DELETE FROM ...`) — use soft delete
- ❌ Hardcoding `equipe_id` — always resolve it at runtime
- ❌ Duplicating a feature hook instead of extending it
- ❌ English copy in user-facing strings
