---
name: nestjs-doctor
description: Run nestjs-doctor on apps/api and iterate until score > 90.
---

Run from repo root:

```bash
pnpm dlx nestjs-doctor@latest apps/api
```

Fix findings in `apps/api` until score exceeds 90. Do not add CI score gates.
