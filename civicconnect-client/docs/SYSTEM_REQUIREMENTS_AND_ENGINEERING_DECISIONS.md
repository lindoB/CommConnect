# CivicConnect System Requirements and Engineering Handover

**Document status:** Engineering handover baseline  
**System:** CivicConnect municipal service request management platform  
**Frontend package:** React, Vite, JavaScript/JSX, Material UI, React Router, Recharts  
**Backend status:** Not included in this package. The backend described here is required work, not a claim that it already exists.  
**Purpose:** Preserve the requirements, decisions, risks, and implementation boundaries so a future developer can understand what was changed, why it was changed, what is currently demonstrable, and what must be implemented before production.

---

## 1. Executive summary

CivicConnect is intended to provide residents with a secure way to submit and track municipal service requests and provide authorized staff with tools to process requests, monitor service delivery, publish notices, and audit activity.

The frontend package is a **prototype**. It includes user-facing screens and in-memory interactions for the request workflow, administration, data-source selection, import preview, notification management, and downtime/fallback configuration. It does not contain a backend service or a MongoDB connection. Changes held in React state are generally lost on refresh. The import screen deliberately previews local files only and does not write to MongoDB.

The design must preserve these central principles:

1. **Least privilege:** each role sees only the data and actions needed for its work.
2. **Server-side enforcement:** frontend route guards and hidden buttons are usability controls, not security boundaries.
3. **Data-source clarity:** dummy records and real records must be identifiable and must not be accidentally mixed or treated as equivalent.
4. **Idempotent ingestion:** repeating an import must not create duplicate requests.
5. **Traceability:** material actions, administrative changes, outages, recoveries, and import outcomes must be auditable.
6. **Resilience:** a database outage must be detected by the backend and communicated clearly; a fallback submission channel must be configurable by an Administrator.
7. **No invented data:** preserve source timestamps and identifiers; unknown values must remain unknown rather than being fabricated.

## 2. Scope and system boundary

### 2.1 Included in this frontend package

- React/Vite application shell and responsive navigation.
- Dashboard, request list, request detail, request creation, reports, user management, categories, settings, help and audit views from the original prototype.
- Email/password-only login screen with fixed demo accounts and role derived from the email address.
- Information icon and help modal.
- Downtime warning banner/modal and Administrator outage simulation controls.
- Administrator data-source mode selector: dummy data, MongoDB data, or both.
- Administrator import UI for local Excel/CSV preview and Google Sheets URL format validation.
- Administrator notification creation/editing/publishing UI with audience, priority, start and expiry fields.
- Administrator fallback Google Form URL configuration and preview.
- Session-level audit events for several UI actions.

### 2.2 Not included / backend required

- MongoDB models, indexes, migrations, backups or connection management.
- Authentication, password hashing, session management, JWT issuance/refresh/revocation, or password reset.
- API-level RBAC, department/team scoping, rate limiting or input sanitization.
- Durable storage of source configuration, notification schedules, outage state, import jobs, requests or audit events.
- Actual database health monitoring, background polling, alerts or automatic recovery detection.
- Fetching Google Sheets data, parsing and validating source records on the server, or importing data into MongoDB.
- Database-backed duplicate checks, idempotency keys, concurrency protection, rollback or retry/reconciliation.
- Real email, SMS, push or other notification delivery.
- Immutable/append-only audit storage and secured CSV/PDF export endpoints.
- Automated test suite, production deployment configuration, monitoring, observability and disaster recovery.

## 3. Roles and permission model

The backend must maintain an authoritative role assignment for each account. A role sent by the browser must never be trusted. The role list below is the recommended baseline and should be reconciled with the formally approved municipal policy before implementation.

### 3.1 RBAC matrix

