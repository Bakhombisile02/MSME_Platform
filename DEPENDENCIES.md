# Dependencies Documentation

## Critical Dependency Notes

### bcrypt (functions/package.json)

**Version:** `^5.1.0`  
**Related Types:** `@types/bcrypt@^5.0.2`

**Rationale for Version Constraint:**

The bcrypt package is constrained to `^5.1.0` (not the latest v6.x) due to:

1. **Node.js Compatibility**: bcrypt v6.0.0+ requires Node.js 18+ and has native build requirements that may cause issues in certain Firebase Cloud Functions environments
2. **Type Definition Alignment**: The stable `@types/bcrypt@^5.0.2` provides complete type coverage for bcrypt 5.x APIs
3. **Stability**: bcrypt 5.1.x is a mature, well-tested version with proven reliability in production Firebase environments
4. **Native Module Build**: bcrypt 6.x introduced changes to native module compilation that can cause deployment failures in Cloud Functions

**Migration Path:**
- When Firebase Cloud Functions officially supports and recommends bcrypt 6.x
- After testing in emulators with the new native module builds
- Update both `bcrypt` and `@types/bcrypt` simultaneously

### nodemailer

**Version:** `^7.0.11`  
**Related Types:** `@types/nodemailer@^7.0.0`

**Upgrade Reason:**
- Security fix for CVE-2025-14874
- Both package and type definitions updated to v7.x for compatibility

### firebase-admin & firebase-functions

**Current Versions:**
- `firebase-admin@^13.0.0` (up from 12.x)
- `firebase-functions@^6.0.0` (up from 5.x)

**Breaking Changes:**

These major version updates introduce several breaking changes that require code updates:

#### 1. Node.js Runtime Requirement
- **Minimum:** Node.js 18+
- **Current Project:** Node.js 20 (specified in `engines.node`)
- Update `functions/package.json` if needed:
  ```json
  "engines": {
    "node": ">=18"
  }
  ```

#### 2. Configuration API Changes
Firebase Functions v6.x replaces `functions.config()` with parameterized config:

**Old (v5.x):**
```typescript
const apiKey = functions.config().someservice.key;
```

**New (v6.x):**
```typescript
import { defineString } from 'firebase-functions/params';
const apiKey = defineString('SOMESERVICE_KEY');
```

**Required Updates:**
- Replace all `functions.config()` calls with `defineString()`, `defineInt()`, or `defineSecret()`
- Update environment variable access patterns
- Use `firebase-functions/params` helpers

#### 3. Firebase Cloud Messaging (FCM)
Admin SDK v13.x updates messaging patterns:

**Review and Update:**
- FCM token management
- Message sending patterns using `admin.messaging()`
- Ensure compatibility with new messaging API

#### 4. Authentication & Credentials
Admin SDK v13.x uses updated google-auth-library patterns:

**Current Pattern (already compatible):**
```typescript
import * as admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
```

#### 5. TypeScript & Type Definitions
- Upgrade `@types/*` packages as needed
- Run `npm install` to update transitive dependencies
- Fix any TypeScript compilation errors
- Update `tsconfig.json` if using new Firebase SDK features

**Testing Checklist:**
- [ ] All Cloud Functions compile without TypeScript errors
- [ ] Functions deploy successfully to Firebase
- [ ] Environment variables/secrets are accessible via new params API
- [ ] FCM messaging works (if applicable)
- [ ] Email sending (nodemailer) works correctly
- [ ] Admin authentication flows work
- [ ] No runtime errors in production logs

**Deployment Steps:**
1. Run `npm install` in `functions/` directory
2. Run `npm run build` to compile TypeScript
3. Test in Firebase emulators: `firebase emulators:start`
4. Deploy to staging/dev environment first
5. Monitor logs for any runtime issues
6. Deploy to production after validation

## Version Update History

| Date | Package | From | To | Reason |
|------|---------|------|-----|--------|
| 2026-01-10 | bcrypt | ^6.0.0 | ^5.1.0 | Node.js compatibility, stable types |
| 2026-01-10 | nodemailer | ^6.9.9 | ^7.0.11 | Security fix CVE-2025-14874 |
| 2026-01-10 | @types/nodemailer | ^6.4.14 | ^7.0.0 | Match nodemailer v7.x |
| 2026-01-10 | firebase-admin | ^12.0.0 | ^13.0.0 | Latest features, security updates |
| 2026-01-10 | firebase-functions | ^5.0.0 | ^6.0.0 | New config API, Node 18+ support |
