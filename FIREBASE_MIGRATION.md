# Firebase Migration Guide - MSME Platform

This guide covers the complete migration of the MSME Platform from Express/MySQL to Firebase.

## Architecture Overview

### Before (Express + MySQL)
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Website       │     │   CMS           │     │   Backend       │
│   (Next.js)     │────▶│   (React/Vite)  │────▶│   (Express)     │
│   Port 3000     │     │   Port 5173     │     │   Port 3001     │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                                                         ▼
                                                ┌─────────────────┐
                                                │   MySQL DB      │
                                                └─────────────────┘
```

### After (Firebase)
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Website       │     │   CMS           │     │   Cloud         │
│   (Next.js SSR) │────▶│   (React SPA)   │────▶│   Functions     │
│   Firebase      │     │   Firebase      │     │   (Express)     │
│   Hosting       │     │   Hosting       │     └────────┬────────┘
└─────────────────┘     └─────────────────┘              │
         │                      │                        │
         └──────────────────────┼────────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │      Firestore        │
                    │    + Firebase Auth    │
                    │    + Cloud Storage    │
                    └───────────────────────┘
```

## Project Structure

```
MSME_Site/
├── firebase.json              # Firebase project config
├── .firebaserc                # Firebase project aliases
├── firestore.rules            # Firestore security rules
├── firestore.indexes.json     # Firestore composite indexes
├── storage.rules              # Storage security rules
│
├── functions/                 # Cloud Functions (replaces MSME-Backend)
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   ├── scripts/
│   │   └── migrateData.ts     # MySQL → Firestore migration
│   └── src/
│       ├── index.ts           # Main entry point
│       ├── api.ts             # Express app
│       ├── models/
│       │   └── schemas.ts     # Firestore document schemas
│       ├── services/
│       │   ├── FirestoreRepository.ts
│       │   └── emailService.ts
│       ├── middleware/
│       │   ├── auth.middleware.ts
│       │   └── validation.middleware.ts
│       ├── routes/            # API routes
│       │   ├── admin.routes.ts
│       │   ├── msmeBusiness.routes.ts
│       │   ├── businessCategory.routes.ts
│       │   ├── serviceProvider.routes.ts
│       │   ├── content.routes.ts
│       │   ├── helpdesk.routes.ts
│       │   ├── dashboard.routes.ts
│       │   └── upload.routes.ts
│       ├── triggers/          # Firestore triggers
│       │   ├── msmeBusiness.triggers.ts
│       │   └── ticket.triggers.ts
│       ├── scheduled/         # Scheduled jobs
│       │   └── analytics.scheduled.ts
│       └── callable/          # Callable functions
│           └── search.callable.ts
│
├── MSME-Website-Frontend/     # Public website (Next.js)
│   ├── src/
│   │   ├── lib/
│   │   │   └── firebase.js    # Firebase SDK init
│   │   ├── context/
│   │   │   └── FirebaseAuthContext.js
│   │   └── utils/
│   │       └── firebase-axios.js
│   └── .env.firebase.example
│
└── MSME-CMS-Frontend/         # Admin panel (React + Vite)
    ├── src/
    │   ├── lib/
    │   │   └── firebase.js    # Firebase SDK init
    │   ├── context/
    │   │   └── FirebaseAuthContext.jsx
    │   └── utils/
    │       └── firebase-axios.js
    └── .env.firebase.example
```

## Setup Instructions

### 1. Install Firebase CLI

```bash
npm install -g firebase-tools
firebase login
```

### 2. Install Dependencies

```bash
# Cloud Functions
cd functions
npm install

# Website Frontend
cd ../MSME-Website-Frontend
npm install firebase

# CMS Frontend
cd ../MSME-CMS-Frontend
npm install firebase
```

### 3. Configure Environment Variables

Copy the example files and fill in values:

```bash
# Functions
cp functions/.env.example functions/.env

# Website
cp MSME-Website-Frontend/.env.firebase.example MSME-Website-Frontend/.env.local

# CMS
cp MSME-CMS-Frontend/.env.firebase.example MSME-CMS-Frontend/.env.local
```

### 4. Set Firebase Functions Config

```bash
# Set SMTP config for emails
firebase functions:secrets:set SMTP_HOST
firebase functions:secrets:set SMTP_PORT
firebase functions:secrets:set SMTP_USER
firebase functions:secrets:set SMTP_PASS
firebase functions:secrets:set SMTP_FROM
```

## Data Migration

### Prerequisites
- MySQL database is accessible
- Firebase project is set up
- Service account key downloaded

### Run Migration

```bash
cd functions

# Set MySQL connection (or edit scripts/migrateData.ts)
export DB_HOST=localhost
export DB_PORT=3306
export DB_USER=root
export DB_PASSWORD=your_password
export DB_NAME=msme_db

# Run migration
npm run migrate
# Or: npx ts-node scripts/migrateData.ts
```

### Migration Order
1. **Admins** → Creates Firebase Auth users with admin claims
2. **Business Categories** → Base reference data
3. **Business Sub-Categories** → Linked to categories
4. **Service Provider Categories** → Base reference data
5. **MSME Businesses** → Main entities with owners/directors as subcollections
6. **Service Providers** → Linked to categories
7. **Content** (Blogs, FAQs, Banners, Partners, Team, Downloads)
8. **User Interactions** (Subscribers, Feedback, Contact submissions)
9. **Helpdesk** (Categories, Tickets, Responses)

### Post-Migration Tasks
- Verify admin logins work
- Test business authentication
- Check file URLs are accessible
- Verify category counts are accurate