| Capability | Requester | Staff / assigned officer | Manager | Administrator |
|---|---|---|---|---|
| Sign in / sign out | Yes | Yes | Yes | Yes |
| Submit a request | Yes | Only if explicitly allowed by policy | Only if explicitly allowed by policy | Only if explicitly allowed by policy |
| View own requests | Yes | Yes, where requester/assignee relationship applies | Yes, where authorized | Yes |
| View other residents' requests | No | Assigned cases only | Team/department scope only | Yes, for legitimate administration |
| Update request status | No, except allowed withdrawal/correction flow | Assigned cases and permitted transitions | Team/department cases and permitted transitions | Administrative override only, audited |
| Assign/reassign requests | No | Only if policy allows | Within authorized team/department | System-wide if policy allows |
| Add internal staff notes | No | Authorized cases | Authorized cases | Authorized cases |
| View public request updates | Own requests | Authorized cases | Authorized scope | Authorized scope |
| View system-wide public notices | Yes | Yes | Yes | Yes |
| Create/edit/publish public notices | No | No by default | Optional delegated permission | Yes |
| View organization-wide reports | No | No by default | Only within authorized scope; global reports require explicit grant | Yes |
| View team/department reports | No | Only if explicitly granted | Yes, within scope | Yes |
| Manage users and roles | No | No | No by default; optionally scoped delegation | Yes |
| Manage categories | No | No | Optional delegated permission | Yes |
| Choose data-source mode | No | No | No | Yes |
| Import Excel / Google Sheets | No | No | No by default | Yes |
| Configure fallback form URL | No | No | No | Yes |
| Simulate downtime | No | No | No | Yes, only in approved test mode/environment |
| View audit logs | No | No by default; scoped logs only if policy grants | Scoped operational logs if explicitly granted | System-wide logs |
| Export audit logs | No | No by default; scoped export only if explicitly granted | Scoped export if explicitly granted | System-wide export |
| Configure platform settings | No | No | Limited delegated settings only | Yes |

### 3.2 Requester privacy boundary

Requesters must only see their own private request records, associated updates, attachments, comments that are intended for the requester, and status history. They must not receive other users' request records through list endpoints, search endpoints, analytics endpoints, exports, dashboard aggregations, or direct detail URLs.

This restriction applies to the **response payload**, not just the visible UI. For example, the frontend must not download every request and then filter it in JavaScript. The backend query must include the authenticated requester's identity.

The prototype has been adjusted so the dashboard's status distribution uses the role-filtered request list, and a requester or staff member opening a request detail URL is checked against the request ownership/assignment. These are client-side protections only; equivalent server checks are mandatory.

### 3.3 Manager scope

Managers should see requests and metrics only for the teams or departments assigned to them. The backend needs an explicit team/department relationship and must filter list, detail, reporting, search and export queries accordingly. A global Manager report should not be assumed unless an authorized global scope is explicitly approved.

Managers should not manage user roles, change the global data-source mode, configure the Google Form fallback URL, simulate a production outage, or alter global system configuration by default.

### 3.4 Administrator scope

Administrators can manage users and roles, categories, global notifications, data-source mode, import jobs, downtime configuration, fallback URL, system settings, and system-wide audit records. Privileged actions should require server-side permission checks and should generate audit events. Where practical, separate routine administration from highly privileged security administration.

## 4. Authentication and login

### 4.1 Frontend demo behaviour

The login form contains only email and password. In local demo mode, the role is derived from a fixed email-to-account mapping rather than a role selector.

Demo accounts (not production credentials):

| Role | Email | Demo password |
|---|---|---|
| Requester | `requester@civicconnect.demo` | `Demo123!` |
| Staff | `staff@civicconnect.demo` | `Demo123!` |
| Manager | `manager@civicconnect.demo` | `Demo123!` |
| Administrator | `admin@civicconnect.demo` | `Demo123!` |

These credentials are intentionally public and are for local demonstration only. They must not be used for real accounts or deployed to production as a working authentication mechanism.

### 4.2 Required backend behaviour

- Store password hashes using a modern password-hashing algorithm such as Argon2id or bcrypt with an appropriate work factor.
- Never store or log plaintext passwords.
- Verify email/password credentials on the server.
- Issue a secure session or token, with expiry and revocation semantics.
- If using cookies, set `HttpOnly`, `Secure`, and an appropriate `SameSite` policy; protect state-changing requests against CSRF as applicable.
- If using JWT, validate signature, issuer, audience, expiry and revocation/rotation strategy. Keep access tokens short-lived and define refresh-token rotation and revocation.
- Load roles and permissions from trusted server-side identity data.
- Implement account activation/deactivation, login throttling, safe error messages, password reset, and appropriate audit events.
- Protect registration so public users cannot self-assign privileged roles.

## 5. Data-source mode

### 5.1 Required modes

The Administrator selects one of the following platform modes:

- `dummy`: show seeded demonstration data only.
- `mongodb`: show real records retrieved from the configured database/API.
- `both`: show both sources, with clear source labels and stable source identities.

### 5.2 Decision and rationale

The setting is a platform presentation/data-selection policy, not an authorization override. RBAC must be applied independently to every source. In `both` mode, a Requester must still only receive their own eligible requests. Managers must still receive only their authorized team/department records.

