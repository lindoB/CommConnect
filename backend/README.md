# CivicConnect MERN Backend

Express REST API with MongoDB Atlas/Mongoose persistence. The frontend in `../civicconnect-client` now uses the API for registration, sign-in, session restoration (`/auth/me`) and sign-out. Other existing frontend pages are still prototype screens and must be integrated endpoint-by-endpoint before claiming the entire UI is database-backed.

## Important project-governance note

The submitted PED v2.0 baseline names ASP.NET Core and PostgreSQL. Switching to MERN/MongoDB Atlas is a material architecture and persistence change. Review `docs/ADR-TECH-004-MERN-MongoDB-Change.md`, raise a formal change request, update the PED/RTM/risk register, and obtain the required team/lecturer approval. The implementation does not itself imply approval.

## Requirements

- Node.js 20+
- MongoDB Atlas cluster
- Atlas database user with least-privilege read/write access to the `civicconnect` database
- Git; keep credentials out of source control

## Local setup

1. In MongoDB Atlas, create a cluster and a database user. Add your current development IP to **Network Access**; do not use `0.0.0.0/0` as a permanent setting.
2. Copy `backend/.env.example` to `backend/.env`.
3. Set `MONGODB_URI` to the Atlas connection string, including the database name `civicconnect`. URL-encode special characters in the database password.
4. Generate independent random secrets for `JWT_SECRET` and `JWT_REFRESH_SECRET` (the latter is reserved for a future refresh-token flow). Use at least 32 random bytes per secret.
5. Set `CLIENT_ORIGIN=http://localhost:5173`.
6. Install and initialise the backend:

   ```bash
   cd backend
   npm install
   npm run seed
   npm run dev
   ```

   Before `npm run seed`, temporarily add `SEED_ADMIN_NAME`, `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` to `.env`. Use a unique password of at least 12 characters. The seed script refuses to overwrite an existing admin and creates the default categories. Remove the seed-only variables from `.env` afterwards.
7. In a second terminal, configure and run the frontend:

   ```bash
   cd civicconnect-client
   npm install
   # optional: copy .env.example to .env and change VITE_API_URL if needed
   npm run dev
   ```

8. Open the Vite URL, register a requester account, and sign in. Sign in with the administrator account created by the seed script to test administrator-only API endpoints.

Check `http://localhost:5000/api/health`. It reports API status and whether the MongoDB connection is active. Do not publish a real database URI, password, JWT secret, or production `.env` file in GitHub or in project documentation.

## Authentication and security behaviour

- Login verifies credentials against MongoDB. Passwords are stored as bcrypt hashes; plaintext passwords are never stored.
- Public registration always creates the `Requester` role. It does not accept a role from the client.
- Roles are reloaded from the database for each authenticated request. A client-provided role is never authoritative.
- Protected endpoints require `Authorization: Bearer <accessToken>`.
- Access tokens expire after `JWT_EXPIRES_IN` (default 15 minutes). Sign-out increments a database token version, invalidating prior tokens for that user.
- Login and registration are rate-limited. Responses avoid revealing whether an email address exists.
- Helmet, CORS allow-list, JSON request-size limit, input validation, Mongoose schema validation, and a central error handler are configured.
- Admin and scoped access is enforced by middleware and server-side queries. A frontend route guard is not a security control.
- This is a student MVP baseline, not a production security certification. Before production, add refresh-token rotation or a secure cookie session, CSRF protection if cookies are used, password reset and email verification, dependency/security scanning, stronger audit retention controls, operational monitoring, backup/restore drills, and deployment-specific hardening.

## API summary

