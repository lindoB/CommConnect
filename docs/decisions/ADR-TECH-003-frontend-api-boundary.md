# ADR-TECH-003 — Frontend/API Boundary

| Field | Decision |
|---|---|
| **Status** | Proposed M2 baseline — team approval required |
| **Context** | Multiple user groups require a web UI backed by controlled application services. |
| **Alternatives** | Server-rendered UI; SPA + REST API; distributed messaging. |
| **Decision** | Use React communicating with an ASP.NET Core REST API. |
| **Rationale** | Clear UI/application boundary without unnecessary distributed infrastructure for MVP. |
| **Trade-offs** | Adds a separate frontend build and explicit API contract management. |
| **Risk** | Frontend/API version mismatch could increase integration effort. |

Related: [../architecture/technology-stack.md](../architecture/technology-stack.md)