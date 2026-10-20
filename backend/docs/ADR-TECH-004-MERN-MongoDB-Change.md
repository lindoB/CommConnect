# ADR-TECH-004 — Change from React/ASP.NET Core/PostgreSQL to MERN/MongoDB Atlas

- **Status:** Proposed implementation; team approval and PED baseline update required
- **Date:** 2026-10-16
- **Decision owner:** CivicConnect team
- **Related baseline:** PED v2.0, Technology Stack Selection; master brief Sections 13, 14, 18.1

## Context

The Milestone 2 PED v2.0 records React, ASP.NET Core Web API, .NET 8 and PostgreSQL as the approved baseline. The team has since selected the MERN stack and MongoDB Atlas. This is a material change, not a silent implementation detail. It affects the technology baseline, data model, persistence strategy, transaction/concurrency design, API implementation, deployment configuration, testing, cost assumptions and the RTM.

## Decision under consideration

Use React + Vite for the client, Node.js + Express for the REST API, MongoDB Atlas + Mongoose for persistence, GitHub for source control and GitHub Actions for CI. Keep a modular monolith and REST/JSON boundary rather than introducing microservices.

## Alternatives

1. **Retain the M2 baseline:** React + ASP.NET Core + PostgreSQL. Best preserves the approved PED and relational/transaction model, but conflicts with the team's new implementation direction.
2. **MERN + MongoDB Atlas:** one JavaScript/JSON-oriented application stack and a flexible document model; likely reduces language/context switching for this team. Trade-offs include reworking the approved data model, weaker natural relational constraints, and the need to deliberately design cross-document consistency and reporting.
3. **Split or microservices architecture:** rejected for the MVP because deployment, observability and integration overhead are disproportionate to the three-person team's scope and schedule.

## Consequences and controls

- Update PED v2.0 through formal change control; do not overwrite the original decision silently.
- Reconcile the persistence ADR, entity relationships, transaction/concurrency strategy, deployment and migration sections.
- MongoDB Atlas is a replica-set deployment; status and audit writes use a transaction. Verify the chosen Atlas tier/environment supports transactions.
- Maintain a version field and conditional updates to reduce lost updates.
- Keep server-side RBAC and ownership/department query scoping. Public registration must never select an elevated role.
- Add tests for role boundaries, request ownership, status transitions, stale writes, duplicate accounts and audit behaviour.
- Record MongoDB Atlas tier limits, backup/restore strategy, region, network access, and operational cost.
- Update RTM links to API endpoints, issues/PRs, tests and release evidence.
- This record is a template for team review; it is not evidence of lecturer approval. Obtain required approval before treating the new stack as the formally approved baseline.

## Risks

| ID | Risk | Mitigation |
|---|---|---|
| R-TECH-004 | Stack change invalidates parts of PED v2.0 and may reduce traceability | Change request, updated ADRs, RTM and peer review |
| R-DATA-004 | Document model can permit inconsistent cross-document state | Mongoose validation, indexes, transactions for coupled writes, integration tests |
| R-SEC-004 | Real authentication may be mistaken for complete production security | Document residual gaps; test RBAC, expiry, revocation and rate limits |
| R-OPS-004 | Atlas/network/credential misconfiguration prevents demos or leaks secrets | Environment variables, least-privilege DB user, IP allow-list, health check, recovery plan |
| R-SCOPE-004 | Frontend screens remain disconnected from real API data | Create integration issues per screen and do not claim end-to-end completion until verified |
