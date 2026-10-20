# Changelog

## 1.1.0 - Engineering handover prototype

### Added
- Login form now accepts only email and password; local demo role is derived from the known demo email.
- Demo accounts for Requester, Staff, Manager and Administrator are documented in README.
- Administrator data-source management screen for dummy, MongoDB and combined modes.
- Administrator import preview for Excel/CSV, with required-field and within-file duplicate checks.
- Google Sheets URL format validation with explicit disclosure that fetching requires backend work.
- Administrator notification management screen with priority, audience, start and expiry dates.
- Administrator downtime simulation controls and fallback form URL settings.
- Global information/help modal and downtime details modal.
- Audit-log search, date range filtering, CSV export and print/save-to-PDF action.
- Detailed system requirements, engineering decisions, RBAC, backend API proposal, import strategy, audit specification, security guidance and test plan.

### Changed
- Requester dashboard status distribution is based on the request list visible to that requester.
- Request detail screen blocks demo navigation to requests outside the requester's ownership or staff assignment.
- Selecting MongoDB mode shows an explicit not-connected message and does not display the local demo request list.

### Known limitations
- This is still a frontend prototype; no backend is included.
- Authentication and role checks are client-side demo behaviour.
- React state is not durable across refreshes.
- Excel/CSV import is preview-only. Google Sheets content is not fetched.
- Duplicate checks are basic in-file comparisons only; there is no database duplicate check or insert.
- Real health checks, outage detection, automatic recovery, persistent notification scheduling, real audit storage, and backend exports are not implemented.
- Dependency installation did not complete in the generation environment, so a production build could not be verified here. Run `npm install` and `npm run build` locally before development handoff.
