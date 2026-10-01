# Inputs from M1 and A2

> M2 §2 — traceability from prior milestones into the Person 2 data/persistence baseline.

## 2.1 Requirements driving Person 2 decisions

| M1 area | Data/persistence implication |
|---|---|
| FR001–FR002: registration/login | Persistent user identity, account state and role information. |
| FR003–FR005: submit/category/unique number | ServiceRequest, Category, unique RequestNumber and timestamps. |
| FR006–FR008: requester visibility/status/history | Requester ownership, current Status and chronological history. |
| FR009–FR013: assignment/status/priority/comments | Assignments, status transitions, priority, comments/resolution and responsible actor. |
| FR014/FR023: audit trail/logs | Protected audit records containing actor, action and timestamp. |
| FR015–FR018: reports/statistics/overdue | Queryable status, category, assignment and time data. |
| FR019–FR022: administration | Users, roles/permissions, categories and settings with controlled access. |

## 2.2 Quality drivers

| Driver | Project consequence |
|---|---|
| Security | Authentication/authorisation, protected request data and database integrity. |
| Performance | Indexes for requester, status, category, assignment and timestamps. |
| Reliability | Transactional multi-record updates and defined recovery approach. |
| Availability | Avoid unnecessary distributed infrastructure at MVP scale; plan DB recovery. |
| Maintainability | Clear service/persistence boundary and relational domain model. |
| Scalability | Normalised relational foundation with room for indexing/query optimisation. |

## 2.3 A2 research translated into project decisions

Assignment 2 recommends service-level transaction coordination with database integrity constraints. For a request-status update, authentication/authorisation and business validation occur before the request and its audit information are persisted as one logical transaction; failures roll back. A2 also identifies optimistic concurrency as a consideration because multiple staff may update one request. These findings are applied here to CivicConnect rather than copied as research prose.