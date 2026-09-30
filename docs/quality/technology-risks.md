# Technology Risks and Forward Engineering

> M2 §8 — risks, current treatment and required future evidence.
> Related: [../architecture/deployment-compatibility.md](../architecture/deployment-compatibility.md)

| Item | M2 treatment | Future evidence |
|---|---|---|
| RISK003 — technology learning curve | Limit unnecessary technology diversity; document versions/responsibilities. | Working bootstrap and dependency list. |
| RISK005 — deployment incompatibility | Check runtime/database compatibility before deployment. | Deployment test and environment evidence. |
| RISK007 — data loss/recovery | Define backup/recovery before release. | Restore test and operational procedure. |
| FE005 — performance/scalability | Index common paths and retain a simple optimisable architecture. | Later load/performance verification. |
| FE006 — maintainability | Use documented service/persistence decisions. | ADR, code structure and dependency evidence. |
| FE007 — observability | Record operational requirements without claiming production monitoring already exists. | Later logging/monitoring/deployment evidence. |