All endpoints are prefixed by `/api`.

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/health` | Public | API and DB health |
| POST | `/auth/register` | Public, rate-limited | Register requester |
| POST | `/auth/login` | Public, rate-limited | Verify DB credentials and issue access token |
| GET | `/auth/me` | Authenticated | Current database-backed user |
| POST | `/auth/logout` | Authenticated | Invalidate existing tokens for the user |
| GET | `/categories` | Authenticated | Active categories (all categories for Administrator) |
| POST | `/categories` | Administrator | Create category |
| PATCH | `/categories/:id` | Administrator | Update/deactivate category |
| GET | `/requests` | Authenticated | Paginated, scoped request list; supports `page`, `limit`, `status`, `priority`, `category`, `q`, `overdue=true` |
| POST | `/requests` | Authenticated | Create service request |
| GET | `/requests/:id` | Authenticated and scoped | Request detail |
| PATCH | `/requests/:id/status` | Staff, scoped Manager, Administrator | Controlled status transition, version check and audit record |
| PATCH | `/requests/:id/assignment` | Manager/Administrator | Assign a staff member and/or department |
| POST | `/requests/:id/comments` | Authenticated and scoped | Add public comment or authorised internal note |
| GET | `/users` | Administrator | Paginated user list and filters |
| POST | `/users` | Administrator | Create staff/manager/admin/requester account |
| PATCH | `/users/:id` | Administrator | Change role, department, active state, or password |
| GET | `/reports/summary` | Manager/Administrator | Scoped totals, status/category distribution and overdue count |
| GET | `/reports/audit` | Administrator | Paginated audit history |
| GET | `/notifications` | Authenticated | Published notices for the user's audience (Administrator can see all) |
| POST | `/notifications` | Administrator | Create notification |
| PATCH | `/notifications/:id` | Administrator | Update/publish/archive notification |
| GET | `/settings` | Administrator | Read persisted settings |
| PUT | `/settings/:key` | Administrator | Update supported setting |

Successful responses use `{ "success": true, ... }`; errors use `{ "success": false, "message": "..." }`. Paginated list responses include `pagination`.

## Data model

- `User`: email unique index, bcrypt password hash, authoritative role, active state, department and token version.
- `Category`: controlled request categories.
- `ServiceRequest`: request number, category, priority, status, location, requester, assignee, department, due/resolution dates, comments, lifecycle events and optimistic version.
- `AuditLog`: actor, action, entity, details, IP/user-agent and timestamp. The API exposes audit listing read-only; no endpoint permits ordinary users to edit/delete audit entries.
- `Notification`: audience, status and publication/expiry times.
- `SystemSetting`: persisted key/value configuration.

Indexes support request number, status, priority, requester, assignee, department, due date, timestamps and text search. Request status and audit record are committed in a MongoDB transaction; MongoDB Atlas replica-set transactions are required. The request version is incremented and can be supplied to status updates to reject stale writes.

## Example requests

Register:
```http
POST /api/auth/register
Content-Type: application/json

{"name":"Alex Citizen","email":"alex@example.com","password":"A-long-unique-password"}
```

Login:
```http
POST /api/auth/login
Content-Type: application/json

{"email":"alex@example.com","password":"A-long-unique-password"}
```

Create a request (use a category `_id` returned by `GET /api/categories`):
```http
POST /api/requests
Authorization: Bearer <accessToken>
Content-Type: application/json

{"title":"Broken streetlight near the library","description":"The streetlight has not worked for three nights and the footpath is very dark.","category":"<categoryObjectId>","location":"Outside the community library","priority":"High"}
```

## Verification checklist

- [ ] Confirm Atlas connectivity and `/api/health`.
- [ ] Confirm duplicate registration returns `409`.
- [ ] Confirm wrong password returns `401` without disclosing account existence.
- [ ] Confirm registration cannot assign an elevated role.
- [ ] Confirm a requester cannot read another request by list or direct ID.
- [ ] Confirm non-admin requests to user administration/audit endpoints return `403`.
- [ ] Confirm invalid status transitions return `409`.
- [ ] Confirm concurrent/stale version updates are rejected.
- [ ] Confirm status change and audit event are committed together.
- [ ] Confirm `.env` is ignored and secrets are absent from Git history.
- [ ] Run API integration tests against an isolated test database before merging/deployment.

## Known limitations to record in PED / defect register

1. The supplied frontend is a prototype. This change wires real registration/login/session restoration/sign-out, but the dashboard, request pages, reports, imports, notification editor, settings, audit table and user/category management still need to call these endpoints instead of relying on local demo state.
2. The report API provides a summary baseline, not a complete export/reporting suite.
3. The Google Sheets/Excel import preview is not yet a server-side import pipeline; duplicate detection, idempotency, row-level error reports and import-job auditing remain to be implemented.
4. Password reset, email verification and access-token refresh/rotation are not implemented.
5. Department/team assignment policy must be confirmed by the team/stakeholder; managers without a department intentionally see no private request data.
6. MongoDB transaction availability must be confirmed in the chosen Atlas environment.
7. Backend API automated integration/security tests and CI quality gates must be added before release readiness is claimed.