Prefer isolating dummy data in a separate demo database/environment. If records are combined, include a source discriminator such as `source: "demo" | "mongodb"`, a source-specific stable identifier, and a UI label. Do not allow a demo request to be mistaken for a real municipal case.

### 5.3 Backend requirements

- Persist the selected mode in a protected configuration document.
- Expose a read endpoint for effective configuration and an Administrator-only update endpoint.
- Audit previous value, new value, actor, timestamp, and reason where required.
- Enforce the mode in request query services, reports, search and export services.
- Ensure source switching does not delete or rewrite records.
- Define fail-closed behaviour if MongoDB mode is selected but the database is unavailable. Do not silently fall back to dummy data without a visible and audited state change.

Suggested configuration document:

```json
{
  "key": "dataSourceMode",
  "value": "dummy",
  "updatedAt": "UTC ISO-8601 timestamp",
  "updatedBy": "user-id",
  "version": 1
}
```

## 6. Request lifecycle and timestamps

### 6.1 Minimum request fields

A request should include a stable internal ID, public tracking number, requester ID, title, description, category ID, location, status, priority, assigned team/officer where applicable, timestamps, source provenance, and version/concurrency metadata.

Recommended fields:

| Field | Purpose |
|---|---|
| `_id` | MongoDB primary key |
| `requestNumber` | Human-readable tracking reference, unique |
| `requesterId` | Authoritative user relationship |
| `title`, `description`, `categoryId`, `location` | Request content |
| `status`, `priority` | Workflow state |
| `teamId`, `assigneeId` | Authorization and assignment scope |
| `createdAt` | Time CivicConnect created the record |
| `updatedAt` | Last successful modification time |
| `submittedAt` | Original submission time, if known |
| `source` | `application`, `excel`, `google_sheets`, `downtime_fallback`, or `demo` |
| `sourceRecordId` | Original source ID, if available |
| `importedAt` | Time the import operation wrote the record |
| `importJobId` | Import job that created/evaluated the record |
| `version` | Optional optimistic concurrency counter |

Store timestamps in UTC, preferably as BSON Date values. Convert to the viewer's local timezone in the UI. Do not replace `submittedAt` with `importedAt`. If the original date is missing or untrustworthy, keep it null and record that fact in import diagnostics rather than inventing a date.

### 6.2 Request lifecycle

Recommended baseline: `Submitted` → `Triaged` → `Assigned` → `In Progress` → `Resolved` → `Closed`. Define permitted transitions, who can perform each transition, whether a citizen can reopen a case, and how cancellation works. Store status history as discrete events with actor, old status, new status, timestamp and optional reason. Avoid overwriting history with only the latest status.

### 6.3 SLA and priority

Priority labels alone do not provide SLA monitoring. The backend should store configurable response/resolution targets by category and priority, calculate due timestamps, detect breaches using a scheduled worker, and emit notifications/audit events when thresholds are crossed. Define business hours, holidays, paused states and escalation rules before implementing SLA metrics.

## 7. Excel and Google Sheets import

### 7.1 Supported inputs

- Administrator uploads `.xlsx`, `.xls`, or `.csv` file.
- Administrator supplies a supported public Google Sheets URL.
- Frontend provides local file preview and basic in-file duplicate/required-field checks.
- Google Sheets URL validation in the prototype checks URL shape only; it does not fetch spreadsheet contents.
- The frontend does not write any data to MongoDB.

### 7.2 Import lifecycle

1. Authenticate Administrator and create an import job.
2. Validate file size, file type, URL/domain, and access policy.
3. Parse the source in a backend worker or controlled service; do not trust browser validation.
4. Map source columns to canonical request fields. Save the mapping for reproducibility.
5. Validate required fields, category mapping, dates, encoding, and location/requester references.
6. Normalize fields consistently.
7. Check exact duplicates against MongoDB and within the current import batch.
8. Flag likely duplicates for manual review instead of dropping uncertain records automatically.
9. Present counts and representative validation errors to the Administrator.
10. Require explicit confirmation before committing a large import.
11. Persist eligible records using idempotent writes and appropriate unique indexes.
12. Save row-level results and an immutable import audit event.
13. Support retry/reconciliation without creating duplicates.

### 7.3 Duplicate detection policy

Do not rely on title alone, or on a fuzzy text similarity score alone. Use the strongest available stable identifier first:

