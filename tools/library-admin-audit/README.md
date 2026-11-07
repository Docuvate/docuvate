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

Use a dedicated directory. Do not change the global npm profile. From the standalone archive:

```bash
mkdir -p /tmp/docuvate-library-admin-audit
tar -xzf docuvate-library-admin-audit.tgz -C /tmp/docuvate-library-admin-audit
cd /tmp/docuvate-library-admin-audit/library-admin-audit
export PLAYWRIGHT_BROWSERS_PATH="$PWD/.playwright-browsers"
npm ci
npx playwright install chromium
```

`npm ci` installs only `@playwright/test` 1.64.0, `playwright` 1.64.0, and `playwright-core` 1.64.0 from `registry.npmjs.org`. The lockfile records no install scripts. `PLAYWRIGHT_BROWSERS_PATH` keeps the Chromium download inside this directory. `npx playwright install chromium` is the browser download. It is not an audit telemetry report.

## Public read-only smoke

This is the first local command. It does not read `DOCUVATE_AUDIT_EMAIL` or `DOCUVATE_AUDIT_PASSWORD`. Leave those unset. It opens `/login`, `/register`, and `/forgot-password` with GET navigation and checks that signed-out app routes return to login. It does not submit forms, does not click buttons, and does not send import, export, upload, or connector requests.

```bash
export DOCUVATE_WEB_BASE_URL="http://127.0.0.1:5173"
unset DOCUVATE_AUDIT_EMAIL DOCUVATE_AUDIT_PASSWORD
unset DOCUVATE_AUDIT_SYNTHETIC_WRITES DOCUVATE_AUDIT_SYNTHETIC_UPLOAD
npm run test:public
```

`DOCUVATE_WEB_BASE_URL` is copied into the JSON as `baseURL`. Use an origin with no username or password in the URL.

If `http://127.0.0.1:5173` does not respond, every public test is `blocked`. That is an environment block, not a product pass.

Evidence is `results/library-admin-audit-results.json`. Each row is `title`, `project`, `status`, and `durationMs`. The file does not contain screenshots, traces, document names, emails, or passwords. Screenshots, traces, and video are off for every project in this pack. Copy that JSON back. Do not copy `test-results/` or page output.

## Signed-in steps, after the public JSON exists

Create the account yourself on the register screen. Put the email and password only in the shell environment for that terminal. Do not paste them into chat, tickets, or the JSON you send back. If either variable is missing, signed-in tests stay `BLOCKED`. This pack does not scrape sessions, cookies, or secret files.

```bash
export DOCUVATE_AUDIT_EMAIL="audit@example.com"
export DOCUVATE_AUDIT_PASSWORD="the-account-password"
npm run test:readonly
```

`test:readonly` signs in through the login form and opens dashboard, library, saved views, labels, fields, folders, duplicates, settings, and connectors. It does not submit search, change sort, or click import, connection test, dry-run, export, delete, or reprocess.

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

`blocked` means setup was missing. `failed` means the target responded and an assertion did not hold.

The inventory of use cases, including cloud unit evidence and items that still need this Mac run, is `matrix/library-admin-use-cases.json`.

## Cloud note

A cloud agent cannot open the Mac at `localhost:5173` or `10.0.0.31`. A run from that environment is an environment block. It is not a product failure and it is not a completed local audit. The runtime deploy SHA was not read.
