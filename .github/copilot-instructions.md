# Copilot Instructions - MSME Platform

## Architecture Overview

**Monorepo** with three apps for Eswatini MSME Platform:

| App | Stack | Port | Purpose |
|-----|-------|------|---------|
| `MSME-Backend/` | Express + Sequelize + MySQL | 3001 | REST API |
| `MSME-Website-Frontend/` | Next.js 14 (App Router) | 3000 | Public website |
| `MSME-CMS-Frontend/` | React + Vite | 5173 | Admin panel |

## Critical Patterns

### BaseRepository Pattern (REQUIRED)
All DB operations use `services/BaseRepository.js` — never raw Sequelize in controllers:
```javascript
const BaseRepo = require('../services/BaseRepository');
// baseCreate, baseList, baseUpdate, baseDelete, baseFindById, baseDetail
```

### Intentional Naming (Maintain These Typos)
- Controllers: `.contoller.js` (not `.controller.js`)
- Middleware: `middelware/` (not `middleware/`)
- Axios: `axios-instanse.js` (Website)

### Auth Token Keys
- **Website**: `localStorage.token` → `AuthContext` + interceptor
- **CMS**: `localStorage.authToken` → interceptor with SweetAlert on 401
- **Backend**: `middelware/auth.middelware.js` (`authUser`, `authAdmin`)

## Adding Features

### New API Endpoint
1. Model → `MSME-Backend/models/` (export in `index.js`)
2. Router → `MSME-Backend/routers/` (register in `app.js`)
3. Controller → `MSME-Backend/controllers/*.contoller.js` using BaseRepo
4. Frontend API → `src/apis/` (Website) or `src/api/` (CMS)

### New Page
- **Website**: `src/app/[page]/page.js` + `"use client"` for interactivity
- **CMS**: `src/pages/[feature]/` + route in `App.jsx` inside `<ProtectedLayout>`

## Key Business Logic

- **Business status**: `is_verified` → 1=pending, 2=approved, 3=rejected
- **Soft deletes**: Most models use `paranoid: true`
- **Gender tracking**: `owner_gender_summary` computed from `BusinessOwnersModel`
- **File uploads**: Stored in `MSME-Backend/public/` subdirs

### Password Reset (3-step OTP flow)
```
POST /api/msme-business/forget-password/request-otp → { email }
POST /api/msme-business/forget-password/verify-otp  → { email, otp } → reset_token
POST /api/msme-business/forget-password/reset       → { reset_token, new_password }
```
OTP: 10min validity, 5 failed attempts → 30min lockout

## Security

- **Rate limits**: 100 req/15min global; 5/15min auth; 10/15min email check
- **XSS**: Backend uses `xss-clean`, frontends use `sanitizeHTML()` from `src/utils/sanitize.js`
- **Validation**: `express-validator` in routes — follow existing patterns

## Development

```bash
# Start (separate terminals)
cd MSME-Backend && npm run dev          # Port 3001
cd MSME-Website-Frontend && npm run dev # Port 3000
cd MSME-CMS-Frontend && npm run dev     # Port 5173

# Database
cd MSME-Backend && npx sequelize-cli db:migrate
cd MSME-Backend && npm test
```

## Environment Variables

| App | Prefix | Key vars |
|-----|--------|----------|
| Backend | — | `DB_*`, `MAIL_*`, `JWT_SECRET`, `ADMIN_ERROR_EMAILS` |
| Website | `NEXT_PUBLIC_` | `NEXT_PUBLIC_API_URL` |
| CMS | `VITE_` | `VITE_API_URL` |

## Production (PM2)

```bash
npm run install:all && npm run build:all
npm run start:prod   # Starts all via ecosystem.config.js
npm run logs         # View logs
```

## Key Files

| Purpose | Location |
|---------|----------|
| Route registration | `MSME-Backend/app.js` |
| All models | `MSME-Backend/models/index.js` |
| Error handler | `MSME-Backend/middelware/errorHandler.middelware.js` |
| Website layout | `MSME-Website-Frontend/src/app/layout.js` |
| CMS routes | `MSME-CMS-Frontend/src/App.jsx` |
| Auth context | `MSME-Website-Frontend/src/context/AuthContext.js` |