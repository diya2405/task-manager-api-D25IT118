# Practical 6 — Full Stack Integration (React + Node + MongoDB)

**Instructions for Antigravity:** implement the changes below across the two existing repos. Do not restructure unrelated files. Match the existing code style (function components, no TypeScript, plain CSS) and the existing dark-mode mechanism (`body.classList.toggle('dark', darkMode)` from `navbar.jsx`) — new UI must respond to the same `.dark` class, not introduce a second theme system.

**Repos involved:**
- Frontend: `Portfolio-D25IT118`
- Backend: `task-manager-api-D25IT118`

**Aim:** Connect the React frontend (Practicals 1–3) to the Node/Express/MongoDB backend (Practicals 4–5) into one working full-stack app: create, view, update, and delete tasks from the UI, all persisted in MongoDB Atlas, with loading and error states handled for every API call (not just the initial fetch).

---

## 1. Backend changes — `task-manager-api-D25IT118`

### 1.1 Install
```bash
npm install cors
```

### 1.2 `.env` (root of repo, gitignored — do not commit)
```
MONGO_URI=<ATLAS_CONNECTION_STRING_GOES_HERE>
PORT=5000
```
> Diya will supply the actual Atlas connection string separately. Add `.env.example` with the same keys but a placeholder value, and commit that instead.

### 1.3 `server.js` — add CORS before the route definitions
Add near the top:
```javascript
const cors = require('cors');
```
Add immediately after `express.json()` setup (before `app.use('/tasks', taskRoutes)`):
```javascript
app.use(cors());
```
No other changes to `server.js`, `models/Task.js`, `controllers/taskController.js`, `routes/taskRoutes.js`, or any middleware — Practical 5's logic is reused as-is.

### 1.4 Verify
Run `npm start` — should log `MongoDB connected` and `Server running on http://localhost:5000` with no errors. This confirms Atlas is reachable (check Atlas → Network Access allows the current IP, or `0.0.0.0/0` for lab use).

---

## 2. Frontend changes — `Portfolio-D25IT118`

### 2.1 New file: `src/api/tasks.js`
Central fetch client for the backend. Base URL: `http://localhost:5000`. Export `getTasks`, `createTask`, `updateTask`, `deleteTask`. Each function should:
- Use `fetch` with appropriate method/headers/body
- Parse the JSON response
- On a non-`ok` response, throw an `Error` using the backend's `{ error }` message field (fall back to a generic message if parsing fails)
- On success, return the parsed data

### 2.2 New file: `src/components/Toast.jsx`
Small floating notification component. Props: `message`, `type` (`'success' | 'error'`). Renders `null` when `message` is empty. Fixed-position bottom-right, auto-styled via `Tasks.css` (not inline styles), a small colored dot + text, distinct color for success vs error.

### 2.3 New file: `src/components/Tasks.css`
Styling that matches the site's existing visual language:
- Mono-font, underlined section label in the accent color (same treatment as `about.js`, `skills.json`, `projects.md` labels elsewhere in the site) — e.g. `tasks.live`
- Card container with rounded corners and subtle shadow in light mode; borderless, dark background with a thin border in `.dark` mode (mirror how other cards in the site invert for dark mode)
- Form: stacked input(s) + a small pill/rounded button in the site's accent color
- Task list: each task as its own row/card — title (strikethrough + muted color when completed), optional description below in smaller muted text, action buttons (Complete/Undo, Delete) aligned right
- A task still awaiting server confirmation (optimistic, temp id) should render at reduced opacity
- Toast: fixed bottom-right, colored background (green for success, red for error), slide/fade-in animation
- All colors must have a `.dark &` / `.dark .classname` override consistent with the rest of the site's dark mode — no hardcoded colors that break in dark mode

### 2.4 New file: `src/components/Tasks.jsx`
Full CRUD component, following patterns already established in `ProjectsPage.jsx` (loading/error state shape, retry pattern) and `Contact.jsx` (controlled inputs). Requirements:

- `useState` for: `tasks` (array), `loading` (bool), `error` (string|null), `title` (form input), `description` (form input), `toast` (`{ message, type }`)
- `useEffect` on mount: call `getTasks()`, populate `tasks`, manage `loading`/`error`
- **Create (optimistic):** on submit, immediately push a temp task (`_id: 'temp-' + Date.now()`) into state so the UI updates instantly, clear the form, then call `createTask()`. On success, replace the temp task with the real server response. On failure, remove the temp task and show an error toast — never leave a fake task stuck in the list.
- **Toggle complete:** call `updateTask(id, { completed: !current })`; replace that task in state with the server's response; show a success/error toast.
- **Delete:** show `window.confirm(...)` first; only proceed if confirmed; call `deleteTask(id)`; remove from state on success; toast on both outcomes.
- Every write operation (create/update/delete) must be wrapped in try/catch and reflect failure to the user via toast — per the practical's requirement that write errors get the same handling rigor as read errors, not silently assumed to succeed.
- Import and use `Tasks.css` and `Toast.jsx`.
- JSX structure: `<section className="tasks-section">` → `<div className="tasks-card">` → mono label → form → loading/error/empty states → `<ul className="task-list">`.

### 2.5 Route wiring — `App.jsx`
Add a new page component `src/pages/TasksPage.jsx` (thin wrapper rendering `<Tasks />`, same pattern as `ContactPage.jsx` wrapping `<Contact />`), and register a new route:
```jsx
<Route path="/tasks" element={<TasksPage />} />
```
Do not remove or alter the existing `/`, `/projects`, `/contact`, or `*` (NotFound) routes.

### 2.6 Nav link — `navbar.jsx`
Add one more `<li><NavLink to="/tasks">Tasks</NavLink></li>` alongside the existing Home/Projects/Contact links, same style, no new logic needed (existing dark-mode toggle logic in this file is untouched).

---

## 3. Verification checklist (for screenshots / lab file evidence)

Run both servers simultaneously in separate terminals:
```bash
# Terminal 1
cd task-manager-api-D25IT118
npm start

# Terminal 2
cd Portfolio-D25IT118
npm run dev
```

1. Navigate to `http://localhost:5173/tasks` — task list loads from MongoDB Atlas (not empty/hardcoded).
2. Create a task — appears instantly (optimistic), confirms against server shortly after.
3. Toggle complete — title gets strikethrough, persists.
4. Delete a task — confirm dialog appears, task removed after confirming.
5. Refresh the browser — all tasks still present (proves MongoDB persistence, not local state).
6. Stop the backend server, attempt to create a task — error toast appears, optimistic task rolls back cleanly (no stuck fake entries).
7. Open browser DevTools console — no CORS errors.
8. Screenshot MongoDB Atlas (Browse Collections) showing the same `tasks` documents as the UI, to prove they match.

---

## 4. README updates

Both repo README.md files should get a new "Practical 6" section (frontend README: UI-side summary; backend README: `cors()` addition summary) — same format as the existing Practical 1–5 sections in each README. Do not remove or rewrite the existing Practical 1–5 sections.
