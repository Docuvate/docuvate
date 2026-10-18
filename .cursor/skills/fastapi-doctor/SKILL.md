---
name: fastapi-doctor
description: Run fastapi-doctor strict profile on apps/worker.
---

```bash
cd apps/worker && uvx --index https://s-smits.github.io/fastapi-doctor/simple/ fastapi-doctor . --profile strict
```

Target doctor_score > 90.
