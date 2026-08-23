# Practical 7 — UI Design Spec (Login / Register / Auth States)
### For Antigravity — companion to PRACTICAL7_FULL_SPEC.md

**Read `PRACTICAL7_FULL_SPEC.md` first** — that file owns the functional/logic requirements (auth flow, token handling, route protection, security). This file owns **only** visual/UI design for the new auth surfaces, so the login and register pages don't look like a bolted-on generic form — they should look like they belong on the same site as `/tasks`, `/projects`, and `/contact`.

**Design reference (do not deviate without reason):** inspect the existing site before writing any CSS —
- The mono, underlined, accent-colored section label pattern already used as `about.js`, `skills.json`, `projects.md`, `tasks.live`
- The card container treatment (rounded corners + subtle shadow in light mode; borderless dark background + thin border in `.dark` mode) already established in `Tasks.css` from Practical 6
- The pill-style accent-colored button (`Add Task` button) and the muted-gray secondary button style (`Complete`/`Delete` buttons)
- The toast component (`Toast.jsx`, `Tasks.css`) — reuse it as-is for auth success/error messages, don't build a second notification system
- The `.dark` class toggle mechanism from `navbar.jsx` — every new class needs a working dark-mode override, no exceptions

---

## 1. New file: `src/components/Auth.css`

