# Copilot Instructions - MSME Platform

Eswatini MSME business registry platform. **Production runs on Firebase** (Cloud Functions + Firestore). Legacy Express/MySQL backend exists but is being phased out.

## Architecture

| App | Stack | Port | Status |
|-----|-------|------|--------|
| `functions/` | Firebase Cloud Functions + TypeScript | 5001 | **PRODUCTION** |
| `MSME-Website-Frontend/` | Next.js 15 (App Router) | 3000 | Active |
| `MSME-CMS-Frontend/` | React 19 + Vite | 5173 | Active |
| `MSME-Backend/` | Express + Sequelize + MySQL | 3001 | Legacy (read CLAUDE.md) |

## Development Workflow (Firebase)

```bash
# Terminal 1 - Firebase emulators (REQUIRED)
firebase emulators:start

# Terminal 2 - Website
cd MSME-Website-Frontend && NEXT_PUBLIC_USE_EMULATORS=true npm run dev

# Terminal 3 - CMS
cd MSME-CMS-Frontend && VITE_USE_EMULATORS=true npm run dev
```

Emulator UI at http://localhost:4000

## New Features → Use Firebase (functions/)

### New API Endpoint
1. Create route in `functions/src/routes/feature.routes.ts`
2. Register in `functions/src/api.ts`
3. Update `firestore.rules` if new collection needed

```typescript
// functions/src/routes/example.routes.ts
import { Router } from 'express';
import { authAdmin } from '../middleware/auth.middleware';
import * as admin from 'firebase-admin';

const router = Router();
const db = admin.firestore();

router.get('/list', async (req, res) => {
  const snapshot = await db.collection('examples')
    .where('deletedAt', '==', null).limit(10).get();
  res.json(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
});

export default router;
```

### New CMS Page
1. Create `MSME-CMS-Frontend/src/pages/feature-name/page.jsx` (kebab-case)
2. Add route in `src/App.jsx` inside `<ProtectedLayout>`
3. Use `FirebaseAuthContext.jsx` for auth, `firebase-axios.js` for API calls

### New Website Page
1. Create `MSME-Website-Frontend/src/app/feature/page.js`
2. Add `"use client"` directive for interactive components
3. Use `FirebaseAuthContext.js` + `firebase-axios.js`

## Business Logic Constants

```javascript
// Business verification status (is_verified)
1 = pending    // Awaiting admin review
2 = approved   // Visible on public website  
3 = rejected   // Not displayed

// Soft deletes: deletedAt field (null = active)
```

## Key Files

| Purpose | Path |
|---------|------|
| Cloud Functions entry | `functions/src/index.ts` |
| Express API | `functions/src/api.ts` |
| Firestore repository | `functions/src/services/FirestoreRepository.ts` |
| Auth middleware | `functions/src/middleware/auth.middleware.ts` |
| Security rules | `firestore.rules`, `storage.rules` |
| Website Firebase auth | `MSME-Website-Frontend/src/context/FirebaseAuthContext.js` |
| CMS Firebase auth | `MSME-CMS-Frontend/src/context/FirebaseAuthContext.jsx` |

## ⚠️ Legacy Code (MSME-Backend/)

Only touch for backward compatibility. Uses intentional typos—**do not fix**:
- Controllers: `*.contoller.js`
- Middleware folder: `middelware/`
- Website axios: `axios-instanse.js`

Use `services/BaseRepository.js` (never raw Sequelize). See CLAUDE.md for full legacy docs.

## Deployment

```bash
firebase deploy                    # All
firebase deploy --only functions   # Backend only
firebase deploy --only firestore   # Security rules
```