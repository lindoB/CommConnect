# Person 2 RTM Contribution

> M2 §9 — how Person 2's data/persistence and technology decisions trace to requirements.

| Requirement | Data/persistence decision | Technology/ADR | Implementation evidence | Verification evidence |
|---|---|---|---|---|
| FR003–FR005 | ServiceRequest + Category + unique RequestNumber | ADR-TECH-001 | Link to actual entity/migration | Storage/submission test |
| FR006–FR008 | Requester ownership + Status + StatusHistory | ADR-TECH-001 | Link to repository | Visibility/history test |
| FR009–FR013 | Assignment, priority, status, comments | ADR-TECH-001 | Link to repository | Workflow tests |
| FR014/FR023 | Protected AuditLog with actor/action/timestamp | ADR-TECH-001/002 | Link to repository | Audit integrity/access test |
| FR015–FR018 | Queryable request/status/category/assignment/time data | ADR-TECH-001 | Link to reporting implementation | Report/filter tests |
| FR019–FR022 | Users, roles, permissions, categories, settings | ADR-TECH-001/002 | Link to repository | Authorisation/config tests |
| NFR001 | Indexes and controlled API/database access | ADR-TECH-001/002/003 | Implementation evidence | Performance verification later |
| NFR002–NFR005 | Application authorisation + DB integrity + protected audit | ADR-TECH-001/002 | Implementation evidence | Security/integrity tests |
| NFR009–NFR010 | Persistent state + responsible user/timestamp | ADR-TECH-001 | Persistence evidence | Persistence/audit verification |
| NFR014 | Backup/recovery planned before release | ADR-TECH-001 | Operational evidence later | Restore/recovery verification |
