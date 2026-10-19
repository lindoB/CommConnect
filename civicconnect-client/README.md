# CivicConnect React Frontend

A React + Vite + Material UI prototype for a municipal service request platform. The UI uses a restrained teal, amber, off-white and slate palette and Material UI icons (no emoji icons). `node_modules` is intentionally excluded.

## Requirements and startup
- Node.js 18+ and npm
- `npm install`
- `npm run dev`
- `npm run build` for a production bundle

## Real authentication setup
The login and registration screens use the Express API and MongoDB-backed accounts. Copy `.env.example` to `.env` if the API is not at `http://localhost:5000/api`. Do not use the former demo credentials; they are no longer accepted by the login form. Registration creates a Requester account only. Privileged roles are provisioned by an Administrator.

Start the backend first; see `../backend/README.md` for Atlas setup and administrator seeding. Authentication tokens are stored in browser local storage for this academic MVP, so use HTTPS in deployed environments and do not treat this storage choice as production-hardened.

## Features represented in the frontend
- Responsive dashboard, request list, request details, create request, status updates and comments using demo state.
- Login with role determined by the demo email, rather than a user-selectable role field.
- Requester-focused request views and restricted administrator routes (frontend guardrails only).
- Help/information modal and downtime detail modal with configurable fallback link.
- Administrator data-source mode selector: dummy, MongoDB, or both. The selection is local state and demonstrates the intended control.
- Administrator import preview for `.xlsx`, `.xls`, and `.csv`; basic row validation and in-file duplicate detection. Google Sheets URL format validation is provided, but fetching a sheet requires a backend integration. **No imports are written to MongoDB.**
- Administrator notification draft/edit/publish UI with priority, audience, start and expiry fields.
- Administrator downtime/fallback settings with preview and audit event in demo state.
- Searchable audit register and CSV export.

## Important implementation boundaries
The frontend is a UI prototype. Most data is held in React state and is lost on refresh. It does not implement a real API, MongoDB connection, secure login, JWT/session validation, real database health detection, real outage polling, server-side RBAC, immutable audit logs, Google Sheets retrieval, database duplicate checks, or import synchronization. The import screen only previews rows locally.

**Do not deploy this prototype as a production service.** Client-side route checks and the administrator data-source setting are not security controls. The backend must authorize every request and return only records the current user may access.

## Documentation
Read `docs/SYSTEM_REQUIREMENTS_AND_ENGINEERING_DECISIONS.md` for the requirements baseline, RBAC matrix, architecture, data schema, API contract, import design, downtime and notification workflows, audit policy, security requirements, test plan, known gaps, and implementation sequence.

## Suggested source structure
```text
src/
  components/       Shared UI components
  context/          In-memory demo state
  data/             Demo records
  layouts/          Responsive application shell
  services/         Reserved for API client modules
  App.jsx           Routes and page-level UI
  main.jsx          React entry point and theme
  styles.css        Responsive styling
````
