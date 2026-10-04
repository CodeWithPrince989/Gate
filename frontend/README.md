# GATE 2027 Command Center

The signed-in home experience is a local-first preparation tracker for GATE CSE and DA. It includes a daily planner, month/week/day calendar, stage-based syllabus tracker, PYQ question bank, spaced revisions, mistake notebook, test and mock analysis, focus timer, analytics, weekly reviews, goals, and responsive navigation.

## Run locally

From this directory:

```sh
npm install
npm run dev
```

`npm run build` runs the TypeScript project build and creates the production Vite bundle.

## Data and demo workspace

Tracker records are stored in browser `localStorage` under `gate-command-center-v1`. The initial workspace contains clearly labeled sample preparation data; the first visit asks for a target paper and study-hour goals. Use **Settings → Reset Demo Data** to restore the sample workspace. Settings also supports JSON export and import.

The data contracts and local persistence adapter live in `src/features/command-center/data.ts`. Keep persistence behind this adapter when adding a remote repository (for example Supabase or Firebase); authentication remains separate from preparation records.

## Main routes

`/` is the dashboard. Planner, calendar, syllabus, PYQs, revisions, mistakes, tests, timer, analytics, weekly review, goals, and settings are available from the command-center navigation.
