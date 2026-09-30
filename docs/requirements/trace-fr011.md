# End-to-End Trace — FR011 (staff update request status)

> M2 §10 — one complete requirement trace from requirement to verification.

| Layer | Detail |
|---|---|
| **Requirement** | FR011: authorised staff can update request status. |
| **ASR / constraint** | Security, integrity, reliability and auditability; change must persist and identify the responsible user. |
| **Architecture responsibility** | Backend service validates authorisation/workflow; persistence performs the transaction. |
| **Data decision** | ServiceRequest stores current status; RequestStatusHistory/AuditLog stores transition and actor. |
| **Persistence decision** | Request update and audit/history write occur in one logical transaction; rollback on failure. |
| **Technology decision** | ASP.NET Core Web API + PostgreSQL baseline, subject to repository/team confirmation. |
| **Application artefact** | Link to actual controller/service/entity/migration once confirmed. |
| **Verification** | Test authorised update, persistence and corresponding audit/history evidence. |

Related: [../architecture/persistence-decisions.md](../architecture/persistence-decisions.md), [../decisions/ADR-TECH-001-relational-database.md](../decisions/ADR-TECH-001-relational-database.md)
