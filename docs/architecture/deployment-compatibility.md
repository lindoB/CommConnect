# Deployment Compatibility

> M2 §6 — environment, configuration and rollout considerations.
> Related: [technology-stack.md](technology-stack.md), [../quality/technology-risks.md](../quality/technology-risks.md)

| Area | Baseline consideration |
|---|---|
| Environment separation | Development/test/production-like environments should use compatible runtime and DB versions. |
| Configuration | Connection strings and secrets supplied through environment configuration, never committed. |
| Database | Deployment must provide reachable PostgreSQL, controlled credentials, migrations and backup capability. |
| Networking | Frontend → API → database connectivity with only required exposure. |
| Secrets | No passwords, API keys, signing keys or connection secrets in Git. |
| Migrations | Schema changes versioned and applied in a controlled manner. |
| Dependencies | Framework, runtime, database provider and packages must be version-compatible. |
| Rollback | Application/schema release recovery must be planned to limit data loss. |