1. Existing CivicConnect `requestNumber` or trusted source ID, if present.
2. `(source, sourceRecordId)` unique key when the source provides a stable row/record identifier.
3. A normalized fingerprint built from selected fields, versioned by algorithm. Candidate fields might include normalized requester reference, category, location and description, with a time component only if the source quality justifies it.
4. Similarity checks can create `potential_duplicate` review items but should not automatically discard a potentially legitimate request.

The duplicate policy must be transparent, configurable where appropriate, and tested with false-positive cases. A record's original timestamp should not be modified by the duplicate check.

### 7.4 Idempotency and concurrency

- Use unique indexes for stable unique keys.
- Use `upsert` or an equivalent idempotent operation for known source records.
- Use a deterministic import job ID and row key to safely retry work.
- Make import workers safe when two jobs process the same row concurrently.
- Use transactions where supported/appropriate, or design compensating/reconciliation logic for partial failures.
- Record per-row outcomes: `created`, `skipped_exact_duplicate`, `flagged_potential_duplicate`, `rejected_validation`, or `failed_retryable`.
- Do not overwrite an existing request because a new row looks similar.

### 7.5 Import metadata

Each job should record `importJobId`, source type, source filename or canonical sheet identifier, file hash or source version where appropriate, initiatedBy, startedAt, completedAt, mapping version, totals, row outcomes, errors, and status. Avoid storing public sheet secrets or credentials in logs. Do not fetch arbitrary URLs without SSRF protections; allow only supported Google Sheets hosts and validate redirects and resolved destinations on the backend.

### 7.6 Future synchronization

A later synchronization worker can periodically or manually retrieve Google Form responses or Google Sheets rows after recovery. It must use the same validation, provenance, duplicate, idempotency, review and audit pipeline as manual imports. It should maintain a checkpoint or source cursor, handle edits/deletions explicitly, and avoid treating a public form as trusted input.

## 8. Downtime detection, notification and recovery

### 8.1 Detection responsibility

The backend owns database health detection. Use connection state and bounded health checks, with timeouts and limited retries. A transient failed query should not instantly trigger a permanent outage state. Define thresholds and hysteresis to avoid flapping. Health endpoints must not disclose connection strings or sensitive infrastructure details.

### 8.2 User-facing outage modal

When the backend reports database-dependent service unavailable, the UI should explain:

- The database-backed request service is temporarily unavailable.
- New requests may not be saved to the main system.
- The severity level and time detected.
- A recovery estimate only if an authoritative estimate exists; otherwise say it is unknown.
- The Administrator-configured Google Form link, if valid.
- What to do if the fallback form is unavailable.

The popup may reappear every two minutes until acknowledged, but repeated interruption should stop after acknowledgement for the current outage/session. Keep a persistent warning icon/button so the user can reopen the information. Store acknowledgement state in session-scoped client state and, if needed, synchronize acknowledgement for authenticated users. Never imply that acknowledgement resolves the outage.

### 8.3 Recovery

The backend should confirm recovery after successful health checks. Record the start, detection, and recovery timestamps; outage reason/category where known; affected service; and related incidents. The UI should remove the active outage state only after authoritative recovery confirmation. Publish a recovery notice if required by policy. Reconcile fallback submissions before treating all requests as fully synchronized.

### 8.4 Administrator simulation

Provide an Administrator-only simulation control in a dedicated test/staging environment. Simulation must set a test outage flag or mock health provider; it must not kill, disconnect or corrupt a real production database. Clearly label simulated incidents. Audit who started and stopped the simulation and when. If production simulations are ever permitted, require explicit approval, strict isolation, feature flags, time limits and safeguards against changing real data.

## 9. Google Form fallback configuration

The Administrator must be able to update the clickable Google Form link from the administration interface. The setting should include the URL, update timestamp, updating administrator, and optional user instructions. The modal and persistent warning must use the currently active configuration returned by the backend.

Validation rules:

- Require HTTPS.
- Restrict allowed hostnames to approved Google Forms/Google Sheets domains where practical.
- Reject JavaScript/data/file URL schemes and unsafe redirects.
- Verify the link opens before publication where possible; do not claim the form itself is available merely because the URL is syntactically valid.
- Show a safe fallback contact instruction if no valid link is configured.
- Audit every link change and consider approval/review for privileged changes.

Google Form submissions remain external data. They must be reviewed, validated and deduplicated before import. The long-term design may use an API or controlled synchronization process, but it must preserve the same audit and duplicate-prevention controls.

## 10. Notification management

### 10.1 Notification fields

