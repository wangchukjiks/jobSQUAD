# JobSQUAD — Full-Stack Project, Environment, Styling & Database Guide

## 1. Technology Stack Summary

- **Frontend**: React 19 (`src/App.tsx`, `src/components/*`), TypeScript (`tsconfig.json`), Vite 8 (`vite.config.ts`).
- **Styling / CSS**: Tailwind CSS v4 (`@import "tailwindcss";` in `src/index.css`) with custom theme utility classes (`.jobsquad-canvas` deep navy-to-charcoal dot-grid backdrop, `.jobsquad-surface` frosted glass cards, `.jobsquad-card-hover` transitions, `.font-mono-num` tabular numeric formatting) and Google Fonts (`Plus Jakarta Sans`, `DM Sans`, `JetBrains Mono`) configured in `index.html`.
- **Backend / API Server**: Node.js + Express (`server.ts`, `src/server/*`) serving `/api/*` endpoints with `vite.middlewares` mounted in development (`npm run dev`) and static `dist/` delivery in production (`npm start`).
- **Databases & Persistence**:
  1. **Google Cloud Firestore** (`ai-studio-6ba32b28-6d2f-419f-8c7f-853e9bd64db2` in Firebase project `gen-lang-client-0193594353`) for real-time user profiles, trusted admin registry, and cloud marketplace listings protected by `firestore.rules`.
  2. **Server JSON Persistence Store** (`src/server/store.ts` -> `.data/jobsquad-store.json`) for email/password authentication credentials, default admin bootstrap, server-moderated/API listings, tombstone deletions (`deletedIds`), and contact/listing inquiry audit logs.
- **Email Delivery**: Resend SDK (`src/server/email.ts`) backing Contact Us (`POST /api/contact`) and View Details Owner/Seller Inquiries (`POST /api/listing-inquiry`).
- **AI Services**: `@google/genai` (`src/server/gemini.ts`) for optional background 6-language listing translation (`POST /api/translate`) and platform assistant (`POST /api/chat`).

---

## 2. Environment Configuration (`.env`)

For security, `.env.example` is included in the archive without live secret tokens. Before running locally or deploying, copy `.env.example` to `.env` and populate your values:

```env
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
APP_URL="http://localhost:3000"
RESEND_API_KEY="YOUR_RESEND_API_KEY"
SENDER_EMAIL="onboarding@resend.dev"
CSRF_SECRET="REPLACE_WITH_64_CHAR_HEX_SECRET"
```

- `server.ts` loads `.env` via `dotenv.config()` on startup and never exposes secret keys to the client bundle.
- Client-side Firebase configuration (`projectId`, `apiKey`, `authDomain`, `firestoreDatabaseId`, etc.) is stored in `firebase-applet-config.json`.

---

## 3. How the Database Is Used

JobSQUAD uses a **hybrid cloud + server-side persistence model** designed so both Google Sign-In users and Email/Password users work seamlessly across devices while enforcing strict access control.

### A. Cloud Firestore (`src/lib/firebase.ts`, `firebase-blueprint.json`, `firestore.rules`)

Connected using:
```ts
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
```
- **Named Database ID**: `ai-studio-6ba32b28-6d2f-419f-8c7f-853e9bd64db2`
- **Startup Check**: `testConnection()` executes `getDocFromServer(doc(db, 'test', 'connection'))` to verify online connectivity early.
- **Collections**:
  1. **`/users/{userId}` (`UserProfile`)**:
     - Stores private PII: `uid`, `displayName`, `email`, `phone`, `accountType` (`seeker` | `employer` | `lister`), `createdAt`, `updatedAt`.
     - Rules: Verified users can read/create/update only their own `/users/{uid}` document (`uid` and `createdAt` are immutable); admins can read/update/delete.
  2. **`/admins/{adminId}` (`AdminRecord`)**:
     - Client read-only trusted admin lookup table (`uid`, `email`). Checked by `checkIsAdmin()` alongside verified admin email `wangchukjiks@gmail.com`.
  3. **`/listings/{listingId}` (`Listing`)**:
     - Stores Recruitment (`job`), House Rental (`house`), Car Rental (`car`), and Local Sales (`sale`) posts (`ownerId`, `ownerName`, `type`, `category`, `title`, `description`, `location`, `priceEur`, `contactEmail`, `contactPhone`, `images`, `specs`, `translations`, `status`, `createdAt`, `updatedAt`).
     - Real-time client sync via `subscribeListings()` (`onSnapshot(query(collection(db, 'listings'), orderBy('createdAt', 'desc')))`).
     - Validation enforced identically in TypeScript (`src/components/ListingFormModal.tsx`) and `firestore.rules`:
       - Non-job listings (`house`, `car`, `sale`) require `contactPhone.size() >= 6` and `1–3` images (each compressed `<= 450,000` chars).
       - Creators can only write with `ownerId == request.auth.uid`, and can only edit/delete their own listings; administrators can edit/delete any listing.

### B. Express Server Store (`src/server/store.ts` -> `.data/jobsquad-store.json`)

To support Email/Password registration & login (including the default administrator `wangchukjiks@gmail.com`), server-moderated edits/deletions on seeded/API listings, and persisted inquiry logs without requiring a Firebase Admin service account on Starter-tier environments:

- **`users`**: Stores registered accounts with 16-byte random salts and `crypto.scryptSync` password hashes verified via `crypto.timingSafeEqual`. Automatically ensures the default administrator exists.
- **`listings`**: Stores listings created/updated via `POST /api/listings` and `PUT /api/listings/:id`. For Firebase Google Sign-In users, `POST /api/auth/firebase-session` verifies the Firebase ID token against Google Identity Toolkit and issues a matching `HttpOnly`, `SameSite=Lax` HMAC-SHA256 session cookie (`src/server/security.ts`).
- **`deletedIds`**: Stores tombstones when an admin or owner deletes a listing (`DELETE /api/listings/:id`), ensuring deleted seeded or edited posts stay removed on refresh.
- **`inquiries`**: Audits up to the latest 200 inquiries from Contact Us (`POST /api/contact`) and Listing View Details Email Owner/Seller (`POST /api/listing-inquiry`) alongside Resend email delivery.

### C. Client Merge & Role-Based Visibility (`src/App.tsx` & `src/components/ListingsBoard.tsx`)

1. `allListings` merges in priority order (skipping anything in `deletedIds`):
   - `SEED_LISTINGS` (`src/data/seedListings.ts`) -> `firestoreListings` -> `serverListings` (so latest edits always win).
2. `visibleListings` enforces RBAC in the UI (backed by `/api/listings` and `firestore.rules` on the server):
   - **Administrator** (`isAdmin: true`): Views, creates, edits, and deletes all listings across all users.
   - **Signed-in Regular User** (`userProfile && !isAdmin`): Views, edits, and deletes only their own posts (`item.ownerId === userProfile.uid`). New users start with an empty personal board until they create posts.
   - **Public Visitor (signed out)**: Browses active public listings across Recruitment, House/Car Rentals, and Local Sales.

---

## 4. Running Locally

```bash
npm install
cp .env.example .env
# Edit .env with your GEMINI_API_KEY, RESEND_API_KEY, SENDER_EMAIL, CSRF_SECRET
npm run dev
```

For production build & start:
```bash
npm run build
npm start
```
