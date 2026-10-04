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

The command-center data contracts and local persistence adapter live in `src/features/command-center/data.ts`. Daily preparation check-ins are kept separately under a versioned, signed-in-user-scoped localStorage key by `src/features/command-center/preparationCheckins.ts`; the adapter boundary is intentionally small so records can later move to a remote repository (for example Supabase or Firebase) without changing the graph UI. Check-ins record meaningful study activities, preparation metrics, topics, and reflection; focus time is reported separately and never determines the contribution level by itself.

## Main routes

`/` is the dashboard, including the yearly preparation contribution graph and fast daily check-in. `/check-in` opens the sortable check-in history. Planner, calendar, syllabus, PYQs, revisions, mistakes, tests, timer, analytics, weekly review, goals, and settings are available from the command-center navigation.
