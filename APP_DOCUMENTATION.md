# NPCI Onboarding App — Documentation

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [How the App Works](#how-the-app-works)
4. [Application Flow](#application-flow)
5. [User Roles & Access Control](#user-roles--access-control)
6. [Pages & Routes](#pages--routes)
7. [API Endpoints](#api-endpoints)
8. [Database & Models](#database--models)
9. [Key Libraries & Utilities](#key-libraries--utilities)
10. [Environment Variables](#environment-variables)
11. [Deployment Guide](#deployment-guide)

---

## Overview

The NPCI Onboarding App is a **Next.js 16 (App Router)** web application that digitises the onboarding journey for new NPCI Group employees. It covers:

- OTP-based mobile login (no passwords)
- Document submission and admin review
- HR induction modules (SCORM + video)
- Buddy Q&A, onboarding kit selection, and a 15-day check-in
- A ready-reckoner (SPOC directory), timeline, and learning hub
- An admin panel for user management and document approval

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2 (App Router, React 19) |
| Styling | Tailwind CSS v4 (theme defined in CSS variables) |
| Animations | Framer Motion |
| Icons | Lucide React |
| Database | MongoDB (via Mongoose 9) |
| File Storage | MongoDB GridFS (`documents` bucket) |
| Email | Nodemailer (SMTP) |
| Notifications | React Hot Toast |
| Auth | Custom OTP flow (no NextAuth / JWT cookies) |
| Session | `localStorage` (key: `user`) |

---

## How the App Works

### Authentication — OTP Flow

1. User opens the app and picks a **role pill** (Employee or Admin) on the login screen.
2. Enters their registered **mobile number**.
3. The server checks that the user exists in MongoDB and `isAllowed = true`, then sets a 6-digit OTP with a 10-minute expiry on the user document.
4. In production the OTP is sent out-of-band (SMTP / SMS gateway). In demo mode the `DUMMY_OTP` env variable (default `000000`) is printed to the server console.
5. User enters the OTP; the server verifies it, clears it from the database, and sets `isVerified = true`.
6. A session object is written to `localStorage` (`name`, `mobile`, `role`, `isAdmin`, `isAllowed`, etc.).

> **Note:** Session validity is checked client-side only (`useRequireSession` hook). There are no HTTP-only cookies or server-side session tokens in the current implementation.

### Employee Journey (First-Time Login)

```
Splash (/) → Login (/login) → Welcome (/welcome) → Dashboard (/dashboard)
                                                         │
              ┌──────────────┬──────────────┬────────────┴──────────────┬──────────────┐
              ▼              ▼              ▼                           ▼              ▼
         Documents     HR Induction    Onboarding Kit             Buddy Q&A       15-Day Check-In
        (/documents)  (/learn/hr-…)  (/onboarding-kit)         (/know-more)      (/check-in)
```

Returning users hit `/` → detected valid session → sent straight to `/dashboard`.

### Admin Journey

Admin logs in with the **Admin** pill. After OTP verification, `isAdmin = true` is stored in the session and the user is routed to `/admin`.

---

## Application Flow

### Splash → Login

| Step | What happens |
|---|---|
| App loads at `/` | Plays animated splash; checks `localStorage` for existing session |
| Session found | Redirected to `/admin` (admin) or `/dashboard` (employee) |
| No session | After animation, redirected to `/login` |

### Login Page

- Two role pills: **Employee** and **Admin**
- Mobile number input → `POST /api/send-otp`
- OTP input → `POST /api/verify-otp` → `POST /api/get-user`
- Session stored in `localStorage`; navigate to `/welcome` (first-time employee) or `/admin`

### Dashboard

Central hub that shows:
- Onboarding progress bar
- Staged cards linking to all sub-modules
- Notification bell (in-app notifications from `NotificationContext`)
- Journey popup (milestone messaging)

### Document Submission

- Document list is generated from `lib/documentConfig.ts`, which **conditionally filters** documents by:
  - `employeeType` (`fresher` / `lateral`)
  - `entity` (`NPCI` / `NBBL` / `NIPL` / `NBSL`)
  - `band` (`B1` / `B2`)
- Each document can be uploaded (multipart form) → stored in **MongoDB GridFS**
- Status: `pending` → `approved` / `rejected` (set by admin)
- On approval, an email is sent to the UEM team (if `UEM_TEAM_EMAIL` is configured)

### HR Induction Modules

| Module | Type | Completion |
|---|---|---|
| Module 1 | SCORM iframe (`public/scorm/hr-induction/`) | SCORM API shim triggers `POST /api/mark-complete` |
| Module 2 | Local MP4 video (`public/videos/module-2.mp4`) | Video completion triggers `POST /api/mark-complete` |
| Module 3+ | Coming soon (placeholder cards) | — |

### Admin Panel

- Add / update / delete users
- Toggle `isAllowed` (enable / disable onboarding access)
- View all submitted documents; approve or reject each
- View buddy answers, check-in responses, and kit selections

---

## User Roles & Access Control

### Role Definitions

| Role | How set | Capabilities |
|---|---|---|
| **Employee** | Login pill selection; default role | Access all employee-facing pages and APIs |
| **Admin** | Login pill selection | Access `/admin` page and all `admin/*` API routes |

### HR Dimensions (Not RBAC — used for document filtering)

| Field | Options |
|---|---|
| `employeeType` | `fresher`, `lateral` |
| `entity` | `NPCI`, `NBBL`, `NIPL`, `NBSL` |
| `band` | `B1`, `B2` |
| `location` | `Hyderabad`, `Mumbai`, `Chennai` |

### Access Flags on the User Document

| Flag | Meaning |
|---|---|
| `isAllowed` | Set by admin; controls whether OTP can be sent to this user |
| `isVerified` | Set after successful OTP verification |
| `isAdmin` | Stored in MongoDB but **currently not used** for API gating; admin access today relies on `isAdmin` in the UI session (pill-selected) |

### API-Level Protection

| API group | Protection |
|---|---|
| `/api/send-otp`, `/api/verify-otp` | Checks `isAllowed` on user document |
| `/api/admin/*` | Requires `x-admin-key` header matching `ADMIN_ACCESS_KEY` env var **if that variable is set**; if unset, all admin APIs are open |
| All other APIs | No server-side session check (rely on client knowledge of `mobile`) |

> **Security note:** For production, consider adding server-side session validation (e.g., signed JWT or server-stored session token) and enabling `ADMIN_ACCESS_KEY`.

---

## Pages & Routes

| Route | Description |
|---|---|
| `/` | Animated splash; redirects based on session state |
| `/login` | OTP-based login with role pill |
| `/welcome` | Post-login welcome screen (first-time employees) |
| `/dashboard` | Main hub with progress and navigation cards |
| `/admin` | Admin panel (user management, document review) |
| `/documents` | Employee document upload and status tracking |
| `/timeline` | Static visual onboarding milestone timeline |
| `/know-more` | Buddy Q&A questionnaire |
| `/welcome-message` | Audio welcome with avatar |
| `/onboarding-kit` | Kit item selection |
| `/check-in` | 15-day check-in (ratings + open text) |
| `/videos` | YouTube-linked learning video grid |
| `/ready-reckoner` | Location-based SPOC directory (static data) |
| `/learn/hr-induction` | Module listing for HR induction |
| `/learn/hr-induction/module-1` | SCORM-based module |
| `/learn/hr-induction/module-2` | Video-based module |

All pages except `/` and `/login` are protected by `useRequireSession` (client-side redirect to `/login` if no session in `localStorage`).

---

## API Endpoints

All endpoints live under `app/api/` (Next.js App Router route handlers).

### Authentication

| Endpoint | Method | Description |
|---|---|---|
| `POST /api/send-otp` | POST | Validates mobile, checks `isAllowed`, generates and stores OTP |
| `POST /api/verify-otp` | POST | Validates OTP and expiry, sets `isVerified`, returns user flags |
| `POST /api/login` | POST | Returns profile slice for verified users (currently unused by UI) |
| `POST /api/get-user` | POST | Fetches full user profile by mobile |

### Employee Features

| Endpoint | Method | Description |
|---|---|---|
| `POST /api/update-docs` | POST | Multipart upload; stores file in GridFS, updates user's `documents[]` |
| `GET /api/documents/file/[id]` | GET | Streams a file from GridFS; `?download=1` for attachment |
| `POST /api/save-checkin` | POST | Saves 15-day check-in answers |
| `POST /api/update-kit` | POST | Saves selected onboarding kit items |
| `POST /api/update-buddy-answers` | POST | Saves buddy Q&A responses |
| `POST /api/mark-complete` | POST | Records module completion (currently logs only; no DB persistence) |

### Admin (require `x-admin-key` header if `ADMIN_ACCESS_KEY` is set)

| Endpoint | Method | Description |
|---|---|---|
| `GET /api/admin/get-users` | GET | Lists all users with full projection |
| `POST /api/admin/add-user` | POST | Creates or updates a user; sets `isAllowed: true` |
| `POST /api/admin/delete-user` | POST | Deletes a user by mobile |
| `POST /api/admin/update-user` | POST | Updates `employeeType`, `entity`, `band` |
| `POST /api/admin/toggle-user` | POST | Flips `isAllowed` flag |
| `POST /api/admin/update-doc-status` | POST | Sets document status to `approved`/`rejected`; emails UEM team on approval |

---

## Database & Models

### Connection

- **Engine:** MongoDB
- **Library:** Mongoose 9
- **Database name:** `npci-db` (hardcoded)
- **Config file:** `app/lib/mongodb.ts` — uses a global connection cache (safe for Next.js serverless/edge)

### User Schema (`app/models/User.ts`)

| Field | Type | Description |
|---|---|---|
| `name` | String | Full name |
| `mobile` | String (unique) | Primary identifier |
| `position` | String | Job title / designation |
| `role` | String | Mirrors `position` |
| `location` | String | Office location |
| `profileImageUrl` | String | Avatar URL |
| `employeeType` | String | `fresher` or `lateral` |
| `entity` | String | `NPCI`, `NBBL`, `NIPL`, `NBSL` |
| `band` | String | `B1` or `B2` |
| `reportingManager` | String | Manager name |
| `isAllowed` | Boolean | Admin-controlled access flag |
| `isVerified` | Boolean | OTP verified flag |
| `otp` | String | Temporary OTP (cleared after use) |
| `otpExpiry` | Date | OTP expiry timestamp |
| `isAdmin` | Boolean | Admin flag (default `false`) |
| `documents[]` | Array | Uploaded document subdocs (`docId`, `name`, `fileUrl`, `fileId`, `status`, `uploadedAt`) |
| `uploadedDocs` | Array | Uploaded doc tracking |
| `onboardingKit[]` | Array | Selected kit items |
| `buddyAnswers[]` | Array | `{ questionId, answer }` |
| `checkInAnswers` | Subdoc | Ratings (q1–q3, 1–5) + open text (q4) |
| `createdAt`, `updatedAt` | Date | Mongoose timestamps |

### File Storage

- **Engine:** MongoDB GridFS
- **Bucket:** `documents`
- **Library code:** `app/lib/gridfs.ts`
- Provides `uploadToGridFS` and `deleteFromGridFS` helpers
- Files served via `GET /api/documents/file/[id]`

---

## Key Libraries & Utilities

| Path | Purpose |
|---|---|
| `app/lib/mongodb.ts` | `connectDB()` — DB connection with global cache |
| `app/lib/auth.ts` | `normalizeMobile`, `isValidMobile`, `generateOtp` |
| `app/lib/admin.ts` | `hasAdminAccess`, `adminUnauthorizedResponse` |
| `app/lib/gridfs.ts` | `uploadToGridFS`, `deleteFromGridFS` |
| `app/lib/email.ts` | `sendUemApprovalNotification` (Nodemailer) |
| `app/lib/session.ts` | Client-side session types, `parseSessionUser`, `hasValidSessionUser`, `sessionDestination` |
| `lib/documentConfig.ts` | Document catalog with `filterDocuments` by employee attributes |
| `app/context/AppContext.tsx` | Global upload progress context |
| `app/context/NotificationContext.tsx` | In-app notification list + unread count |
| `app/hooks/useRequireSession.ts` | Route guard hook + `replaceSession` helper |

---

## Environment Variables

Create a `.env.local` file in the project root with the following variables:

```env
# ── Required ──────────────────────────────────────────────
# MongoDB connection string
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/

# ── OTP ───────────────────────────────────────────────────
# Fixed OTP for demo/testing (defaults to "000000" if not set)
# Remove or leave empty in production so real OTPs are used
DUMMY_OTP=000000

# ── Admin API Protection ──────────────────────────────────
# If set, all /api/admin/* calls must include header: x-admin-key: <this value>
# If not set, admin APIs are publicly accessible
ADMIN_ACCESS_KEY=your-strong-secret-key

# ── Email (Nodemailer) ────────────────────────────────────
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@example.com
SMTP_PASS=your-smtp-password

# Email address for document approval notifications
UEM_TEAM_EMAIL=uem-team@npci.org.in
```

---

## Deployment Guide

### Prerequisites

- Node.js 20+ (LTS recommended)
- A MongoDB Atlas cluster (or self-hosted MongoDB 6+)
- SMTP credentials (for email notifications on document approval)
- A hosting platform (see options below)

---

### Step 1 — Prepare MongoDB

1. Create a MongoDB Atlas free/paid cluster.
2. Create a database named **`npci-db`**.
3. Create a database user with `readWrite` permissions on `npci-db`.
4. Whitelist the IP of your deployment server (or use `0.0.0.0/0` for dynamic IPs with caution).
5. Copy the connection string: `mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/`.
6. GridFS collections (`documents.files`, `documents.chunks`) are created automatically on first upload — no manual setup needed.

---

### Step 2 — Prepare the Codebase

```bash
# Clone the repo
git clone <repo-url>
cd npci-onboarding-app

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local   # or create manually (see Environment Variables above)
# Fill in all values in .env.local

# Test locally
npm run dev
```

---

### Step 3 — Build for Production

```bash
npm run build
# Outputs to .next/
```

Fix any build errors before proceeding.

---

### Step 4 — Deployment Options

#### Option A — Vercel (Recommended for Next.js)

1. Push the repository to GitHub / GitLab / Bitbucket.
2. Import the project at [vercel.com](https://vercel.com).
3. In the Vercel dashboard → **Settings → Environment Variables**, add all variables from `.env.local`.
4. Deploy. Vercel auto-runs `npm run build` and serves the app.
5. Every `git push` to the main branch triggers a new deployment.

> **GridFS note:** Files uploaded to GridFS are stored in MongoDB, not on Vercel's filesystem — so they survive redeployments.

#### Option B — Self-Hosted VPS (Ubuntu / Debian)

```bash
# On the server:
# 1. Install Node.js 20 + npm
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Clone and install
git clone <repo-url> /var/www/npci-onboarding
cd /var/www/npci-onboarding
npm ci --omit=dev

# 3. Create .env.local with all required variables

# 4. Build
npm run build

# 5. Install PM2 (process manager)
npm install -g pm2

# 6. Start with PM2
pm2 start npm --name "npci-onboarding" -- start
pm2 save
pm2 startup   # follow the output command to auto-start on reboot

# 7. Set up Nginx as reverse proxy (see below)
```

**Nginx configuration:**

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Increase limit for document uploads
    client_max_body_size 20M;
}
```

Enable HTTPS with Let's Encrypt:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

#### Option C — Docker

Create a `Dockerfile`:

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

> Enable `output: 'standalone'` in `next.config.js` for the Docker slim build.

Build and run:

```bash
docker build -t npci-onboarding .
docker run -p 3000:3000 --env-file .env.local npci-onboarding
```

---

### Step 5 — Post-Deployment Checklist

| Task | Notes |
|---|---|
| Set `ADMIN_ACCESS_KEY` | Required for admin API security in production |
| Remove or unset `DUMMY_OTP` | Ensures real OTPs (not `000000`) are used |
| Verify email sending | Test document approval to confirm Nodemailer is working |
| Add first admin user | Use the admin panel or a MongoDB shell insert to create the first user with `isAllowed: true`, `isAdmin: true` |
| Upload SCORM content | Ensure `public/scorm/hr-induction/` is included in the deployment |
| Upload videos | Ensure `public/videos/module-2.mp4` is present |
| Configure MongoDB IP whitelist | Restrict to deployment server IPs only |
| Set up HTTPS | Never run with plain HTTP in production |
| Configure `client_max_body_size` in Nginx | Default is 1 MB; set to at least 20 MB for document uploads |

---

### Step 6 — Onboarding the First Admin

Since there is no signup flow for admins, the first admin user must be inserted directly into MongoDB:

```js
// MongoDB shell or Atlas Data Explorer
db.users.insertOne({
  name: "HR Admin",
  mobile: "9999999999",
  position: "HR Manager",
  role: "admin",
  isAllowed: true,
  isVerified: false,
  isAdmin: true,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

After inserting, the admin can log in via the app's `/login` page using the **Admin** pill and OTP.

---

### Maintenance Scripts

```bash
# Fix legacy mobile number formats in the database
npm run fix-mobiles
# Requires MONGODB_URI to be set in the environment
```

---

## Known Limitations & Security Considerations

| Issue | Recommendation |
|---|---|
| Session stored in `localStorage` (no server validation) | Implement HTTP-only cookie sessions or signed JWTs |
| `isAdmin` determined by UI pill selection, not DB field | Enforce DB-driven `isAdmin` check on both client and server |
| `/admin` page not server-protected | Add middleware to redirect non-admin sessions |
| `ADMIN_ACCESS_KEY` optional (defaults to open) | Always set this in production |
| `mark-complete` API only logs; no DB persistence | Add MongoDB write to track module completion |
| `/api/get-user` has no session check | Validate caller has a valid session before returning user data |
