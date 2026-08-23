# Practical 7 — Authentication and Middleware Pipeline
### Implementation Brief for Antigravity — CHARUSAT ITUE301, D25IT118

**Read this whole file before writing any code.** This adds JWT-based auth on top of the already-working, already-graded Practical 6 full-stack app. Do not restructure or rewrite existing task CRUD logic — you are wrapping it with authentication, not replacing it.

**Repos involved:**
- Backend: `task-manager-api-D25IT118`
- Frontend: `Portfolio-D25IT118`

**Prerequisite:** Practical 6 (working full-stack Task Management app, both repos, CORS-enabled) is complete and working before starting this.

---

## 0. Goal

Add user registration and login to the Task Management app. Passwords are hashed with bcrypt before storage. A successful login returns a JWT (1-hour expiry). Every task route (`GET/POST/PUT/DELETE /tasks*`) is protected by auth middleware that verifies the JWT and rejects requests without a valid one. Server-side validation rejects malformed task input (e.g. missing title) independently of whatever the frontend already checks. The React frontend gains a login/register flow, stores the token, attaches it to every task request, and redirects to login on a 401.

---

## 1. Aim satisfaction table

| Practical | Aim | How Practical 7 satisfies / preserves it |
|---|---|---|
| 4 — RESTful API | CRUD endpoints, logging, global error handler, status codes | Untouched. Auth wraps these routes; their internal logic is unchanged. |
| 5 — MongoDB + Mongoose | Real DB-backed CRUD, structured validation errors | Untouched. New `User` model follows the same schema/validation pattern already established by `Task`. |
| 6 — Full Stack Integration | CORS, frontend CRUD, UI/server state sync, loading+error on every write | Untouched and still fully functional — task CRUD continues to work exactly as before, just now requires a valid token. |
| 7 — Authentication and Middleware Pipeline | Register/login, bcrypt hashing, JWT with expiry, auth middleware on all task routes, server-side input validation independent of frontend | This is the primary subject of this document — Sections 2–5. |