Each notification should contain an ID, title, message, category, priority, audience, `startAt`, `expiresAt`, status, creator, created/updated timestamps, publisher, published timestamp, and optional related incident or maintenance window.

### 10.2 Lifecycle

`Draft` → `Scheduled` → `Published` → `Expired` or `Archived`. Publication must respect the start time. Expired notifications disappear from active user-facing views automatically but remain stored for audit/history. Edits to published notices should be versioned or auditable. Deletion should generally be replaced by archival/withdrawal to preserve history.

### 10.3 Audience and delivery

Public community notices are visible to Requesters. Operational/internal notices must be scoped to staff roles. Do not expose internal incident notes in a public notification. The backend should serve active notices based on server time and authenticated role. If email/SMS/push delivery is required, implement a provider adapter, retry queue, delivery receipts and failure monitoring; the frontend alone cannot deliver those messages.

## 11. Audit logging and monitoring

### 11.1 Events to record

**Identity and access:** successful/failed login, logout where captured, password reset, account activation/deactivation, role/permission changes, forbidden access attempts where appropriate.

**Requests:** created, edited, assigned/reassigned, status transition, comment/note added, attachment added/removed, approval, closure, reopening and export.

**Administration:** user/category management, data-source mode change, global setting changes, fallback URL changes, notification create/edit/publish/withdraw, role change, export activity.

**Import:** job created, preview completed, validation failed, import started/completed/failed, duplicates skipped, potential duplicates flagged, retry, cancellation, row-level result summary.

**Reliability:** database health failure/recovery, outage state changes, downtime simulation start/stop, fallback usage if measurable, sync checkpoints and synchronization failures.

### 11.2 Event schema

Recommended event fields:

```json
{
  "eventId": "unique-id",
  "occurredAt": "UTC ISO-8601 timestamp",
  "actorId": "user-id-or-system",
  "actorRole": "role-at-event-time",
  "action": "REQUEST_STATUS_CHANGED",
  "entityType": "request",
  "entityId": "request-id",
  "outcome": "success",
  "ipAddress": "only if policy permits",
  "correlationId": "request-or-job-correlation-id",
  "details": {"oldStatus": "Assigned", "newStatus": "In Progress"}
}
```

Do not put passwords, access tokens, secret keys, or unnecessary personal data in logs. Store only the detail required for investigation and accountability.

### 11.3 Permissions and exports

- Requesters: no audit-log access.
- Staff: no general audit-log access by default.
- Managers: scoped operational logs only if the approved policy grants it; no system-wide security events by default.
- Administrators: system-wide audit access, subject to separation-of-duties policy.

CSV and PDF exports must enforce the same scope as the on-screen results. Every export should itself create an audit event. Audit storage should be append-only from normal application workflows; changes/deletions should be restricted to controlled retention processes. Consider separate storage, integrity controls and retention policy for high-assurance deployments.

## 12. Information icon behaviour

The information (`i`) icon appears in the authenticated application's top bar and opens a modal. The modal should explain the purpose of CivicConnect, request submission guidelines, privacy/access boundaries, how to track requests, how to obtain help, and what to do during a service interruption. If an outage is active, show a clear link to the current downtime details and fallback form. The modal should not expose internal-only procedures, private data, or raw infrastructure diagnostics.

Recommended UX:

- Use an accessible icon button with an explicit label and tooltip.
- Open a keyboard-accessible modal with a clear title and close action.
- Keep the modal short, with links to the Help Centre and downtime information.
- Do not use the information icon as the only outage warning; the persistent outage indicator must be separate and visible.

## 13. Frontend implementation status

The following status is based on code inspection of this package. The build could not be verified in this environment because dependency installation did not complete; run the documented build locally and resolve any reported errors before treating the package as verified.

