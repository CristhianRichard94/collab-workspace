# Task Grid

A drag-and-drop kanban board for teams. Make a board, split work into columns, drag tasks across. Everyone watching sees it update live.

## Stack

- Angular 22 (standalone components, signals)
- Firebase / Firestore for auth and real-time data
- Tailwind CSS v4
- Vitest for tests

## Getting started

```bash
pnpm install
pnpm start
```

Open `http://localhost:4200`.

## Scripts

| Command | What it does |
|---|---|
| `pnpm start` | Runs the dev server |
| `pnpm build` | Production build, output in `dist/` |
| `pnpm test` | Runs the Vitest suite |

## What's in here

- **Boards** — create, rename, custom columns
- **Tasks** — drag between columns, assign, edit or delete inline
- **Live sync** — changes push to every connected client through Firestore
- **Auth** — Google sign-in via Firebase
- **Theme** — light/dark, follows system or toggle manually
