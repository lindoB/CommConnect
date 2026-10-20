# Technology Stack Baseline

> M2 §5 — proposed stack and the criteria used to select it.
> Related: [../decisions/](../decisions/), [deployment-compatibility.md](deployment-compatibility.md)

## 5.1 Proposed stack

| Layer | Proposed choice | Rationale |
|---|---|---|
| Frontend | React | Component-based web UI suitable for requester, staff, manager and administration views. |
| Backend | ASP.NET Core Web API | Structured service/API layer with authentication, authorisation, dependency injection and testability. |
| Runtime | .NET / ASP.NET Core | Runtime for the selected backend. |
| Database | PostgreSQL | Relational integrity, transactions and querying suited to request workflows/reporting. |
| API | RESTful HTTP/JSON | Proportionate frontend/backend boundary at MVP scale. |
| Source control | Git + GitHub | Supports branches, PR review, traceability and controlled main branch. |
| CI | GitHub Actions | Progressive build/test automation. |

## 5.2 Technology selection criteria

| Criterion | Required evidence |
|---|---|
| Requirements fit | Supports authentication, RBAC, workflows, reporting, administration and auditability. |
| ASR/NFR fit | Supports performance, security, reliability and maintainability drivers. |
| Team capability | Reasonable for a three-person team within the fixed schedule. |
| Security | Mature authentication, authorisation, dependency and configuration mechanisms. |
| Maintainability | Clear application/service boundaries and testable components. |
| Deployment compatibility | Works with the team's actual development/deployment environment. |
| Dependency risk | Versions are controlled and security claims verified from authoritative sources. |
| Cost/licensing | Suitable for academic/MVP constraints without unnecessary commercial licensing. |