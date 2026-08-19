# Test coverage — progress / missing

Scope: expand `should create`-only specs into real behavior tests, per principle of testing actual behavior/outcomes (not implementation), mocking only external deps (Firebase SDK), and never weakening a test to make it pass.

Stack: Angular v22 + Vitest (`@angular/build:unit-test`), no E2E framework installed.

## Expanded this pass

| File | Before | Now covers |
|---|---|---|
| `src/app/components/invite-dialog/invite-dialog.spec.ts` | `should create` only | `shareLink`/`mailtoInviteLink` computed values (browser vs. server platform), `copyShareLink` success/failure/no-clipboard/server-side paths, `resetCopyState`, `onCancel` emit |
| `src/app/components/board-component/board-component.spec.ts` | `should create` only | `taskDropped` column resolution + no-op on unknown column, `addColumn` delegation, `createOrEditTask` emit (with/without task), `deleteTask` stopPropagation + delegation |
| `src/app/components/task-form/task-form.spec.ts` | `should create` only | task-input sync effect (populate/reset), contributors effect (fetch + de-dupe + empty case), `postComment` (empty text / no task id / happy path), `submitForm` (new task id generation, assignedTo resolution, edit preserves createdBy/createdAt, closeModal emit on success, catch+log on failure without emitting) |
| `src/app/pages/login/login.spec.ts` | `should create` only | `ngOnInit` redirect-if-already-signed-in (default `/boards` and `redirectTo` query param), no navigation when signed out, no subscription on server platform; `signInWithGoogle` success (both redirect targets) and failure (logs, doesn't navigate) |

All new tests were checked against inverted logic (temporarily breaking the source) for at least one case per file to confirm they aren't vacuous — e.g. `invite-dialog`'s clipboard try/catch test fails if the catch block is removed.

**Note on `login.spec.ts`:** `Login` pulls in `Layout` → `SaveUpdateNotification`, which inject the real `AuthService`/`BoardService` (both Firestore-backed). Those are overridden with lightweight `useValue` stubs in this spec so the test only exercises `Login`'s own logic — an initial version mocked the `@angular/fire/firestore` module directly, but that mock isn't file-isolated under this Vitest config and leaked into unrelated spec files (see "Known issue" below); the `useValue` provider override doesn't have that problem.

## Already solid, no action taken

`board.spec.ts` (service), `board.spec.ts` (page), `user.spec.ts`, `auth-guard.spec.ts`, `boards.spec.ts`, `join.spec.ts`, `animation.spec.ts`, `editable-text.spec.ts`, `hero-scramble.spec.ts` — these already assert real behavior/outcomes, not just instantiation.

## Skipped as trivial (per "don't test what can't break")

`theme.spec.ts`, `app.spec.ts`, `layout.spec.ts`, `home.spec.ts`, `board-skeleton.spec.ts`, `save-update-notification.spec.ts`, `theme-switch.spec.ts` — pure presentational or trivial signal toggles with no branching logic worth a behavior test.

`auth.spec.ts` — `currentUser`/`uid`/`authReady` already covered directly; `loginWithGoogle`/`ensureUserDoc`/`logout` are thin wrappers around the Firebase SDK, exercised indirectly through `login.spec.ts`. Direct coverage of `AuthService.loginWithGoogle`/`ensureUserDoc` would need the same Firestore-mocking pattern as `board.spec.ts`/`user.spec.ts` — worth adding in a follow-up, not required this pass.

## Known issue (pre-existing, not introduced by this pass)

Running the **full** suite (`ng test`) fails 3 tests across 2 files:
- `src/app/components/save-update-notification/save-update-notification.spec.ts` — `NG0201: No provider found for Firestore` (real `BoardService` constructed without a Firestore stub)
- `src/app/pages/join/join.spec.ts` (2 tests) — `TypeError: ctx.boardService.isSaving is not a function` (the `BoardService` stub used in that spec provides `isSaving` as something other than a callable signal)

Confirmed via `git stash` that these failures exist on `main` before any change in this branch — they're order-dependent (only fail when the full suite runs, not in isolation) and are a pre-existing test-isolation bug unrelated to the scope of this pass. Flagging for a separate fix; not touched here per the instruction not to alter tests outside the stated scope.

## Gaps / not built this pass

- **No E2E** — no Playwright/Cypress config anywhere in the repo. Everything above is unit/component-level with mocked Firebase. Full user-flow coverage (login → create board → invite → join → drag task) would need an E2E layer; out of scope for this pass.
- `src/app/pages/board/board.ts` — GSAP entrance/dialog animation branches (`animateBoardEntrance`, `openDialog`/`closeDialog` under `prefersReducedMotion: false`) are not covered; existing `board.spec.ts` only exercises the reduced-motion path. Animation-timing-heavy, acceptable gap.
- `AuthService.loginWithGoogle` / `ensureUserDoc` — no direct test (see above).