| Requirement / feature | Status in frontend | Boundary / next step |
|---|---|---|
| Responsive React application and visual theme | Implemented in source | Run build and browser smoke tests |
| Email/password-only demo login | Implemented as local demo mapping | Replace with secure backend auth; demo credentials are public |
| Role-derived demo identity | Implemented in frontend | Server must be authoritative for real roles |
| Requester request-list filtering | Partially implemented | Must be repeated in backend queries and exports |
| Requester detail-route ownership check | Partially implemented | API must reject unauthorized direct access |
| Dashboard request status aggregation | Partially privacy-adjusted | All metrics/reports must be server-scoped |
| Request create/update demo workflow | Demo state only | Connect request APIs and persistence |
| Administrator data-source mode selector | UI implemented, session state only | Persist and enforce through backend |
| Excel/CSV local preview | Implemented with SheetJS | Backend must independently parse/validate/import |
| In-file duplicate detection | Basic exact row comparison only | Add canonical normalization, database checks and idempotency |
| Public Google Sheets URL field | URL format validation only | Backend fetch/integration required |
| MongoDB insert/update | Missing | Implement backend API and import worker |
| Timestamp provenance | UI/documented fields; not complete in current demo model | Implement canonical schema and server timestamps |
| Administrator fallback form URL | Editable in local demo settings | Persist securely, validate and serve from backend |
| Outage modal/help icon | UI implemented | Backend health state and client polling/event delivery required |
| Downtime simulation | Frontend-only simulation control | Isolate behind backend test feature flag/environment |
| Notification authoring and publish controls | Demo state only | Server schedule/expiry/audience enforcement required |
| Automatic notification expiry | UI computes an expired label on render | Backend must filter active notices and retain history |
| Audit events | Local demo entries | Durable append-only server audit service required |
| CSV audit export | Existing UI function | Ensure scope; add backend audit export and audit the export |
| PDF audit export | Not implemented as a dedicated feature | Add server PDF generation or a controlled print/export implementation |
| Real email/SMS/push delivery | Missing | Integrate provider and retry/delivery monitoring if required |
| Database outage/recovery detection | Missing | Implement health checks, state machine and recovery confirmation |
| Backend RBAC and data isolation | Missing in this package | Mandatory before production |
| Automated tests / production build verification | Requires verification | Add unit, integration, security and end-to-end tests |

## 14. Backend architecture recommendation

Use a modular REST API (for example Node.js + Express + MongoDB/Mongoose if that aligns with the selected stack). Keep controllers thin and put business logic in services. Recommended logical modules:

- `auth`: login, logout/session, refresh/revoke, password reset, account status.
- `users`: user profiles, role assignment, team/department scope.
- `requests`: create/list/detail/update, state transitions, comments, attachments, assignment.
- `categories`: category configuration.
- `reports`: permission-filtered aggregates and SLA metrics.
- `notifications`: drafts, publication, scheduling, expiry, audiences.
- `system-config`: data source mode, downtime configuration, fallback URL.
- `health`: readiness/liveness and database dependency status.
- `imports`: upload, sheet fetch, mapping, validation, duplicate detection, job tracking, commit/retry.
- `audit`: append-only event creation, query, CSV/PDF export.
- `workers`: scheduled expiry, SLA checks, import jobs, fallback synchronization and notification delivery.

### 14.1 API contract (proposed)

| Method | Endpoint | Purpose / access |
|---|---|---|
| POST | `/api/v1/auth/login` | Verify email/password and create session/token |
| POST | `/api/v1/auth/logout` | Revoke session/refresh token |
| GET | `/api/v1/auth/me` | Return trusted current identity and permissions |
| GET | `/api/v1/requests` | Return only authorized records; supports filters and pagination |
| POST | `/api/v1/requests` | Create request for authenticated requester or authorized role |
| GET | `/api/v1/requests/:id` | Enforce object-level access check |
| PATCH | `/api/v1/requests/:id` | Validate permitted fields and status transitions |
| POST | `/api/v1/requests/:id/comments` | Add appropriately scoped public/internal comment |
| GET | `/api/v1/reports/summary` | Role- and scope-filtered metrics |
| GET/POST/PATCH | `/api/v1/admin/users` | Administrator-only user management |
| GET/POST/PATCH | `/api/v1/admin/categories` | Administrator category management |
| GET/PATCH | `/api/v1/admin/config/data-source` | Read/update source mode; admin update only |
| GET/PATCH | `/api/v1/admin/config/downtime` | Read/update downtime message and fallback URL |
| POST | `/api/v1/admin/downtime/simulation` | Test-only, environment-gated simulation |
| GET | `/api/v1/health/readiness` | Dependency health without sensitive diagnostics |
| GET/POST/PATCH | `/api/v1/admin/notifications` | Manage notifications; audience checked server-side |
| POST | `/api/v1/admin/imports` | Create import job from upload or approved sheet URL |
| GET | `/api/v1/admin/imports/:jobId` | Inspect job progress and row outcomes |
| POST | `/api/v1/admin/imports/:jobId/commit` | Confirm import after validation and review |
| POST | `/api/v1/admin/imports/:jobId/retry` | Retry eligible failed rows idempotently |
| GET | `/api/v1/admin/audit` | Search/filter system audit logs; scoped permission required |
| GET | `/api/v1/admin/audit/export?format=csv` | Authorized CSV export; export event audited |
| GET | `/api/v1/admin/audit/export?format=pdf` | Authorized PDF export; export event audited |