Shared stylesheet for both Login and Register pages (they're visually identical except for field count and copy).

```css
.auth-section {
  max-width: 420px;
  margin: 0 auto;
  padding: 3rem 1rem;
  min-height: 60vh;
  display: flex;
  align-items: center;
}

.auth-card {
  width: 100%;
  background: #fff;
  border-radius: 12px;
  padding: 2.25rem 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.dark .auth-card {
  background: #111318;
  box-shadow: none;
  border: 1px solid #23262f;
}

.auth-label {
  font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
  font-size: 0.8rem;
  color: #6366f1;
  text-decoration: underline;
  text-underline-offset: 4px;
  display: block;
  margin-bottom: 0.35rem;
}

.dark .auth-label {
  color: #818cf8;
}

.auth-subtitle {
  font-size: 0.82rem;
  color: #6b7280;
  margin: 0 0 1.5rem;
}

.dark .auth-subtitle {
  color: #9ca3af;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.auth-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.auth-field label {
  font-size: 0.78rem;
  font-weight: 600;
  color: #374151;
}

.dark .auth-field label {
  color: #d1d5db;
}

.auth-field input {
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  font-size: 0.95rem;
  font-family: inherit;
  background: #fff;
  color: #111;
}

.dark .auth-field input {
  background: #1a1d24;
  border-color: #2c2f38;
  color: #eee;
}

.auth-field input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

.auth-field input.invalid {
  border-color: #dc2626;
}

.auth-field-error {
  font-size: 0.75rem;
  color: #dc2626;
  margin: 0;
}

.auth-submit {
  margin-top: 8px;
  padding: 10px 18px;
  border-radius: 8px;
  border: 1px solid #6366f1;
  background: #6366f1;
  color: #fff;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: opacity 0.15s;
}

.auth-submit:hover:not(:disabled) {
  opacity: 0.85;
}

.auth-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.auth-error-banner {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
  font-size: 0.82rem;
  padding: 8px 12px;
  border-radius: 8px;
  margin-bottom: 4px;
}

.dark .auth-error-banner {
  background: rgba(220, 38, 38, 0.12);
  border-color: rgba(220, 38, 38, 0.35);
  color: #f87171;
}

.auth-switch {
  margin-top: 1.25rem;
  text-align: center;
  font-size: 0.82rem;
  color: #6b7280;
}

.dark .auth-switch {
  color: #9ca3af;
}

.auth-switch a {
  color: #6366f1;
  font-weight: 600;
  text-decoration: none;
}

.dark .auth-switch a {
  color: #818cf8;
}

.auth-switch a:hover {
  text-decoration: underline;
}

/* Route-guard loading state (shown briefly while AuthContext restores a session on refresh) */
.auth-checking {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 40vh;
  font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
  font-size: 0.85rem;
  color: #6b7280;
}

.dark .auth-checking {
  color: #9ca3af;
}
```

---

## 2. `src/pages/LoginPage.jsx` — structure

```jsx
<section className="auth-section">
  <div className="auth-card">
    <span className="auth-label">auth.login</span>
    <p className="auth-subtitle">Log in to manage your tasks.</p>

    {/* auth-error-banner rendered here when login fails, e.g. "Invalid credentials" */}

    <form className="auth-form" onSubmit={...}>
      <div className="auth-field">
        <label htmlFor="login-email">Email</label>
        <input id="login-email" type="email" ... />
      </div>
      <div className="auth-field">
        <label htmlFor="login-password">Password</label>
        <input id="login-password" type="password" ... />
      </div>
      <button className="auth-submit" type="submit" disabled={submitting}>
        {submitting ? 'Logging in…' : 'Log In'}
      </button>
    </form>

    <p className="auth-switch">
      Don't have an account? <Link to="/register">Register</Link>
    </p>
  </div>
</section>
```

- `submitting` disables the button and swaps its label while the request is in flight — this is the "loading state for every API interaction" principle from Practical 6, applied to auth.
- On successful login: show a success `Toast` ("Logged in") briefly, then navigate to `/tasks`. Reuse `Toast.jsx`/`.toast`/`.toast-success` classes from `Tasks.css` exactly — don't create a second toast style.
- On failure: show the backend's error message in `.auth-error-banner` (inline, not a toast — inline is more appropriate for a form validation-style error the user needs to read and act on, whereas the toast is for transient confirmations).

---

## 3. `src/pages/RegisterPage.jsx` — structure

Same shape as Login, with these differences:
- `auth-label` reads `auth.register`
- Subtitle: `Create an account to get started.`
- Three fields: Email, Password, Confirm Password
- Client-side check: Password and Confirm Password must match before submitting — show `.auth-field-error` under the Confirm field if they don't (add `.invalid` class to that input), and don't submit the form. This is a UX nicety only; the backend doesn't need to know about "confirm password" at all (it only ever receives `email`/`password`).
- On success: show a success toast ("Account created — please log in") and redirect to `/login` (per the functional spec's chosen approach — do not auto-login here, keep the flow explicit: register → login → tasks).
- `auth-switch` text: `Already have an account? Log in`, linking to `/login`.

---

## 4. Route-guard loading state

While `AuthContext` is restoring a session from a stored token on initial page load (calling `/auth/me` to validate it), any protected route should render a brief centered state instead of flashing the login page or a blank screen:
```jsx
<div className="auth-checking">checking session…</div>
```
Use the `.auth-checking` class above — mono font, muted color, matches the site's terminal-esque aesthetic rather than a generic spinner graphic.

---

## 5. Navbar updates — `navbar.jsx`

Visual requirements, not just functional:
- When logged out: show a `Login` `NavLink` in the exact same style as `Home`/`Projects`/`Contact`/`Tasks` — no special treatment, just another nav item.
- When logged in: replace `Login` with `Logout` as a `<button>` styled to visually match the nav links (same font size/weight/color as the `NavLink`s, not styled like the `Add Task` pill button — it should read as navigation, not as a form action). On click, calls the auth context's `logout()` and redirects to `/`.
- Do not add a persistent "Logged in as X" text unless there's clearly room for it without crowding the existing Home/Projects/Contact/Tasks/theme-toggle row — if space is tight, the `/tasks` page itself is the better place to greet the user by email (optional, not required by the practical).

---

## 6. Empty/edge states to visually account for

| State | What to show |
|---|---|
| Login submitted, request in flight | Button reads "Logging in…", disabled, no layout shift |
| Login fails | `.auth-error-banner` appears above the form fields, form values are preserved (don't clear the email field on failure — only clear password for basic hygiene) |
| Register: passwords don't match | Red `.auth-field-error` under Confirm Password field, submit blocked client-side |
| Register succeeds | Toast + redirect to `/login`, login page shows an empty form (no need to prefill email — keep it simple) |
| Session check on page load | `.auth-checking` message, not a blank page or a flash of the login form before redirecting |
| Token expires mid-session on `/tasks` | Toast ("Session expired — please log in again") via the existing `Toast` component, then redirect to `/login` — reuse `.toast-error` styling |

---

## 7. Definition of Done (UI-specific)

- [ ] Login and Register pages visually match the rest of the site's card/label/button language — a user clicking from `/tasks` to `/login` shouldn't feel like they left the site
- [ ] Both pages work correctly in light and dark mode — check every class listed above has its `.dark` override actually applied, not just defined in CSS and never triggered
- [ ] No layout shift/jump when switching between idle → submitting → success/error states on either form
- [ ] Navbar's Login/Logout item is visually consistent with the other nav items, not styled as a stray button
- [ ] Session-restore loading state never flashes the login form before redirecting an already-logged-in user
- [ ] All auth-related user-facing text (button labels, error banners, toasts) uses plain, non-technical language — "Invalid credentials" not "401 Unauthorized", "Session expired — please log in again" not "Token verification failed"
