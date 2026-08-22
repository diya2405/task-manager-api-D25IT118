# Practical 6 — Full Stack Integration (React + Node + MongoDB)
### Implementation Brief for Antigravity — CHARUSAT ITUE301, D25IT118

**Read this whole file before writing any code.** It defines the goal, the exact subtasks, the security bar, the bug-proofing bar, and the test plan this work must pass. Do not restructure files or logic outside what's listed here — this integrates existing, already-graded Practicals 1–5 work; it does not rewrite it.

**Repos involved (two separate repos, wired together):**
- Frontend: `Portfolio-D25IT118`
- Backend: `task-manager-api-D25IT118`

---

## 0. Goal

Connect the React frontend (Practicals 1–3) to the Node/Express/MongoDB backend (Practicals 4–5) into one working, secure, bug-free full-stack app. A user can create, view, update, and delete tasks from the UI; every operation is confirmed against a live MongoDB Atlas database, not assumed to succeed; every API interaction (not just the initial load) has its own loading and error handling; and the new UI visually matches the rest of the site, including dark mode.

---

## 1. How this satisfies each practical's stated aim

Antigravity should treat this table as the acceptance criteria — every row must be demonstrably true when done.

| Practical | Aim (from the practical sheet) | How Practical 6 satisfies / preserves it |
|---|---|---|
| 1 — Component Architecture | Reusable, prop-driven components, no duplicated JSX/logic | New components (`Tasks.jsx`, `Toast.jsx`, `TasksPage.jsx`) follow the same single-responsibility, prop-driven pattern as `Header`, `About`, `Skills`. No existing component is duplicated or forked. |
| 2 — Routing & State Management | React Router with distinct routes, `useState` used meaningfully, controlled inputs | New `/tasks` route added via `<Route>`, no full reload. `Tasks.jsx` uses `useState` for tasks, loading, error, two controlled form fields, and toast state — each with a distinct, meaningful purpose (not decorative). |
| 3 — API Integration | Fetch external data, loading spinner, error message component, render real fields | Existing GitHub-fetch spinner/error pattern (`Spinner.jsx`, `ErrorMessage.jsx`) is reused conceptually for the Tasks fetch — same loading/error UX language, applied to a second, independent API integration. |
| 4 — RESTful API | CRUD endpoints, logging middleware, global error handler, correct status codes | Untouched — reused exactly as built. Practical 6 verifies these endpoints work correctly when called cross-origin from a browser, which is a new integration test surface for this existing code. |
| 5 — MongoDB + Mongoose | Real DB-backed CRUD, structured validation errors | Untouched — reused exactly as built. Practical 6 is the first time these endpoints are exercised by a real UI instead of Postman, so it also serves as an end-to-end regression check on Practical 5's validation logic. |
| 6 — Full Stack Integration | CORS, frontend calling backend CRUD, UI/server state sync, loading+error on every write, not just reads | This is the primary subject of this document — see Sections 2–5 below. |