This table is a proposed contract, not a claim that these endpoints currently exist. Version and document the final contract before frontend integration.

## 15. Security requirements

- Apply authentication and authorization middleware to every protected endpoint.
- Enforce object-level permissions on request IDs, import jobs, notifications, and audit records.
- Never rely on hidden navigation, client state, query parameters, or role values supplied by the browser.
- Validate all inputs on the server; use allowlists for updateable fields to prevent mass assignment.
- Use rate limits and abuse protection for login, request creation, public form endpoints and imports.
- Protect file uploads with file size limits, extension/MIME/signature checks, malware scanning where appropriate, and safe temporary storage.
- Protect Google Sheets fetching against SSRF, unsafe redirects, huge responses and untrusted content.
- Use TLS, secure secret storage, environment-specific credentials, least-privilege database accounts and regular dependency updates.
- Avoid logging secrets and unnecessary personal information.
- Apply CORS allowlists, security headers, safe error messages, CSRF protections where relevant, and request validation.
- Keep demo data separated from production data and disable demo login in production builds.
- Define retention and deletion policy for requests, attachments, imports, notifications and audit logs.
- Back up MongoDB and test restore procedures.

## 16. UI/UX requirements

- Preserve the clean teal/amber/slate visual style and use Material UI icons instead of emoji.
- Use clear labels, field validation, loading states, empty states and error messages.
- Make the information icon keyboard-accessible and label it for assistive technology.
- Keep downtime status visible without repeatedly blocking the user after acknowledgement.
- Clearly label dummy/demo records and distinguish them from production records.
- In import preview, show column mapping, row-level validation, exact duplicate count, potential duplicate review queue, rejected rows, and final result summary.
- Use explicit confirmation for destructive or high-impact operations.
- Display timestamps in local time but preserve UTC values in storage.
- Provide responsive tables, keyboard navigation, sufficient contrast and meaningful focus indicators.

## 17. Verification and test plan

### 17.1 Authentication/RBAC tests

- Each demo role can sign in using its own demo email and the demo password.
- Invalid email/password is rejected.
- Production role cannot be changed by editing local state, request payload or URL.
- Requester cannot query, search, export or open another user's request.
- Staff cannot access unassigned cases unless the policy explicitly permits it.
- Manager cannot access another department's records or global reports without a specific permission.
- Administrator-only routes and APIs reject all other roles.

### 17.2 Data-source tests

- Dummy mode returns only demo records.
- MongoDB mode returns only authorized database records.
- Both mode labels source records and applies role filters before response creation.
- Switching modes does not mutate or delete records.
- MongoDB unavailable in MongoDB mode shows an outage/error state rather than silently substituting dummy records.

### 17.3 Import tests

- Valid Excel/CSV files preview expected rows and headers.
- Empty, malformed, oversized and unsupported files fail safely.
- Public sheet URL validation rejects unsafe hosts and malformed URLs.
- Missing required fields are reported with row numbers.
- Exact duplicate rows within one batch are detected.
- Existing database records are detected using stable source IDs and duplicate fingerprints.
- Potential duplicates are flagged for review.
- Re-running the same import does not create duplicates.
- Two concurrent import jobs cannot create the same source record twice.
- Partial failures can be retried without re-importing successful rows.
- Original submittedAt is preserved separately from importedAt.

### 17.4 Downtime and notification tests

- Backend health failure triggers the UI warning within the agreed detection interval.
- Modal shows configured fallback URL and useful details.
- Missing/invalid URL produces a safe alternative instruction.
- Acknowledging the modal stops repeated blocking for the current outage but leaves a persistent warning.
- Recovery is displayed only after backend recovery confirmation.
- Simulation cannot affect production database connectivity or records.
- Scheduled notifications appear at start time and disappear from active views after expiry.
- Expired notices remain queryable by authorized audit/history views.

### 17.5 Audit tests

- Critical user, request, configuration, import, notification and outage events are recorded.
- Audit entries cannot be edited/deleted through ordinary APIs.
- Requesters cannot view audit logs.
- Manager logs are restricted to approved scope.
- CSV/PDF exports contain only authorized records and create an export audit event.
- Logs do not contain passwords, tokens or secret configuration values.

