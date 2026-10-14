# Admin-Only Authentication & Streamlined Account Management

Transform FinancialFree authentication into a secure, streamlined admin-only system. Remove Google Sign-In and hCaptcha human verification entirely, eliminate phone number requirements, enforce pre-approved administrator email validation during login, and implement role-based account creation on both the login screen and inside the Admin Settings dashboard.

### User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural decisions were confirmed through interactive requirements clarification:

- **Confirmed Decision 1**: Account creation will be available **both inside the admin dashboard and directly on the login screen**.
- **Confirmed Decision 2**: Login access is strictly limited to **pre-approved administrator email addresses** (and accounts verified with the `admin` role). Non-admin attempts will be rejected with clear access-denied messaging.
- **Confirmed Decision 3**: Required fields for creating accounts are **Full Name, Email, Password, and Role selection** (`Admin` or `Standard User`), completely removing the phone number and human verification challenges.

---

## 1. Overview & Core Concept

- **What It Does**: Replaces the hybrid public registration and captcha-gated portal with a focused administrative portal. Eliminates third-party Google sign-in popups and hCaptcha widgets, removes unnecessary phone number fields, protects the sign-in endpoint so only authorized admins can log in, and introduces intuitive account creation capabilities with role assignment both pre-login and post-login.
- **Target Audience / Persona**: System administrators, financial managers, and authorized operators managing transactions, budgets, people, and reminders.
- **Key Value**: Frictionless, zero-captcha administrative login speed, clean UI without third-party external dependencies, and complete role-governed user provisioning.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Admin Login Flow**:
   - The user navigates to the login screen.
   - Clean, focused interface with two tabs: **Admin Sign In** and **Create Account**.
   - No Google Sign-In button; no captcha widgets or verification badges.
   - User enters administrator email and password.
   - Server validates credentials and confirms the email belongs to the pre-approved administrator directory or has an `admin` role. If unauthorized, a clean error alert is displayed.
   - On success, the admin is routed directly to the Financial Dashboard.

2. **Streamlined Account Creation (Login Screen)**:
   - User switches to the **Create Account** tab.
   - Inputs: **Full Name**, **Email Address**, **Password**, and **Role Selector** (Admin vs Standard User).
   - Phone number input and captcha boxes are completely gone.
   - Successfully created account is registered into the database and can be immediately managed or used according to its assigned role.

3. **In-Dashboard Account Management (Settings Page)**:
   - Logged-in admins navigate to **Settings > Admin & Team Accounts**.
   - An intuitive user management table displays active accounts, email, assigned role, and creation dates.
   - An **"Add New Account"** modal allows admins to provision team accounts or co-admins with Full Name, Email, Password, and Role selection without leaving their session.

4. **Streamlined Password Recovery**:
   - The Forgot Password modal remains available for admins to reset their credentials using email verification codes, with hCaptcha challenges removed.

### Visual Identity & Theme
- **Aesthetic Direction**: Minimal, utilitarian dark/light corporate financial dashboard complying with the SaaS design guidelines.
- **Color Palette**: Deep dark slate `#0F172A` / `#1E293B` surfaces in dark mode, crisp clean `#FFFFFF` in light mode, emerald `#10B981` primary accents, and crimson `#EF4444` for security rejection alerts.
- **Typography**: Clean sans hierarchy with `Plus Jakarta Sans` / `Outfit`, single-line button controls (`whitespace-nowrap shrink-0`), and tabular numbers (`tabular-nums font-mono`).
- **Zero-Slop Restraint**: No decorative pulsing dots, no fake security scoreboards, no pill badge sandwiches, and clean unboxed metadata.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Elimination of Google Sign-In & hCaptcha**:
  - *Chosen Approach*: Fully remove Google Sign-In button, Google Firebase popup triggers, and the hCaptcha verification widget and server checks.
  - *Why*: Eliminates iframe/cross-origin popup authorization blockers, removes third-party CAPTCHA loading latency, and simplifies the interface.
  - *Alternatives Considered*: Keeping captcha as an optional toggle was rejected as the user explicitly requested its full removal.

