# Copilot Instructions - MSME Platform

## Project Architecture

**Monorepo** with three interconnected applications for Eswatini MSME Platform:

| Application | Tech Stack | Port | Purpose |
|------------|-----------|------|---------|
| `MSME-Backend/` | Node.js + Express + Sequelize + MySQL | 3001 | REST API |
| `MSME-Website-Frontend/` | Next.js 14 (App Router) + Tailwind | 3000 | Public website |
| `MSME-CMS-Frontend/` | React + Vite + Tailwind | 5173 | Admin panel |

## Critical Patterns (MUST FOLLOW)

### 1. BaseRepository Pattern (Backend)
**All database operations MUST use `services/BaseRepository.js`** - never raw Sequelize queries in controllers:
```javascript
const BaseRepo = require('../services/BaseRepository');
// baseCreate(model, data), baseList(model, searchParams, options)
// baseUpdate(model, data, condition), baseDelete(model, condition), baseFindById(model, id)
```

### 2. Intentional Typos (Maintain Consistency)
- Controllers: `.contoller.js` (e.g., `blog.contoller.js`, `faqs.contoller.js`)
- Middleware folder: `middelware/` (not `middleware`)
- Axios instance: `axios-instanse.js` (Website Frontend)

### 3. Authentication Token Storage
| App | localStorage Key | Auth Middleware |
|-----|-----------------|-----------------|
| Website | `token` | `AuthContext` + axios interceptor |
| CMS | `authToken` | axios interceptor → auto-redirect on 401 |
| Backend | — | `middelware/auth.middelware.js` (`authUser`, `authAdmin`) |

### 4. API Layer Structure
- **Website**: `src/apis/*.js` → uses `src/utils/axios-instanse.js`
- **CMS**: `src/api/*.js` → uses `src/utils/axios.js` (handles 401 with SweetAlert)

## Adding New Features

### New API Endpoint
1. Model in `MSME-Backend/models/` (export in `index.js`)
2. Router in `MSME-Backend/routers/` → register in `app.js`
3. Controller in `MSME-Backend/controllers/*.contoller.js` using BaseRepository
4. API function in `MSME-Website-Frontend/src/apis/` or `MSME-CMS-Frontend/src/api/`

### New Website Page (Next.js App Router)
1. Create `MSME-Website-Frontend/src/app/[page-name]/page.js`
2. Use `"use client"` for interactive components
3. Auth via `useContext(AuthContext)` (client components only)

### New CMS Page
1. Page in `MSME-CMS-Frontend/src/pages/[feature]/`
2. Route in `App.jsx` inside `<ProtectedLayout>`
3. Use `Swal.fire({...})` for confirmations (SweetAlert2)

## Environment Variables

| App | Prefix | Required |
|-----|--------|----------|
| Backend | none | `DB_*`, `MAIL_*`, `JWT_SECRET`, `ADMIN_ERROR_EMAILS` |
| Website | `NEXT_PUBLIC_` | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_API_IMG_BASE_URL` |
| CMS | `VITE_` | `VITE_API_URL`, `VITE_DOCS_URL` |

## Development Commands

```bash
# Start all apps (run in separate terminals)
cd MSME-Backend && npm run dev          # Port 3001 (nodemon)
cd MSME-Website-Frontend && npm run dev # Port 3000 (Turbopack)
cd MSME-CMS-Frontend && npm run dev     # Port 5173 (Vite)

# Database migrations
cd MSME-Backend && npx sequelize-cli db:migrate

# Run tests
cd MSME-Backend && npm test
```

## Key Files Reference

| Purpose | File |
|---------|------|
| Backend entry & routes | `MSME-Backend/app.js` |
| All Sequelize models | `MSME-Backend/models/index.js` |
| Error handler (email alerts) | `MSME-Backend/middelware/errorHandler.middelware.js` |
| Website root layout | `MSME-Website-Frontend/src/app/layout.js` |
| CMS route definitions | `MSME-CMS-Frontend/src/App.jsx` |

## Common API Routes

| Method | Route | Purpose | Auth |
|--------|-------|---------|------|
| POST | `/api/admin/login` | Admin login | — |
| POST | `/api/msme-business/login` | Business user login | — |
| POST | `/api/msme-business/add` | Register new business | — |
| GET | `/api/msme-business/list` | List businesses (public) | — |
| GET | `/api/msme-business/list-admin` | List all (admin view) | `authAdmin` |
| PUT | `/api/msme-business/approve/:id` | Approve/reject business | `authAdmin` |
| GET | `/api/business-category/list` | List categories | — |
| GET | `/api/blog/list` | List blog posts | — |
| GET | `/api/faq/list` | List FAQs | — |

## Password Reset Flow (Secure)

Three-step flow with OTP protection (see `msmeBusiness.contoller.js`):
```
1. POST /api/msme-business/forget-password/request-otp  → { email }
2. POST /api/msme-business/forget-password/verify-otp   → { email, otp } → returns reset_token
3. POST /api/msme-business/forget-password/reset        → { reset_token, new_password }
```
- OTP valid for 10 minutes, brute-force protection: 5 attempts → 30-min lockout
- Never expose passwords/tokens in URLs

## Database Schema (Key Relationships)

```
MSMEBusinessModel (main business record)
  ├── hasMany → BusinessOwnersModel (gender tracking for ownership stats)
  ├── hasMany → DirectorsInfoModel (directors/stakeholders info)
  ├── belongsTo → BusinessCategoriesModel (via business_category_id)
  └── belongsTo → BusinessSubCategoriesModel (via business_sub_category_id)

ServiceProvidersModel
  └── belongsTo → ServiceProviderCategoriesModel
