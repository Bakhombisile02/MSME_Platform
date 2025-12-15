# Copilot Instructions - MSME Platform

## Project Architecture

This is a **monorepo** with three interconnected applications for the Eswatini MSME (Micro, Small, and Medium Enterprises) Platform:

| Application | Tech Stack | Port | Purpose |
|------------|-----------|------|---------|
| `MSME-Backend/` | Node.js + Express + Sequelize + MySQL | 3001 | REST API |
| `MSME-Website-Frontend/` | Next.js 14 (App Router) + Tailwind | 3000 | Public website |
| `MSME-CMS-Frontend/` | React + Vite + Tailwind | 5173 | Admin panel |

## Security Features

### Rate Limiting
- Global API limit: 100 requests per 15 minutes per IP
- Auth endpoints: 5 requests per 15 minutes (login, register, password reset)
- Configured in `app.js` using `express-rate-limit`

### Security Headers
- Uses `helmet` middleware for XSS protection, Content-Security-Policy, etc.
- Response compression enabled via `compression` middleware

### Protected Routes
- Admin registration requires existing admin authentication
- CMS file uploads require admin authentication
- Sensitive data endpoints (contact, feedback, subscribers) require admin auth

### Password Reset Flow (Secure)
1. `POST /api/msme-business/forget-password/request-otp` - Request OTP
2. `POST /api/msme-business/forget-password/verify-otp` - Verify OTP, get reset token
3. `POST /api/msme-business/forget-password/reset` - Reset with token
- OTP brute-force protection: 5 attempts, 30-minute lockout
- Passwords never sent in URLs

## Critical Patterns

### Backend: BaseRepository Pattern
**All database operations MUST use `services/BaseRepository.js`** - never raw Sequelize queries in controllers:
```javascript
const BaseRepo = require('../services/BaseRepository');
// Use: BaseRepo.baseCreate(), baseList(), baseUpdate(), baseDelete(), baseFindById()
```
See [msmeBusiness.contoller.js](MSME-Backend/controllers/msmeBusiness.contoller.js) for examples.

### Backend: Controller File Naming
Controllers use `.contoller.js` (note: single 'l' typo is intentional - maintain consistency):
- `msmeBusiness.contoller.js`, `blog.contoller.js`, `faqs.contoller.js`

### Frontend: API Layer Structure
- **Website**: API modules in `src/apis/` use axios instance from `src/utils/axios-instanse.js`
- **CMS**: API modules in `src/api/` use axios instance from `src/utils/axios.js` with auth interceptors

### Authentication
- **Website users**: Token stored as `token` in localStorage, managed by `AuthContext`
- **CMS admins**: Token stored as `authToken` in localStorage, auto-attached via axios interceptors
- **Backend**: JWT validation in `middelware/auth.middelware.js`
- **JWT Expiry**: Configurable via `JWT_ADMIN_EXPIRY` (default 8h) and `JWT_USER_EXPIRY` (default 24h)

## Adding New Features

### New API Endpoint
1. Create/update model in `MSME-Backend/models/` (export in `index.js`)
2. Create router in `MSME-Backend/routers/` → register in `app.js`
3. Create controller using BaseRepository pattern in `MSME-Backend/controllers/`
4. Add API function in `MSME-Website-Frontend/src/apis/` or `MSME-CMS-Frontend/src/api/`

### New Website Page (Next.js App Router)
1. Create folder: `MSME-Website-Frontend/src/app/[page-name]/page.js`
2. Use `"use client"` directive for interactive components
3. Access auth via `useContext(AuthContext)` in client components only

### New CMS Page
1. Create page in `MSME-CMS-Frontend/src/pages/[feature]/`
2. Add route in `App.jsx` inside `<ProtectedLayout>` for auth protection
3. Use SweetAlert2 for confirmations: `Swal.fire({...})`

## Environment Variables

| App | Prefix | Key Variables |
|-----|--------|---------------|
| Backend | none | `DB_*`, `MAIL_*`, `JWT_SECRET`, `JWT_*_EXPIRY` |
| Website | `NEXT_PUBLIC_` | `NEXT_PUBLIC_API_URL` |
| CMS | `VITE_` | `VITE_API_URL` |

## Development Commands

```bash
# Backend (port 3001)
cd MSME-Backend && npm run dev  # nodemon auto-restart

# Website (port 3000) 
cd MSME-Website-Frontend && npm run dev  # Turbopack

# CMS (port 5173)
cd MSME-CMS-Frontend && npm run dev  # Vite

# Initial admin setup
cd MSME-Backend && npm run seed:admin

# Run tests
cd MSME-Backend && npm test
```

## Key Files Reference

- **Backend entry**: [app.js](MSME-Backend/app.js) - routes registration, middleware, CORS
- **Database models**: [models/index.js](MSME-Backend/models/index.js) - auto-loads all models
- **Error handling**: [middelware/errorHandler.middelware.js](MSME-Backend/middelware/errorHandler.middelware.js) - sends email alerts
- **Website layout**: [src/app/layout.js](MSME-Website-Frontend/src/app/layout.js) - AuthProvider, Header, Footer
- **CMS routing**: [src/App.jsx](MSME-CMS-Frontend/src/App.jsx) - ProtectedLayout guards routes

## Common Gotchas

- **CORS**: Disabled in production (handled by Nginx). Development allows `localhost:3000` and `localhost:5173`
- **Middleware folder**: Spelled `middelware/` (typo is intentional - maintain consistency)
- **File uploads**: Stored in `MSME-Backend/public/` subdirectories, served as static files
- **Business approval flow**: `is_verified` field: 1=pending, 2=approved, 3=rejected
