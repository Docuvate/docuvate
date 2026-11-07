# Docuvate library/admin audit pack

Self-contained Playwright audit for the library and admin use cases. Copy this directory to a dedicated folder such as `/tmp/docuvate-library-admin-audit`. It does not need a Docuvate checkout, and it does not change the global npm profile.

The tests call a Docuvate web app you already run. They sign in only through the login form, using `DOCUVATE_AUDIT_EMAIL` and `DOCUVATE_AUDIT_PASSWORD`. They do not read browser profiles, cookie jars, or secret files.

## What each project does

| Project                   | When it runs                                          | What it changes                                                                                                                                                                                                             |
| ------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `public-readonly`         | Target responds at `DOCUVATE_WEB_BASE_URL`            | Nothing. Opens login, register, and forgot-password, and checks that signed-out app routes return to login. Forgot-password is not submitted.                                                                               |
| `authenticated-readonly`  | Target responds and both credential variables are set | Nothing. Signs in and opens dashboard, library, saved views, labels, fields, folders, duplicates, settings, and connectors. It does not click import, connection test, dry-run, export, delete, or reprocess.               |
| `authenticated-synthetic` | Also `DOCUVATE_AUDIT_SYNTHETIC_WRITES=1`              | Creates one label whose name starts with `lib-audit-` on that account, then deletes it only when a single delete control sits in that label's row. Upload of one new PDF also requires `DOCUVATE_AUDIT_SYNTHETIC_UPLOAD=1`. |

If the web app is down, or credentials are missing, the affected tests are **blocked**. They are not passed with mocks.

## Setup

Use a dedicated directory. If you already have only this folder, run the commands inside it and skip the `cp`. Example on a Mac where `node` and `npm` are already installed:

```bash
mkdir -p /tmp/docuvate-library-admin-audit
cp -R tools/library-admin-audit/. /tmp/docuvate-library-admin-audit/
cd /tmp/docuvate-library-admin-audit
npm ci
export PLAYWRIGHT_BROWSERS_PATH="$PWD/.playwright-browsers"
npx playwright install chromium
```

`PLAYWRIGHT_BROWSERS_PATH` keeps the browser download inside this directory.

Run against the local web app (default `http://127.0.0.1:5173`):

```bash
export DOCUVATE_WEB_BASE_URL="http://127.0.0.1:5173"
npm test
```

Signed-in coverage:

```bash
export DOCUVATE_AUDIT_EMAIL="audit@example.com"
export DOCUVATE_AUDIT_PASSWORD="the-account-password"
npm run test:readonly
```

Create the account yourself in the Docuvate register screen first. This pack does not register, does not send mail, and does not call connector import or connection-test actions.

Optional label write, still on that same account:

```bash
export DOCUVATE_AUDIT_SYNTHETIC_WRITES=1
npm run test:synthetic
```

Optional one-file upload (starts extraction for that new file only):

```bash
export DOCUVATE_AUDIT_SYNTHETIC_UPLOAD=1
npm run test:synthetic
```

Results are written to `results/library-admin-audit-results.json`. `blocked` means setup was missing. `failed` means the target responded and an assertion did not hold.

The inventory of use cases, including cloud unit evidence and items that still need this Mac run, is `matrix/library-admin-use-cases.json`.

## Cloud note

A cloud agent cannot open the Mac at `localhost:5173` or `10.0.0.31`. A run from that environment is an environment block. It is not a product failure and it is not a completed local audit. The runtime deploy SHA was not read.