If this work breaks any Practical 4–6 functionality (an existing endpoint's success-path response shape changes, CORS breaks, task CRUD stops working once logged in), that's a regression and must be fixed before this is done.

---

## 2. Backend subtasks — `task-manager-api-D25IT118`

### 2.1 Install
```bash
npm install bcryptjs jsonwebtoken
```

### 2.2 Environment — add to `.env` (and `.env.example` with a placeholder)
```
JWT_SECRET=<a long random string, not committed with a real value>
JWT_EXPIRES_IN=1h
```
`JWT_SECRET` must never be hardcoded anywhere in source. `.env.example` should show `JWT_SECRET=changeme_in_local_env` as a placeholder only.

### 2.3 New file: `models/User.js`
```javascript
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Enter a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
  },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
```
Note: `password` here stores the **hashed** value only — never the plaintext. The `minlength` validates the plaintext length at the controller level before hashing (see 2.4), not the hash's length.

### 2.4 New file: `controllers/authController.js`
Implements three handlers: `register`, `login`, `me`.

**`register(req, res, next)`:**
- Destructure `email`, `password` from `req.body`
- Validate presence and password length (≥6 chars) *before* attempting to hash/save — return `400` with a structured `{ error }` if invalid (mirrors the existing errorHandler pattern from Practical 5)
- Check no existing user has that email (case-insensitive) — return `400 { error: 'Email already registered' }` if so, without leaking whether it's the email or something else in the message
- `const hashedPassword = await bcrypt.hash(password, 10)`
- `const user = await User.create({ email, password: hashedPassword })`
- Respond `201` with `{ id: user._id, email: user.email }` — **never include the password hash in any response, ever**
- Wrap in try/catch, forward unexpected errors to `next(err)`

**`login(req, res, next)`:**
- Destructure `email`, `password`
- Find user by email; if not found, respond `401 { error: 'Invalid credentials' }`
- `const isMatch = await bcrypt.compare(password, user.password)`; if false, respond `401 { error: 'Invalid credentials' }`
- **Use the same generic "Invalid credentials" message for both "no such user" and "wrong password"** — do not let the error message reveal whether the email exists (a basic user-enumeration protection)
- On match: `const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1h' })`
- Respond `200 { token, user: { id: user._id, email: user.email } }`

**`me(req, res, next)`:**
- Assumes `req.user` was already set by the auth middleware (see 2.5)
- Fetch the user by `req.user.id`, excluding the password field: `User.findById(req.user.id).select('-password')`
- If not found (edge case: user deleted after token was issued), respond `404`
- Respond `200` with the user object

### 2.5 New file: `middleware/auth.js`
```javascript
const jwt = require('jsonwebtoken');

module.exports = function auth(req, res, next) {
  const header = req.headers.authorization;
  const token = header?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id: <userId>, iat, exp }
    next();
  } catch (err) {
    // jwt.verify throws on missing/invalid/expired token — never let this crash the process
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
```
This is the middleware referenced in the practical's architecture diagram — verifies the token, sets `req.user`, and only calls `next()` on success. A missing or bad token never reaches the controller.

### 2.6 New file: `middleware/validateTaskInput.js`
Server-side validation independent of the frontend, applied on `POST`/`PUT` task routes:
```javascript
module.exports = function validateTaskInput(req, res, next) {
  const { title } = req.body;

  // On create, title is required. On update, only validate it if the caller is trying to change it.
  if (req.method === 'POST' && (!title || typeof title !== 'string' || !title.trim())) {
    return res.status(400).json({ error: 'Title is required and must be a non-empty string' });
  }
  if (req.method === 'PUT' && title !== undefined && (typeof title !== 'string' || !title.trim())) {
    return res.status(400).json({ error: 'Title must be a non-empty string' });
  }

  next();
};
```
This runs *before* the request reaches Mongoose — it's a fast-fail layer in front of the schema validation Practical 5 already has, not a replacement for it. Both layers stay in place (see Section 4, item 5 for why).

### 2.7 New file: `routes/authRoutes.js`
```javascript
const express = require('express');
const router = express.Router();
const { register, login, me } = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', auth, me);

module.exports = router;
```

### 2.8 `routes/taskRoutes.js` — protect every task route
Add the `auth` middleware to every route, and `validateTaskInput` to the write routes:
```javascript
const auth = require('../middleware/auth');
const validateTaskInput = require('../middleware/validateTaskInput');
// ...existing requires

router.get('/', auth, getAllTasks);
router.get('/:id', auth, validateTaskId, getTaskById);
router.post('/', auth, validateTaskInput, createTask);
router.put('/:id', auth, validateTaskId, validateTaskInput, updateTask);
router.delete('/:id', auth, validateTaskId, deleteTask);
```
Order matters: `auth` first (reject unauthenticated requests before doing any other work), then `validateTaskId`/`validateTaskInput`, then the controller.

### 2.9 `server.js`
Mount the new auth routes:
```javascript
const authRoutes = require('./routes/authRoutes');
// ...
app.use('/auth', authRoutes);
```
Add this alongside the existing `app.use('/tasks', taskRoutes)` line — do not remove or reorder existing middleware (`cors`, `express.json`, `requestLogger`, `requireJson`).

### 2.10 Backend Definition of Done
- [ ] `POST /auth/register` creates a user with a bcrypt-hashed password (never plaintext, never returned in any response)
- [ ] `POST /auth/login` returns a valid JWT on correct credentials, `401` on wrong email or password with an identical generic message for both cases
- [ ] `GET /auth/me` returns the current user's `{ id, email }` when called with a valid token, `401` without one
- [ ] Every `/tasks*` route returns `401` when called with no token, an invalid token, or an expired token
- [ ] Every `/tasks*` route still works exactly as in Practical 6 when called *with* a valid token
- [ ] `POST`/`PUT /tasks` with a missing/empty title is rejected `400` by `validateTaskInput`, before Mongoose is even touched
- [ ] `JWT_SECRET` is never hardcoded or logged anywhere
- [ ] `jwt.verify()` is always wrapped in try/catch — a malformed token must never crash the server

---

## 3. Frontend subtasks — `Portfolio-D25IT118`

### 3.1 New file: `src/api/auth.js`
Same pattern as `src/api/tasks.js` from Practical 6:
```javascript
const BASE_URL = 'http://localhost:5000';

async function handleResponse(res) {
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error ?? `Request failed (status ${res.status})`);
  return data;
}

export const registerUser = (email, password) =>
  fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  }).then(handleResponse);

export const loginUser = (email, password) =>
  fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  }).then(handleResponse);

export const getMe = (token) =>
  fetch(`${BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then(handleResponse);
```

### 3.2 Token storage — new file: `src/context/AuthContext.jsx`
A small React context holding `{ token, user, login(token, user), logout() }`. Persist `token` in `localStorage` (acceptable for a coursework JWT demo — do not overthink this into a bigger auth system than the practical asks for) so a page refresh doesn't immediately log the user out. On mount, if a token exists in `localStorage`, attempt `getMe(token)` to restore `user`; on failure (expired/invalid), clear the stored token and treat the user as logged out.

`logout()` clears both the in-memory state and `localStorage`, satisfying the supplementary "logout mechanism" requirement.

### 3.3 Update `src/api/tasks.js`
Every function must now attach the token. Simplest approach: accept `token` as the first argument to each exported function, and include `Authorization: Bearer ${token}` in headers:
```javascript
export const getTasks = (token) =>
  fetch(`${BASE_URL}/tasks`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then(handleResponse);
```
Apply the same pattern to `createTask`, `updateTask`, `deleteTask`. `Tasks.jsx` (from Practical 6) must be updated to pull `token` from `AuthContext` and pass it into every call.

**401 handling (supplementary requirement):** in `handleResponse`, if `res.status === 401`, throw a distinguishable error (e.g. `new Error('SESSION_EXPIRED')` or attach `err.status = 401`) so `Tasks.jsx` can catch this specific case and redirect to `/login` (via the auth context's `logout()` + a route change) instead of just showing a generic error toast.

### 3.4 New file: `src/pages/LoginPage.jsx`
Controlled form (email, password), calls `loginUser`, on success calls the auth context's `login(token, user)` and navigates to `/tasks`. On failure, shows the backend's error message inline (reuse the site's existing form/input styling from `Contact.jsx` for visual consistency — don't invent a new form style).

### 3.5 New file: `src/pages/RegisterPage.jsx`
Same shape as `LoginPage.jsx`, calls `registerUser`, on success redirects to `/login` with a success message (or auto-logs-in if you want to skip the extra step — either is acceptable, pick one and be consistent).

### 3.6 Route protection
Add a small `ProtectedRoute` wrapper (or inline check in `TasksPage.jsx`) that redirects to `/login` if `AuthContext`'s `token` is null. Add routes:
```jsx
<Route path="/login" element={<LoginPage />} />
<Route path="/register" element={<RegisterPage />} />
<Route path="/tasks" element={<ProtectedRoute><TasksPage /></ProtectedRoute>} />
```

### 3.7 `App.jsx`
Wrap the whole app (or at least the `<Routes>` tree) in `<AuthProvider>` from `AuthContext.jsx`.

### 3.8 `navbar.jsx`
Add conditional nav items: show "Login" when logged out; show "Logout" (calling the auth context's `logout()`, then redirecting home) when logged in. Keep the existing Home/Projects/Contact/Tasks links unchanged.

### 3.9 Frontend Definition of Done
- [ ] Visiting `/tasks` while logged out redirects to `/login`
- [ ] Registering, then logging in, grants access to `/tasks`
- [ ] All task CRUD from Practical 6 still works, now authenticated
- [ ] Refreshing the browser while logged in keeps the user logged in (token persisted, `/auth/me` restores user)
- [ ] Manually expiring/corrupting the stored token (e.g. via DevTools) and then trying a task action redirects to `/login` rather than showing a confusing generic error
- [ ] Logout clears the token and returns the user to a logged-out state

---

## 4. Security checklist

| # | Requirement | Why |
|---|---|---|
| 1 | Passwords hashed with `bcrypt.hash(password, 10)`, never stored or logged in plaintext | If the database is ever leaked, plaintext passwords compromise every user's account on every other site where they reused that password. Bcrypt is deliberately slow and auto-salts, unlike a fast hash like SHA-256. |
| 2 | Login returns the identical error message/status for "no such user" and "wrong password" | Distinguishing the two lets an attacker enumerate valid emails registered in the system. |
| 3 | Password hash is never included in any API response (`register`, `login`, `me` all exclude it) | Even a hashed password shouldn't leave the server unnecessarily — reduces exposure if a response is logged, cached, or intercepted. |
| 4 | `JWT_SECRET` lives only in `.env`, is never hardcoded, logged, or committed | Anyone with the secret can forge valid tokens for any user id. |
| 5 | Server-side `validateTaskInput` + Mongoose schema validation both remain in place; frontend validation is UX-only | The frontend can always be bypassed by a direct API call — the server is the real boundary, same principle as Practical 6's security section. |
| 6 | `jwt.verify()` always wrapped in try/catch in the auth middleware | An unhandled throw here would crash the whole Node process on a single malformed request — a trivial denial-of-service. |
| 7 | Token stored in `localStorage` is acceptable for this coursework scope, but note it in the README as a known simplification (an httpOnly cookie would be the production-grade choice, out of scope here) | Sets accurate expectations for viva — shows awareness of the trade-off rather than presenting it as unconsidered. |
| 8 | Auth middleware applied to **every** task route, including `GET` | Task data is user-relevant information; an unauthenticated `GET /tasks` would leak all tasks to anyone, not just reads being "safe by default." |

---

## 5. Bug-proofing checklist

| # | Scenario | Required behavior |
|---|---|---|
| 1 | Register with an email that already exists | `400`, clear message, no user duplicated, no server crash |
| 2 | Register with a password under 6 characters | `400` before any bcrypt/DB work happens |
| 3 | Login with correct email, wrong password | `401`, generic "Invalid credentials" |
| 4 | Login with an email that was never registered | `401`, same generic message as #3 |
| 5 | Call `/tasks` with no `Authorization` header at all | `401 { error: 'No token provided' }`, not a crash or a 500 |
| 6 | Call `/tasks` with `Authorization: Bearer garbage` | `401 { error: 'Invalid or expired token' }` |
| 7 | Call `/tasks` with a token signed with a different secret | Rejected exactly like an invalid token — `jwt.verify` fails closed |
| 8 | Token expires while the user has `/tasks` open and they try an action | Frontend catches the `401`, clears the stale token, redirects to `/login` — no infinite retry loop, no stuck loading spinner |
| 9 | User logs out, then presses browser back button to `/tasks` | Route guard re-checks auth state and redirects to `/login` again, doesn't show stale cached task data |
| 10 | Two tabs open, user logs out in one | Acceptable for this scope if the other tab only notices on its next API call (not required to sync in real time) — but it must not silently keep working against `/tasks` with a token that's been logically invalidated client-side; note this as a known limitation if not solved |

---

## 6. Manual test plan

Run both servers:
```bash
# Terminal 1
cd task-manager-api-D25IT118
npm start

# Terminal 2
cd Portfolio-D25IT118
npm run dev
```

1. `POST /auth/register` via curl/Postman with a new email/password → `201`, no password in response.
2. Repeat the same registration → `400`, "Email already registered" (or equivalent).
3. `POST /auth/login` with correct credentials → `200`, receive a token.
4. `POST /auth/login` with wrong password → `401`, generic message.
5. `GET /auth/me` with the token from step 3 in the `Authorization: Bearer <token>` header → `200`, correct user.
6. `GET /tasks` with no header → `401`.
7. `GET /tasks` with the valid token → `200`, task list (proves Practical 6 CRUD still works end-to-end).
8. `POST /tasks` with a valid token but empty title → `400` from `validateTaskInput`.
9. In the browser: visit `/tasks` directly while logged out → redirected to `/login`.
10. Register via the UI, log in, land on `/tasks`, create/complete/delete a task — confirm it still all works exactly like Practical 6.
11. Refresh the browser while logged in → still logged in, tasks still load.
12. In DevTools, edit/corrupt the stored token, then click any task action → redirected to `/login`, no crash, no infinite spinner.
13. Click Logout → returned to logged-out state; attempting to revisit `/tasks` redirects to `/login`.
14. Confirm `.env`/`JWT_SECRET` is not present anywhere in git history or committed files (`git log -p -- .env` should show nothing if `.gitignore` was correct from the start).

---

## 7. README updates

Both repos get a new **Practical 7** section appended (existing Practical 1–6 sections stay untouched):
- Backend README: document `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, and note that all `/tasks*` routes now require `Authorization: Bearer <token>`
- Frontend README: document the login/register flow, token persistence approach, and logout

---

## 8. File change summary

**Backend (`task-manager-api-D25IT118`) — new/changed:**
- `package.json` (new deps: `bcryptjs`, `jsonwebtoken`)
- `.env` / `.env.example` (add `JWT_SECRET`, `JWT_EXPIRES_IN`)
- `models/User.js` (new)
- `controllers/authController.js` (new)
- `middleware/auth.js` (new)
- `middleware/validateTaskInput.js` (new)
- `routes/authRoutes.js` (new)
- `routes/taskRoutes.js` (edited: add `auth`/`validateTaskInput` to every route)
- `server.js` (edited: mount `/auth` routes)

**Frontend (`Portfolio-D25IT118`) — new/changed:**
- `src/api/auth.js` (new)
- `src/api/tasks.js` (edited: every function now takes/sends a token; 401s surfaced distinctly)
- `src/context/AuthContext.jsx` (new)
- `src/pages/LoginPage.jsx` (new)
- `src/pages/RegisterPage.jsx` (new)
- `src/components/ProtectedRoute.jsx` (new, or inline in `TasksPage.jsx`)
- `src/components/Tasks.jsx` (edited: pull token from context, handle 401 → redirect)
- `src/App.jsx` (edited: wrap in `AuthProvider`, add `/login`, `/register` routes, protect `/tasks`)
- `src/components/navbar.jsx` (edited: conditional Login/Logout link)
- `README.md` in both repos (edited: append Practical 7 section)

Nothing outside this list should change. If Antigravity finds a bug in untouched Practical 1–6 code while working through this, flag it back to Diya rather than silently fixing it.
