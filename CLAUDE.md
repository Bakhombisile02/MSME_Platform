# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MSME Platform for Eswatini - A comprehensive business registry system with public website and admin CMS.

**Production Environment**: Firebase (Hosting + Cloud Functions + Firestore)

**Migration Status**: Actively transitioning from Express/MySQL (legacy) to Firebase. See FIREBASE_MIGRATION.md for migration details.

**Monorepo Structure:**

| Application | Stack | Port | Status |
|-------------|-------|------|--------|
| `functions/` | Firebase Cloud Functions + Firestore | 5001 | **PRODUCTION** |
| `MSME-Website-Frontend/` | Next.js 15 (App Router) | 3000 | Active |
| `MSME-CMS-Frontend/` | React 19 + Vite | 5173 | Active |
| `MSME-Backend/` | Express + Sequelize + MySQL | 3001 | Legacy (being phased out) |

---

# Current Production Stack (Firebase)

## Development Setup

### Initial Setup

```bash
# Install Firebase CLI
npm install -g firebase-tools
firebase login

# Install Cloud Functions dependencies
cd functions && npm install && cd ..

# Install frontend dependencies
cd MSME-Website-Frontend && npm install && cd ..
cd MSME-CMS-Frontend && npm install && cd ..
```

### Development Workflow

**Run in 3 separate terminals:**

```bash
# Terminal 1 - Start Firebase Emulators
firebase emulators:start

# Terminal 2 - Website Frontend
cd MSME-Website-Frontend
NEXT_PUBLIC_USE_EMULATORS=true npm run dev

# Terminal 3 - CMS Frontend
cd MSME-CMS-Frontend
VITE_USE_EMULATORS=true npm run dev
```

**Emulator UI**: http://localhost:4000

**Emulator Endpoints**:
- Auth: http://localhost:9099
- Functions/API: http://localhost:5001
- Firestore: http://localhost:8080
- Storage: http://localhost:9199

## Architecture

### Firebase Functions Structure

**Directory**: `functions/src/`

| Directory/File | Purpose |
|----------------|---------|
| `index.ts` | Main entry point, exports all functions |
| `api.ts` | Express app for HTTP API endpoints |
| `routes/` | API route handlers (admin, business, content, etc.) |
| `services/FirestoreRepository.ts` | Database operations |
| `middleware/` | Auth, validation, error handling |
| `triggers/` | Firestore triggers (onCreate, onUpdate, onDelete) |
| `scheduled/` | Scheduled/cron functions |
| `callable/` | Client-callable functions (e.g., search) |
| `models/schemas.ts` | Firestore document schemas |

**Key Differences from Legacy**:
- TypeScript instead of JavaScript
- Firestore collections instead of MySQL tables
- Firebase Auth instead of JWT
- Cloud Storage instead of local file uploads
- Cloud Functions instead of Express server

### Authentication

**Firebase Auth**:
- User authentication via Firebase Auth
- Firebase ID tokens (auto-refreshed by SDK)
- Custom claims for admin roles
- Frontend: `FirebaseAuthContext.js` in both Website and CMS
- Backend: `functions/src/middleware/auth.middleware.ts` verifies Firebase ID tokens

**Frontend Integration**:
- Website: `MSME-Website-Frontend/src/context/FirebaseAuthContext.js`
- CMS: `MSME-CMS-Frontend/src/context/FirebaseAuthContext.jsx`
- Uses `firebase-axios.js` utility for API calls with auto token refresh

### Business Logic Constants

```javascript
// Business verification status (is_verified field)
1 = pending    // Awaiting admin review
2 = approved   // Visible on public website
3 = rejected   // Not displayed

// Firestore uses soft deletes via deletedAt field
```

### Security

**Firestore Security Rules** (`firestore.rules`):
- Admins can read/write all collections (via custom claims)
- Business owners can only update their own records
- Public can read approved businesses and published content
- Soft delete protection (`deletedAt == null`)

**Storage Security Rules** (`storage.rules`):
- File size limits: 50MB images, 100MB documents
- Path-based access control
- Authenticated uploads required

## Adding New Features

### New API Endpoint

1. **Create Route**: `functions/src/routes/newFeature.routes.ts`
2. **Register in API**: Export in `functions/src/api.ts`
3. **Update Security Rules**: If new Firestore collection needed

**Example:**