## Development

### Start Emulators

```bash
firebase emulators:start
```

This starts:
- **Auth Emulator**: http://localhost:9099
- **Functions Emulator**: http://localhost:5001
- **Firestore Emulator**: http://localhost:8080
- **Storage Emulator**: http://localhost:9199
- **Emulator UI**: http://localhost:4000

### Run Frontend with Emulators

Set `USE_EMULATORS=true` in your environment:

```bash
# Website
cd MSME-Website-Frontend
NEXT_PUBLIC_USE_EMULATORS=true npm run dev

# CMS
cd MSME-CMS-Frontend
VITE_USE_EMULATORS=true npm run dev
```

### Deploy Functions Only

```bash
firebase deploy --only functions
```

### Deploy Everything

```bash
firebase deploy
```

## API Endpoints

The Cloud Functions API mirrors the original Express API:

### Admin Routes (`/api/admin`)
- `POST /login` - Admin login
- `GET /me` - Get current admin
- `PUT /:id` - Update admin
- `GET /` - List admins (super_admin only)
- `POST /` - Create admin (super_admin only)

### MSME Business Routes (`/api/msme-business`)
- `POST /register` - Register new business
- `POST /login` - Business login
- `POST /forgot-password` - Request password reset
- `POST /verify-otp` - Verify OTP
- `POST /reset-password` - Reset password
- `GET /` - List businesses (public: approved only)
- `GET /:id` - Get business details
- `PUT /:id` - Update business (owner only)
- `DELETE /:id` - Delete business (admin only)
- `PUT /:id/verify` - Verify business (admin only)

### Business Category Routes (`/api/business-categories`)
- `GET /` - List categories
- `GET /:id` - Get category with subcategories
- `POST /` - Create category (admin)
- `PUT /:id` - Update category (admin)
- `DELETE /:id` - Delete category (admin)

### Service Provider Routes (`/api/service-provider-categories`, `/api/service-providers`)
- Similar CRUD operations

### Content Routes (`/api/faqs`, `/api/blogs`, `/api/home-banner`, etc.)
- Public read access
- Admin-only write access

### Upload Routes (`/api/upload`)
- `POST /signed-url` - Get signed URL for upload
- Uses Firebase Storage

### Dashboard Routes (`/api/dashboard`)
- `GET /main-stats` - Key metrics
- `GET /msme_totals` - Business counts
- `GET /region_wise` - Geographic distribution
- `GET /growth-trends` - Monthly trends

## Security Rules

### Firestore Rules
- Admins can read/write all collections
- Business owners can only update their own records
- Public can read approved businesses, published content
- Soft delete protection (`deletedAt == null`)

### Storage Rules
- File size limits: 50MB images, 100MB documents
- Path-based access control
- Authenticated uploads required

## Search Implementation

### Current: Firestore Prefix Search
- Uses `>=` and `<=` queries with Unicode marker
- Limited to prefix matching on indexed fields
- Adequate for small datasets

### Recommended: Algolia Integration
For full-text search:

1. Sign up at algolia.com
2. Create index `msme_businesses`
3. Configure searchable attributes: `name`, `category_name`, `region`, `description`
4. Add API keys to environment
5. Uncomment Algolia code in `search.callable.ts` and triggers

## Monitoring & Analytics

### Built-in Analytics
- Daily/monthly snapshots via scheduled functions
- Counter documents for real-time metrics
- Ticket resolution time tracking

### Firebase Console
- Functions logs: `firebase functions:log`
- Firestore usage: Firebase Console → Firestore
- Storage usage: Firebase Console → Storage

## Cost Considerations

### Firestore
- **Reads**: $0.036 per 100K
- **Writes**: $0.108 per 100K
- **Storage**: $0.108 per GB/month

### Cloud Functions
- **Invocations**: 2M free/month
- **Compute**: 400K GB-seconds free/month
- **Networking**: $0.12 per GB outbound

### Storage
- **Storage**: $0.026 per GB/month
- **Downloads**: $0.12 per GB

### Tips to Reduce Costs
1. Use counters instead of `count()` queries
2. Denormalize frequently accessed data
3. Use batched reads when possible
4. Set appropriate TTLs on cached data

## Troubleshooting

### Common Issues

**1. CORS Errors**
```typescript
// Ensure cors is configured in api.ts
import cors from 'cors';
app.use(cors({ origin: true }));
```

**2. Auth Token Expired**
Firebase ID tokens expire after 1 hour. The axios interceptors automatically refresh them.

**3. Firestore Permission Denied**
Check security rules match the user's role and document ownership.

**4. Function Cold Starts**
First request after idle period may be slow. Use min-instances for production:
```typescript
setGlobalOptions({ minInstances: 1 });
```

**5. File Upload Fails**
- Check Storage rules allow the path
- Verify signed URL hasn't expired
- Ensure file size is within limits

## Next Steps

1. **Set up Algolia** for full-text search
2. **Configure custom domain** for Firebase Hosting
3. **Set up monitoring alerts** in Firebase Console
4. **Enable App Check** for additional security
5. **Configure backup schedule** for Firestore

## Migration Checklist

- [ ] Firebase project created
- [ ] CLI installed and authenticated
- [ ] Functions dependencies installed
- [ ] Environment variables configured
- [ ] Security rules deployed
- [ ] Data migration completed
- [ ] Admin users verified
- [ ] Business login tested
- [ ] File uploads working
- [ ] Frontend connected to Functions
- [ ] Custom domain configured
- [ ] SSL certificates active
- [ ] Monitoring enabled