- **Decision 2: Admin-Only Login Enforcement**:
  - *Chosen Approach*: Enforce administrator pre-approval both in the backend API router (`/api/auth/login`) and database service. If an account has `role !== 'admin'` or is not in the approved admin directory, the login request is rejected with HTTP 403 / 401 and an explicit security message: "Access restricted: Only authorized administrators are permitted to sign in."
  - *Why*: Prevents non-administrative personnel from accessing system financial records, transactions, and audit logs.

- **Decision 3: Account Creation Scope (Dual-Surface)**:
  - *Chosen Approach*: Provide a clean creation form on the login screen as well as a "User & Admin Management" card inside the Settings page.
  - *Why*: Satisfies the user's preference for flexible provisioning while keeping the system secure and role-aware.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────┐
│                   FinancialFree Client                 │
├───────────────────────────┬────────────────────────────┤
│        LoginPage          │      SettingsPage (Admin)  │
│  ┌─────────────────────┐  │  ┌───────────────────────┐ │
│  │ Admin Login Form    │  │  │ User Management List  │ │
│  │ (Email + Password)  │  │  │ (View active accounts)│ │
│  ├─────────────────────┤  │  ├───────────────────────┤ │
│  │ Create Account Form │  │  │ "Add Account" Modal   │ │
│  │ (Name, Email, Pass, │  │  │ (Name, Email, Pass,   │ │
│  │  Role Selector)     │  │  │  Role Selector)       │ │
│  └─────────────────────┘  │  └───────────────────────┘ │
└─────────────┬───────────────────────────┬──────────────┘
              │                           │
              ▼                           ▼
┌────────────────────────────────────────────────────────┐
│                  Express Backend API                   │
├────────────────────────────────────────────────────────┤
│  POST /api/auth/login                                  │
│    - Checks credentials & enforces role === 'admin'    │
│  POST /api/auth/register                               │
│    - Accepts name, email, password, role               │
│    - No phone or hCaptcha required                     │
│  GET /api/admin/users  (requireAuth + admin guard)     │
│    - Returns list of system users and roles            │
│  POST /api/admin/users (requireAuth + admin guard)     │
│    - Provisions account directly from admin session    │
└─────────────────────────────┬──────────────────────────┘
                              ▼
┌────────────────────────────────────────────────────────┐
│                  Database Service & Storage            │
│   - Pre-approved Admin Directory                       │
│   - User accounts with role: 'admin' | 'user'          │
│   - Firestore cloud sync + local persistence           │
└────────────────────────────────────────────────────────┘
```

### Data Model Updates
- **User Record**:
  - `id`: string
  - `email`: string (unique, lowercase)
  - `name`: string
  - `role`: `'admin' | 'user'` (required)
  - `phone`: optional string (omitted from creation form)
  - `created_at`, `updated_at`: ISO timestamp

### Interactive Component & State Mapping
- `src/pages/LoginPage.tsx`:
  - Strip Google Sign-In and `handleGoogleSignIn`.
  - Strip `HCaptchaWidget`, `hcaptchaToken`, and captcha error validation logic.
  - Remove `regPhone` state and phone number input field.
  - Add `regRole` state (`'admin' | 'user'`, defaulting to `'admin'`).
  - Wire `handleRegisterSubmit` to send `name`, `email`, `password`, and `role`.
  - Update `handleLoginSubmit` to catch admin restriction errors and display distinct warning messaging.
- `src/context/AuthContext.tsx`:
  - Remove Google popup auth dependencies and captcha parameters from signatures.
  - Update `register` to accept `{ email, password, name, role }`.
  - Add admin user listing and management methods for the Settings view.
- `src/pages/SettingsPage.tsx`:
  - Add a dedicated "Admin & Team Accounts" card with user list, role badges, and an "Add Account" modal.
- `server/app.ts` & `server/db.ts`:
  - Remove `verifyHCaptcha` middleware and requirements from `/auth/login`, `/auth/register`, and `/auth/forgot-password`.
  - Update `db.login` to verify the user has the `admin` role or matches pre-approved administrator emails.
  - Update `db.register` to support `role` (`'admin' | 'user'`) without requiring a phone number.
  - Add admin endpoints (`GET /api/admin/users`, `POST /api/admin/users`) protected by `requireAuth`.