```typescript
// functions/src/routes/example.routes.ts
import { Router } from 'express';
import { authAdmin } from '../middleware/auth.middleware';
import * as admin from 'firebase-admin';

const router = Router();
const db = admin.firestore();

router.get('/list', async (req, res) => {
  const snapshot = await db.collection('examples')
    .where('deletedAt', '==', null)
    .limit(parseInt(req.query.limit as string) || 10)
    .get();

  const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  res.json(items);
});

router.post('/create', authAdmin, async (req, res) => {
  const docRef = await db.collection('examples').add({
    ...req.body,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    deletedAt: null
  });
  res.json({ id: docRef.id });
});

export default router;

// functions/src/api.ts - register route
import exampleRoutes from './routes/example.routes';
app.use('/api/example', exampleRoutes);
```

### New Firestore Trigger

```typescript
// functions/src/triggers/example.triggers.ts
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';

export const onExampleCreated = onDocumentCreated(
  'examples/{exampleId}',
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    // Update counter
    const db = admin.firestore();
    await db.collection('counters').doc('examples').update({
      total: admin.firestore.FieldValue.increment(1)
    });
  }
);

// Export in functions/src/index.ts
export { onExampleCreated } from './triggers/example.triggers';
```

### New CMS Admin Page

1. Create `MSME-CMS-Frontend/src/pages/feature-name/page.jsx` (kebab-case)
2. Add route in `src/App.jsx` inside `<ProtectedLayout>`
3. Create API client in `src/api/feature-name.js`
4. Use Firebase Auth context for authentication

### New Website Page

1. Create `MSME-Website-Frontend/src/app/feature/page.js`
2. Add `"use client"` directive for interactive components
3. Create API client in `src/apis/feature-api.js`
4. Use Firebase Auth context if auth required

## Deployment

### Deploy to Firebase

```bash
# Deploy everything (hosting + functions)
firebase deploy

# Deploy specific targets
firebase deploy --only functions      # Backend API only
firebase deploy --only hosting        # Frontend apps only
firebase deploy --only firestore      # Security rules only
firebase deploy --only storage        # Storage rules only
```

**Firebase Configuration** (`firebase.json`):

| Target | Source | Hosting URL |
|--------|--------|-------------|
| Website | `MSME-Website-Frontend/` (Next.js SSR) | Main domain root |
| CMS | `MSME-CMS-Frontend/dist/` (React SPA) | `/admin` path |
| API | `functions/` (Cloud Functions) | `/api/*` |

### Environment Variables

**Cloud Functions Secrets** (set via CLI):
```bash
firebase functions:secrets:set SMTP_HOST
firebase functions:secrets:set SMTP_PORT
firebase functions:secrets:set SMTP_USER
firebase functions:secrets:set SMTP_PASS
firebase functions:secrets:set SMTP_FROM
```

**Frontend Environment** (`.env.local`):
- See `.env.firebase.example` files in each frontend directory
- Firebase SDK config (API key, project ID, auth domain, etc.)
- For local development: Set `NEXT_PUBLIC_USE_EMULATORS=true` (Website) or `VITE_USE_EMULATORS=true` (CMS)

## Key Files Reference

| Purpose | File Path |
|---------|-----------|
| Functions entry point | `functions/src/index.ts` |
| API Express app | `functions/src/api.ts` |
| Route definitions | `functions/src/routes/` |
| Firestore repository | `functions/src/services/FirestoreRepository.ts` |
| Auth middleware | `functions/src/middleware/auth.middleware.ts` |
| Firebase config | `firebase.json` |
| Firestore security rules | `firestore.rules` |
| Storage security rules | `storage.rules` |
| Website Firebase auth | `MSME-Website-Frontend/src/context/FirebaseAuthContext.js` |
| CMS Firebase auth | `MSME-CMS-Frontend/src/context/FirebaseAuthContext.jsx` |
| Website Firebase axios | `MSME-Website-Frontend/src/utils/firebase-axios.js` |
| CMS Firebase axios | `MSME-CMS-Frontend/src/utils/firebase-axios.js` |
| CMS routes | `MSME-CMS-Frontend/src/App.jsx` |

## Code Style

- Use **TypeScript** for all Cloud Functions
- Follow Firebase best practices for error handling
- Use Firestore batch operations for multiple writes
- Leverage Firebase Admin SDK features
- Apply proper TypeScript types for Firestore documents
- Use async/await consistently

## Common Gotchas