### 17.6 Build and usability tests

- `npm install` completes with a supported Node.js version.
- `npm run build` completes without errors.
- Login, all roles, admin screens, file preview, modal and navigation work in supported browsers.
- Check responsive layouts at mobile, tablet and desktop widths.
- Run accessibility checks for keyboard use, focus, modal behaviour, labels and contrast.

## 18. Implementation sequence

1. **Confirm policy:** approve role scope, team/department model, status transitions, public/internal comments, data retention and notification audiences.
2. **Stabilize frontend:** run build, fix errors, add frontend unit tests and remove any accidental production-like assumptions.
3. **Implement authentication and RBAC:** do this before exposing real data.
4. **Implement request APIs:** create/list/detail/update, ownership/assignment enforcement, status history and server timestamps.
5. **Implement configuration APIs:** data-source mode, fallback URL and safe outage state.
6. **Implement health monitoring:** backend health checks, outage state, recovery confirmation and UI refresh strategy.
7. **Implement notifications:** lifecycle, scheduling, expiry, audience and audit.
8. **Implement import pipeline:** mapping, validation, duplicate detection, unique indexes, idempotent jobs and review UI.
9. **Implement audit service and exports:** append-only events, scoped search and CSV/PDF generation.
10. **Add operational controls:** monitoring, structured logs, backups, restore test, secrets management and deployment safeguards.
11. **Run end-to-end security and recovery tests:** especially direct-object access, role boundaries, concurrent imports and database outage/recovery.

## 19. Engineering decisions and rationale

| Decision | Rationale | Consequence / follow-up |
|---|---|---|
| Login has only email and password | Role selection by the user would allow role impersonation in a demo and is misleading for real auth | Demo role is derived from fixed email mapping; production role must come from backend identity |
| Dummy/MongoDB/both are explicit modes | Makes demonstration and live operation clear and administrator-controlled | Backend must enforce mode; do not treat it as an authorization bypass |
| Dummy and real records require provenance | Prevents demo data from being mistaken for real civic records | Add source/sourceRecordId fields and visible UI labels |
| Import screen previews before commit | Reduces accidental bulk corruption and gives administrators visibility into quality | Backend still needs a secure import job, preview, commit and retry API |
| Duplicate detection uses stable IDs first | Text-only matching can reject legitimate separate incidents | Define normalized fingerprints and manual review for uncertain matches |
| Request timestamps have separate meanings | Import time and original submission time are not interchangeable | Preserve submittedAt and add importedAt/createdAt independently |
| Fallback link is administrator-configurable | Form URL can change without a frontend redeployment | Store and validate it in backend configuration and audit every change |
| Downtime simulation is separate from real health | Testing should not deliberately interrupt production | Use environment-gated mock health state and clear simulation labels |
| Expired notifications are retained | Expiry should affect visibility, not erase accountability | Use status/expiry filtering and retention policy, not destructive deletion |
| Audit exports follow log access scope | Exporting can leak more data than the on-screen table | Enforce scope on server and audit every export |
| Frontend checks are not security controls | Browser code is under user control | Repeat all permissions, validation and source filtering on backend |

## 20. Open questions to resolve before backend completion

- What exact municipal departments/teams exist, and how are managers assigned to them?
- Are staff allowed to create requests, or is creation reserved for Requesters?
- Which request fields can Requesters edit after submission, and can they withdraw/reopen a request?
- Are internal notes separate from public comments?
- Is user registration public, invite-only, or administrator-created?
- What are the approved SLA targets, business hours and escalation rules?
- Should Managers have any audit access, and if so, which event types and scopes?
- What is the required audit retention period and who can authorize purge operations?
- What source columns and identifiers exist in the actual Excel file and Google Sheet?
- Is Google Form fallback content accessible to an integration account, and what is the approved import mechanism?
- Which notification channels are required (in-app, email, SMS, push) and who owns provider credentials?
- Is a PDF audit export required as a downloadable file or is browser print-to-PDF acceptable for the first release?
- What hosting, availability, backup, disaster-recovery and privacy requirements apply?

## 21. Handover conclusion

This frontend package demonstrates the intended workflows and records the engineering direction. It is not a completed production system. The next developer should begin by running the build and smoke tests, then implement server-side authentication and RBAC before connecting real request data. The import, data-source, notification, downtime and audit screens should be connected to versioned APIs that enforce the contracts in this document. Any change to these decisions should be recorded with the reason, security impact, migration implications and tests added.
