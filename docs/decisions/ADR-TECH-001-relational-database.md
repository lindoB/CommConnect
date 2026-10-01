# ADR-TECH-001 — Relational Database

| Field | Decision |
|---|---|
| **Status** | Proposed M2 baseline — team approval required |
| **Context** | Strong relationships, reporting, auditability and transactional request updates. |
| **Alternatives** | Relational SQL; document-oriented NoSQL. |
| **Decision** | Use PostgreSQL as the relational persistence baseline. |
| **Rationale** | Referential integrity, ACID transactions and structured queries fit the M1 requirements. |
| **Trade-offs** | Requires schema management and relational modelling. |
| **Risk** | Database availability and recovery become operational dependencies. |

Related: [../architecture/data-persistence-baseline.md](../architecture/data-persistence-baseline.md), [../architecture/persistence-decisions.md](../architecture/persistence-decisions.md)