1. **New features go in `functions/`** - Not in legacy `MSME-Backend/`
2. **Emulators required for development** - Run `firebase emulators:start` before testing
3. **Firebase ID tokens expire after 1 hour** - Frontend SDKs auto-refresh
4. **Always update Firestore rules** - When adding new collections
5. **Use batch writes for multiple operations** - More efficient than individual writes
6. **Test with emulators first** - Before deploying to production
7. **Cloud Functions have cold starts** - First request after idle may be slow
8. **Firestore queries are limited** - No full-text search without Algolia

---

# Legacy System Reference (Express/MySQL)

**⚠️ IMPORTANT**: This backend is being phased out. Only modify if maintaining backward compatibility during migration. All new features should use Firebase.

## Intentional Naming Conventions (DO NOT "FIX")

These are intentional typos maintained across the legacy codebase:

- **Controllers**: `*.contoller.js` (NOT `.controller.js`)
- **Middleware folder**: `middelware/` (NOT `middleware/`)
- **Website axios**: `src/utils/axios-instanse.js` (NOT `instance`)

## Legacy Development Setup

### Initial Setup

```bash
# Install dependencies
cd MSME-Backend && npm install && cd ..
cd MSME-Website-Frontend && npm install && cd ..
cd MSME-CMS-Frontend && npm install && cd ..

# Set up MySQL database
mysql -u root -p
CREATE DATABASE msme_db;
EXIT;

# Run migrations and seed admin
cd MSME-Backend
npm run db:migrate
npm run seed:admin
```

### Development Workflow

```bash
# Terminal 1 - Backend API
cd MSME-Backend
npm run dev              # Nodemon with auto-restart

# Terminal 2 - Public Website
cd MSME-Website-Frontend
npm run dev              # Next.js with Turbopack

# Terminal 3 - Admin CMS
cd MSME-CMS-Frontend
npm run dev              # Vite dev server
```

### Database Operations

```bash
cd MSME-Backend

# Run migrations
npm run db:migrate

# Rollback last migration
npm run db:migrate:undo

# Create initial admin user
npm run seed:admin
```

### Testing

```bash
cd MSME-Backend

# Run all tests with coverage
npm test

# Watch mode for development
npm run test:watch

# CI mode
npm run test:ci
```

Test files located in `MSME-Backend/tests/`.

## Legacy Architecture

### BaseRepository Pattern

**CRITICAL**: Never use raw Sequelize in controllers. Always use `services/BaseRepository.js`:

```javascript
const BaseRepo = require('../services/BaseRepository');
const { MSMEBusinessModel } = require('../models');

// CRUD operations
await BaseRepo.baseCreate(MSMEBusinessModel, data);
await BaseRepo.baseList(MSMEBusinessModel, { searchParams, limit, offset, order });
await BaseRepo.baseUpdate(MSMEBusinessModel, id, data);
await BaseRepo.baseDelete(MSMEBusinessModel, id);
await BaseRepo.baseFindById(MSMEBusinessModel, id);
```

This pattern provides:
- Consistent error handling
- Built-in soft delete support (`paranoid: true`)
- Standardized pagination
- Query optimization

### Legacy Authentication

| App | Storage Key | Auth Setup File | Middleware |
|-----|-------------|-----------------|------------|
| Backend | JWT `Authorization: Bearer` | N/A | `middelware/auth.middelware.js` |
| Website | `localStorage.token` | `src/utils/axios-instanse.js` + `src/context/AuthContext.js` | N/A |
| CMS | `localStorage.authToken` | `src/utils/axios.js` (SweetAlert on 401) | N/A |

**Backend Auth Middleware:**
- `authUser` - Validates JWT and loads `MSMEBusinessModel` user
- `authAdmin` - Validates JWT and loads `AdminModel` admin

### Legacy Security

**Rate Limiting** (configured in `app.js:28-60`):
- Global: 1000 req/15min per IP
- Auth endpoints: 20 req/15min
- Email enumeration protection: 50 req/15min
- Disabled in test environment

**XSS Protection**:
- Backend: Automatic via `middelware/validation.middelware.js` (sanitizeBody, sanitizeQuery)
- Frontend: DOMPurify on all HTML renders
- Uses allowlist approach (no HTML tags by default)

**Other Security Features**:
- Helmet.js for security headers
- JWT authentication with configurable expiry
- OTP brute-force protection (5 attempts, 30-min lockout)
- Sequelize parameterized queries (SQL injection prevention)