```

**Key fields on MSMEBusinessModel:**
- `is_verified`: 1=pending, 2=approved, 3=rejected
- `is_active`: soft-delete flag (paranoid mode enabled)
- `owner_gender_summary`: computed from BusinessOwners ("Male", "Female", "Mixed")
- `ownership_type`: "Sole Proprietor", "Partnership", "Company"

## Business Logic Gotchas

- **Business approval**: `is_verified` field → 1=pending, 2=approved, 3=rejected
- **File uploads**: Stored in `MSME-Backend/public/` subdirs, served as static files
- **CORS**: Development only (`localhost:3000`, `localhost:5173`). Production uses Nginx
- **Rate limiting**: 100 req/15min global; 5 req/15min on auth; 10 req/15min on email check
- **OTP brute-force**: 5 attempts → 30-minute lockout (in `msmeBusiness.contoller.js`)
- **Error emails**: Rate-limited (15min default) to prevent spam → requires `ADMIN_ERROR_EMAILS` env var
- **Soft deletes**: Most models use `paranoid: true` (Sequelize) — records have `deletedAt` timestamp
- **Validation**: Uses `express-validator` in routes, check existing patterns before adding new endpoints
- **XSS Prevention**: Backend uses `xss-clean`, frontends use DOMPurify via `src/utils/sanitize.js`

## Security Utilities

### HTML Sanitization (Frontend)
Always use `sanitizeHTML()` when rendering user-generated HTML content:
```javascript
import { sanitizeHTML } from '@/utils/sanitize';  // Website
import { sanitizeHTML } from '../../utils/sanitize';  // CMS

// Usage with dangerouslySetInnerHTML
<div dangerouslySetInnerHTML={{ __html: sanitizeHTML(content) }} />
```
## CMS Frontend Architecture (MSME-CMS-Frontend)

React + Vite SPA with protected routes:

| Folder | Purpose |
|--------|---------|
| `src/App.jsx` | React Router setup with ProtectedLayout |
| `src/pages/` | Page components (dashboard, msme-business, article, faq, etc.) |
| `src/components/` | Organized by feature (layout, msme-business, article, etc.) |
| `src/api/` | Axios-based service modules matching backend routes |
| `src/utils/` | Shared utilities including axios.js with auth interceptors, sanitize.js for XSS prevention |

**Key CMS Features**:
- **Protected Routes**: ProtectedLayout guards all admin routes
- **Rich Text Editor**: react-quill-new for blog posts
- **Charts**: chart.js + react-chartjs-2 for dashboard
- **Excel Export**: file-saver + xlsx (`src/utils/exports/`)
- **SweetAlert2**: Modal dialogs for confirmations

## Data Flow Architecture

### Authentication Flow
```
Website: POST /api/msme-business/login → stores token/userId/userType in localStorage → AuthContext
CMS: POST /api/admin/login → stores authToken in localStorage → axios default header
Backend: middelware/auth.middelware.js validates JWT on protected routes
```

### Business Registration Flow
```
1. User fills form on Website (/add-business)
2. POST /api/msme-business/add with business details, owner info, directors info
3. Backend creates MSMEBusiness, BusinessOwner, DirectorsInfo records
4. Admin reviews in CMS (/msme-business)
5. Admin approves/rejects → updates business status (is_verified: 2=approved, 3=rejected)
6. Approved businesses appear in public listings
```

### Error Notification Flow
```
1. Unhandled error occurs in backend
2. middelware/errorHandler.middelware.js catches error
3. services/errorNotificationService.js prepares email (redacts sensitive data)
4. Email sent to ADMIN_ERROR_EMAILS (rate-limited)
5. Error response sent to client
```

## Deployment Notes

### Single Server Deployment (PM2)

All apps managed via `ecosystem.config.js` at project root:

```bash
# Setup (one-time)
npm install -g pm2
npm install              # Install root package
npm run install:all      # Install all app dependencies
npm run build:all        # Build frontend apps

# Management commands
npm run start:prod       # Start all apps
npm run stop:prod        # Stop all apps
npm run restart:prod     # Restart all apps
npm run status           # View status
npm run logs             # Combined logs
npm run monit            # Real-time monitoring

# Auto-start on reboot
pm2 startup && pm2 save
```

| App | Port | PM2 Process Name |
|-----|------|------------------|
| Backend | 3001 | `msme-backend` |
| Website | 3000 | `msme-website` |
| CMS | 5173 | `msme-cms` |

### Alternative: Vercel/Netlify

| App | Deployment |
|-----|------------|
| Website | Vercel: `vercel`, set env vars in dashboard |
| CMS | Netlify/Vercel: deploy `dist/` folder |

**Production considerations**:
- Set `NODE_ENV=production` for backend
- Gmail has 500 emails/day limit — consider SendGrid/AWS SES for error notifications
- CORS is disabled in production mode (handled by Nginx)
- CMS uses `serve` package to serve static `dist/` folder (build required before deployment)

## Troubleshooting

### Database Connection
```bash
# Check MySQL running
systemctl status mysql  # Linux
brew services list      # macOS

# Verify database
mysql -u root -p -e "SHOW DATABASES;"
```

### Port Already in Use
```bash
lsof -i :3001 && kill -9 <PID>  # Backend
lsof -i :3000 && kill -9 <PID>  # Website
```

### Email Not Sending
- Check Gmail app password (not regular password)
- Verify 2-Step Verification enabled
- Gmail limit: 500 emails/day

### CORS Issues
- Dev: Backend CORS allows localhost:3000, localhost:5173
- Prod: CORS handled by Nginx, Express CORS disabled

### Authentication Issues
- Check token in localStorage (`token` for Website, `authToken` for CMS)
- Verify JWT_SECRET matches
- Check token expiration
- Ensure header: `Authorization: Bearer <token>`