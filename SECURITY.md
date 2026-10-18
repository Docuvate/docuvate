# Security policy

## Supported versions

Security fixes are provided for the latest release on the `main` branch and the most recent tagged release. Older tags are not supported unless noted in a release announcement.

| Version       | Supported |
| ------------- | --------- |
| latest `main` | yes       |
| latest tag    | yes       |
| older tags    | no        |

## Reporting a vulnerability

Please report security issues **privately** so we can investigate before public disclosure.

- Preferred: [GitHub private security advisory](https://github.com/Docuvate/docuvate/security/advisories/new) for this repository
- Include: affected component, steps to reproduce, impact, and any proof-of-concept you can share safely.

Please do **not** open public GitHub issues for undisclosed vulnerabilities.

## Response expectations

| Stage                          | Target                                               |
| ------------------------------ | ---------------------------------------------------- |
| Initial acknowledgement        | 3 business days                                      |
| Triage and severity assessment | 10 business days                                     |
| Fix or mitigation plan         | depends on severity; critical issues are prioritized |

We may ask for additional information and will coordinate disclosure timing with you when possible.

## Secure deployment notes

- Run Docuvate behind HTTPS in production and restrict access to the worker and object storage.
- Keep secrets in environment variables only (see `.env.example`).
- See [docs/threat-model.md](docs/threat-model.md) for current threat-model notes.