## Legacy API Endpoint Example

**Only modify if maintaining backward compatibility during migration.**

1. **Model**: Create `MSME-Backend/models/NewModel.js`
   - Auto-loaded via `models/index.js`
   - Use `paranoid: true` for soft deletes

2. **Controller**: Create `MSME-Backend/controllers/newFeature.contoller.js`
   - Use BaseRepository for all database operations
   - Apply validation with `express-validator`

3. **Router**: Create `MSME-Backend/routers/newFeature.js`
   - Define routes with validation
   - Apply auth middleware (`authUser` or `authAdmin`)
   - Register in `app.js` (lines 121-140)

```javascript
// controllers/example.contoller.js
const BaseRepo = require('../services/BaseRepository');
const { ExampleModel } = require('../models');

module.exports.getList = async (req, res) => {
  const items = await BaseRepo.baseList(ExampleModel, {
    limit: req.query.limit || 10,
    offset: req.query.offset || 0
  });
  res.json(items);
};

// routers/example.js
const router = require('express').Router();
const { authAdmin } = require('../middelware/auth.middelware');
const controller = require('../controllers/example.contoller');

router.get('/list', controller.getList);
router.post('/create', authAdmin, controller.create);

module.exports = router;

// app.js - register route
app.use('/api/example', require('./routers/example'));
```

## Legacy Key Files

| Purpose | File Path |
|---------|-----------|
| Route registration | `MSME-Backend/app.js:121-140` |
| All models export | `MSME-Backend/models/index.js` |
| Base repository | `MSME-Backend/services/BaseRepository.js` |
| Auth middleware | `MSME-Backend/middelware/auth.middelware.js` |
| Global error handler | `MSME-Backend/middelware/errorHandler.middelware.js` |
| Website legacy auth | `MSME-Website-Frontend/src/context/AuthContext.js` |
| CMS axios interceptor | `MSME-CMS-Frontend/src/utils/axios.js` |

## Legacy Environment Variables

**Backend** (`MSME-Backend/.env`):
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `JWT_SECRET`
- `MAIL_AUTH_USER`, `MAIL_AUTH_PW` (SMTP for emails)
- Optional: `ADMIN_ERROR_EMAILS`, `ADMIN_MAIL_AUTH_USER`, `ADMIN_MAIL_AUTH_PW`

**Website** (`MSME-Website-Frontend/.env.local`):
- `NEXT_PUBLIC_API_URL=http://localhost:3001/api`
- `NEXT_PUBLIC_API_IMG_BASE_URL=http://localhost:3001`

**CMS** (`MSME-CMS-Frontend/.env.local`):
- `VITE_API_URL=http://localhost:3001/api`
- `VITE_DOCS_URL=http://localhost:3001`

## Legacy Deployment (PM2 + Nginx)

**⚠️ DEPRECATED**: This deployment method is being replaced by Firebase.

**From root directory:**
```bash
npm install              # Install PM2
npm run install:all      # Install all app dependencies
npm run build:all        # Build frontend apps

# Management
npm run start:prod       # Start all apps
npm run stop:prod        # Stop all apps
npm run restart:prod     # Restart all apps
npm run status           # View status
npm run logs             # Combined logs
```

**Process Configuration** (`ecosystem.config.js`):
- `msme-backend`: Runs `server.js` on port 3001
- `msme-website`: Runs Next.js production server on port 3000
- CMS: Served as static files by Nginx from `dist/`

**Legacy URL Structure** (Nginx at `nginx/msme.conf`):
- `https://ceec-msme.com/` → Website (Next.js on port 3000)
- `https://ceec-msme.com/admin` → CMS (static files)
- `https://ceec-msme.com/api/*` → Backend API (Express on port 3001)

## Legacy Code Style

- Indentation: 2 spaces for JavaScript
- Controllers: Always use `*.contoller.js` suffix (intentional typo)
- Never use raw Sequelize - always use BaseRepository
- Apply auth middleware before protected routes
- Use `express-validator` for input validation
- Soft deletes: Most models use `paranoid: true`

---

# Migration Reference

For complete migration documentation, see **FIREBASE_MIGRATION.md**

**Key Migration Topics**:
- Data migration from MySQL to Firestore
- Cloud Functions implementation details
- Security rules configuration
- Search implementation (Firestore vs Algolia)
- Cost considerations and optimization
