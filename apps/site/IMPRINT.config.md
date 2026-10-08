# Impressum / legal publish config

**Single source of truth:** [`legal.config.json`](./legal.config.json)

Thomas Faust’s Impressum (§ 5 DDG / § 18 Abs. 2 MStV) lives in `imprint.*`. Do not add company name, USt-IdNr., phone, or register fields unless they become true.

Required for `PUBLISH=1` (`scripts/check-legal-for-publish.mjs`):

- `providerName`, `street`, `postalCode`, `city`, `country`, `email`

Publish (after DNS + filled config):

```bash
INCLUDE_CNAME=1 PUBLISH=1 scripts/landing/publish-pages.sh
```

Dry-run staging with CNAME (no push):

```bash
INCLUDE_CNAME=1 PUBLISH=0 scripts/landing/publish-pages.sh
```
