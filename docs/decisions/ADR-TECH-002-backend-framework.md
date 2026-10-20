# ADR-TECH-002 — Backend Framework

| Field | Decision |
|---|---|
| **Status** | Proposed M2 baseline — team approval required |
| **Context** | CivicConnect needs a maintainable API/service layer with auth, RBAC, validation and persistence. |
| **Alternatives** | ASP.NET Core; Spring Boot; Node.js. |
| **Decision** | Use ASP.NET Core Web API as the backend baseline. |
| **Rationale** | Structured service layer, dependency injection and authentication/authorisation support. |
| **Trade-offs** | Requires correct .NET/runtime/package version management. |
| **Risk** | Version mismatch or learning curve may affect schedule. |

Related: [../architecture/technology-stack.md](../architecture/technology-stack.md)