If executing this brief causes any Practical 1–5 behavior to change (e.g. a route stops working, GitHub repo fetch breaks, an existing endpoint's response shape changes), that is a regression and must be fixed before this is considered done.

---

## 2. Backend subtasks — `task-manager-api-D25IT118`

### 2.1 Install
```bash
npm install cors
```

### 2.2 Environment
`.env` (root, gitignored, never committed):
```
MONGO_URI=<ATLAS_CONNECTION_STRING_GOES_HERE>
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
```
Commit a matching `.env.example` with placeholder values only.

> Diya will supply the real Atlas connection string separately — do not fabricate one.

### 2.3 `server.js` changes
Add near the top:
```javascript
const cors = require('cors');
```
Configure CORS with an **explicit allowed origin**, not a wildcard — this is a security requirement, not a style choice (see Section 4):
```javascript
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
```
Place this **before** `express.json()` and route mounting, after the `mongoose.connect()` block. No other changes to `server.js`.

### 2.4 Do not touch
`models/Task.js`, `controllers/taskController.js`, `routes/taskRoutes.js`, `middleware/logger.js`, `middleware/requireJson.js`, `middleware/validateTaskId.js`, `middleware/notFound.js`, `middleware/errorHandler.js` — all reused as-is from Practicals 4–5. If any of these currently leak a raw stack trace or raw Mongoose error object in a response body, that is a pre-existing bug from Practical 5 and should be flagged, not silently left in place — the errorHandler must always return `{ error: <string>, details?: [...] }`, never a raw `err` object or `err.stack`.

### 2.5 Backend Definition of Done
- [ ] `npm start` logs `MongoDB connected` and `Server running on http://localhost:5000` with zero errors or unhandled promise warnings
- [ ] `cors()` restricts origin to `CLIENT_ORIGIN`, not `*`
- [ ] `.env` is gitignored; `.env.example` is committed with placeholders only
- [ ] No secrets (Atlas URI, credentials) appear anywhere in committed code, comments, or README
- [ ] All 5 existing endpoints (`GET /tasks`, `GET /tasks/:id`, `POST /tasks`, `PUT /tasks/:id`, `DELETE /tasks/:id`) still return their Practical-5-verified status codes and shapes when called from the browser (not just Postman)

---

## 3. Frontend subtasks — `Portfolio-D25IT118`

### 3.1 New file: `src/api/tasks.js`
Central fetch client. Base URL read from a single constant (not repeated inline anywhere else in the codebase — this is a Practical 6 "common mistake" the practical sheet explicitly warns against).

Required behavior for every exported function (`getTasks`, `createTask`, `updateTask`, `deleteTask`):
- Uses `fetch` with correct method/headers/body
- Awaits and parses JSON, guarded with `.catch(() => null)` in case the body isn't valid JSON (e.g. a network-level failure or a non-JSON 500 from something upstream)
- If `res.ok` is false: throw `new Error(data?.error ?? 'Request failed (status ' + res.status + ')')` — never surface a raw fetch/parsing exception to the UI
- If `res.ok` is true: return the parsed data

### 3.2 New file: `src/components/Toast.jsx`
- Props: `message: string`, `type: 'success' | 'error'`
- Returns `null` when `message` is falsy/empty (no flash of an empty box)
- Purely presentational — no internal state, no timers (timing is owned by the parent so there's exactly one source of truth for when a toast appears/disappears)

### 3.3 New file: `src/components/Tasks.css`
Design requirements (must visually match the rest of the site, not look like a bolted-on widget):
- Mono, underlined section label in the site's existing accent color, same treatment as `about.js` / `skills.json` / `projects.md` labels already in the codebase — e.g. `tasks.live`
- Card container: rounded corners + subtle shadow in light mode; borderless dark background with a thin border in `.dark` mode — mirror the exact light/dark pattern already used by other cards in the site (inspect `App.css`/`index.css` for the existing card treatment before writing new rules, don't invent a new color palette)
- Form: stacked inputs, rounded pill-style submit button in the site's existing accent color
- Task rows: title (strikethrough + muted when completed), optional description in smaller muted text below, right-aligned Complete/Undo + Delete buttons
- A task still awaiting server confirmation (temp/optimistic) renders at reduced opacity so the user can visually distinguish "probably saved" from "confirmed saved"
- Toast: fixed bottom-right, green for success / red for error, brief fade/slide-in
- Every color must have a working `.dark` override — test both modes, not just light mode, before calling this done
- No inline `style={{ ... }}` objects for anything covered by this stylesheet — keep all Tasks-related styling in `Tasks.css` for consistency with how the rest of the site is structured

### 3.4 New file: `src/components/Tasks.jsx`

**State:**
- `tasks` (array), `loading` (bool, for the initial GET only), `error` (string|null, for the initial GET only), `title`/`description` (controlled form fields), `toast` (`{ message, type }`)

**On mount:** fetch tasks once via `useEffect(() => { ... }, [])`, set `loading`/`error` accordingly. Do not re-fetch on every render (empty dependency array is required — a missing or wrong dependency array is a common bug source here).

**Create (optimistic):**
1. Guard: if `title.trim()` is empty, do not submit (no empty-title requests reach the server)
2. Build a temp task with a unique temp id (`` `temp-${crypto.randomUUID?.() ?? Date.now()}` ``) and insert it at the top of `tasks`
3. Clear the form fields immediately
4. Call `createTask()` with the trimmed title/description
5. **On success:** replace the temp task with the real server response by matching on the temp id — do not just append the real task (that would leave two copies in the list)
6. **On failure:** remove the temp task by id and show an error toast — the UI must never be left showing a task that doesn't actually exist in the database

**Toggle complete:**
- Call `updateTask(id, { completed: !currentValue })`
- On success, replace that one task in state with the server's response (source of truth is always the server response, not a locally-guessed new state)
- On failure, leave the task's displayed state unchanged and show an error toast (do not flip the checkbox/strikethrough optimistically for this action — only creation is optimistic, per the supplementary problem's explicit scope)

**Delete:**
- `window.confirm(...)` first; abort if not confirmed
- On confirm, call `deleteTask(id)`
- On success, remove from state; on failure, leave the task in the list and show an error toast

**General requirements:**
- Every write (`create`/`update`/`delete`) is independently wrapped in try/catch — a failure in one operation must never crash the whole component or leave `tasks` in an inconsistent state
- Toast auto-dismisses after ~2.5s via a `setTimeout`; clear any pending timeout on unmount to avoid a "set state on unmounted component" warning (use a `useRef` or cleanup function)
- Never trust local optimistic state as the final answer for anything the user could see reflected elsewhere (e.g. a task count) — always reconcile with the server response

### 3.5 New file: `src/pages/TasksPage.jsx`
Thin wrapper, same pattern as `ContactPage.jsx` around `Contact`:
```jsx
import Tasks from '../components/Tasks';

function TasksPage() {
  return <Tasks />;
}

export default TasksPage;
```

### 3.6 `App.jsx`
Add one route, don't touch the others:
```jsx
<Route path="/tasks" element={<TasksPage />} />
```

### 3.7 `navbar.jsx`
Add one nav item in the same style as the existing three:
```jsx
<li><NavLink to="/tasks">Tasks</NavLink></li>
```
Do not modify the existing dark-mode `useState`/`useEffect` logic in this file.

### 3.8 Frontend Definition of Done
- [ ] `/tasks` route loads with no full page reload from any other route
- [ ] Initial task list loads from the live backend (not hardcoded, not empty by default)
- [ ] Create/complete/delete all work and visually match the rest of the site in both light and dark mode
- [ ] No component uses inline hardcoded colors that ignore dark mode
- [ ] No console errors or React warnings (including key-prop warnings on the task list, and no unmounted-component state-update warnings)

---

## 4. Security checklist

| # | Requirement | Why |
|---|---|---|
| 1 | CORS restricted to `CLIENT_ORIGIN`, not `origin: '*'` or `cors()` with no options | An open CORS policy on an endpoint that returns/accepts task data lets any website read or write this API from a victim's browser session |
| 2 | `.env` is in `.gitignore`; only `.env.example` (placeholder values) is committed | Prevents the Atlas connection string (which contains a DB username/password) from being pushed to a public GitHub repo |
| 3 | Error responses never include `err.stack` or the raw error object, only `{ error: string }` | Stack traces leak file paths, package versions, and internals useful to an attacker; already required by Practical 4/5 but re-verify it holds under the new frontend traffic too |
| 4 | No `dangerouslySetInnerHTML` anywhere in `Tasks.jsx` — task titles/descriptions are rendered as plain JSX text | React escapes text content by default; introducing raw HTML rendering here would open a stored-XSS path since task content is user-supplied and persisted |
| 5 | Client-side `title.trim()` check is a UX nicety only — the real enforcement is still the backend's `required: true` on the schema (Practical 5) | Never rely on frontend validation as the security boundary; confirm the backend still rejects an empty title even if the frontend guard is bypassed (e.g. via direct API call) |
| 6 | Atlas Network Access is not left on `0.0.0.0/0` beyond what's needed for the lab session, if avoidable | Reduces exposure of the database to the open internet; acceptable to use `0.0.0.0/0` for coursework convenience, but should be a conscious choice, not a default left unexamined |
| 7 | No API keys, tokens, or credentials of any kind hardcoded into `src/api/tasks.js` or any frontend file | Anything shipped in frontend JS is publicly visible in the browser; this API doesn't need auth for the assignment, but this constraint should hold regardless |

---

## 5. Bug-proofing checklist (specific failure modes to explicitly test against, not just "it works on the happy path")

| # | Scenario | Required behavior |
|---|---|---|
| 1 | Backend is stopped, user tries to create a task | Optimistic task appears, then is rolled back cleanly on fetch failure; error toast shown; no stuck/duplicate/ghost tasks remain in the list |
| 2 | User double-clicks "Create" quickly | Either the button is disabled while a create is in flight, or duplicate submissions are otherwise prevented — no duplicate temp tasks from one intended action |
| 3 | User submits an empty or whitespace-only title | Blocked client-side before any request is sent; if bypassed, backend's `required: true` still rejects it with a structured 400 |
| 4 | User navigates away from `/tasks` while a toast timer is pending | No React "state update on unmounted component" warning in console |
| 5 | Two tasks are deleted in quick succession | Both requests resolve independently; state ends up correctly reflecting both deletions, not just the last one to resolve |
| 6 | User loads `/tasks` with no internet/backend reachable at all | Initial loading state shows, then a clear error state — not an infinite spinner, not a blank white section |
| 7 | A task has no `description` | Renders cleanly with no `undefined` text visible, and no layout break from a missing optional field |
| 8 | Rapid toggling of "Complete" on the same task multiple times | Each request is independent; final displayed state matches whatever the server actually holds after the last request resolves, not necessarily the last click if requests resolve out of order (acceptable to note as a known limitation if not solved, but must not crash or desync from a visibly wrong "success" toast) |
| 9 | Dark mode toggled while `/tasks` is open | All Tasks-related UI (cards, form, toast, buttons) updates correctly with no unstyled/wrong-color elements left over |
| 10 | Malformed/garbage task id somehow reaches the frontend (e.g. stale state) | `updateTask`/`deleteTask` calls against it surface the backend's existing 404 as a clean error toast, not an unhandled exception |

---

## 6. Manual test plan (run after implementation, before calling this done)

Run both servers in separate terminals:
```bash
# Terminal 1
cd task-manager-api-D25IT118
npm start

# Terminal 2
cd Portfolio-D25IT118
npm run dev
```

1. Open `http://localhost:5173/tasks` — task list loads from MongoDB Atlas.
2. Create a task with title + description — appears instantly, then confirms with the real `_id` shortly after (visually distinguishable via the reduced-opacity state disappearing).
3. Create a task with an empty title — nothing happens, no request sent (check Network tab).
4. Toggle a task's completed state — strikethrough applies/removes correctly, persists after refresh.
5. Delete a task — confirm dialog appears; canceling leaves the task; confirming removes it.
6. Refresh the browser — all remaining tasks still present (proves MongoDB persistence, not local-only state).
7. Stop the backend (`Ctrl+C`), attempt to create a task — error toast appears, no ghost task remains; restart the backend and confirm the app recovers on next action.
8. Open DevTools console — zero errors, zero warnings, throughout steps 1–7.
9. Open DevTools Network tab — confirm no CORS errors, and that `OPTIONS` preflight (if triggered) succeeds.
10. Toggle dark mode on `/tasks` — visually inspect card, form, buttons, and toast all render correctly.
11. Open MongoDB Atlas → Browse Collections → `taskmanager.tasks` — confirm the documents shown match exactly what the UI displays.
12. Directly call `POST /tasks` via curl/Postman with an empty title while the frontend is closed — confirm the backend still returns a structured 400 (proves the security boundary in Section 4, item 5 isn't only enforced client-side).

---

## 7. README updates

Both repos' `README.md` get a new **Practical 6** section appended (do not remove or rewrite existing Practical 1–5 sections):
- Frontend README: summarize the `/tasks` page, CRUD behavior, optimistic UI, confirm dialog, toasts, dark-mode support
- Backend README: summarize the `cors()` addition and the origin-restriction choice

---

## 8. File change summary

**Backend (`task-manager-api-D25IT118`) — new/changed:**
- `package.json` (new dependency: `cors`)
- `.env` (new, gitignored)
- `.env.example` (new, committed)
- `server.js` (edited: add `cors` import + `app.use(cors(...))`)

**Frontend (`Portfolio-D25IT118`) — new/changed:**
- `src/api/tasks.js` (new)
- `src/components/Toast.jsx` (new)
- `src/components/Tasks.jsx` (new)
- `src/components/Tasks.css` (new)
- `src/pages/TasksPage.jsx` (new)
- `src/App.jsx` (edited: add one `<Route>`)
- `src/components/navbar.jsx` (edited: add one `<NavLink>`)
- `README.md` in both repos (edited: append Practical 6 section)

Nothing outside this list should change. If Antigravity finds a genuine bug in an untouched Practical 1–5 file while working through this brief, flag it back to Diya rather than silently fixing or refactoring it — those files map to already-submitted/graded work.
