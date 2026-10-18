# Documentation

## Using and operating Docuvate

| Guide                                                                                                | Topic                                                   |
| ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| [Self-hosting (Docker Compose)](self-hosting.md)                                                     | Install, configure, upgrade and back up a Compose stack |
| [Kubernetes](deploy/kubernetes.md)                                                                   | Kustomize and Helm deployment                           |
| [User administration](user-administration.md) ([Deutsch](user-administration.de.md))                 | Roles, invitations, suspensions                         |
| [Password reset](password-reset.md) ([Deutsch](password-reset.de.md))                                | Self-service and admin reset                            |
| [Connectors](connectors.md)                                                                          | Mail, DMS, storage and home automation integrations     |
| [SFTP scanner ingest](connectors/sftp.md)                                                            | Built-in SFTP inbox and SFTP pull                       |
| [Gmail and Outlook OAuth setup](connectors-oauth-setup.md) ([Deutsch](connectors-oauth-setup.de.md)) | OAuth client credentials for mail connectors            |
| [AI models](ai-models.md)                                                                            | Shipped models, ports and hardware requirements         |
| [ML feature flags](ml-feature-flags.md) ([Deutsch](ml-feature-flags.de.md))                          | Optional machine-learning features per tenant           |
| [SDKs](sdks.md)                                                                                      | Node and Flutter clients for the `/v1` API              |
| [Threat model](threat-model.md)                                                                      | Security notes for operators                            |

## Contributing and internals

| Guide                                                                   | Topic                                       |
| ----------------------------------------------------------------------- | ------------------------------------------- |
| [Architecture](architecture.md)                                         | Clean Architecture layout of API and worker |
| [Architecture decision records](adr/)                                   | Why things are built the way they are       |
| [Document processing pipeline](document-processing-pipeline.md)         | Post-OCR processing steps                   |
| [ML pipeline](ml-pipeline.md)                                           | Document understanding flow and evaluation  |
| [Connector ports](connectors-ports-and-home-assistant.md)               | Source and sink roles, category ports       |
| [Database migrations](development/migrations.md)                        | Writing and running TypeORM migrations      |
| [Design system](design-system.md) and [design tokens](design-tokens.md) | UI conventions and token pipeline           |
| [Local CI](local-ci.md)                                                 | Running the CI jobs locally                 |
| [Test strategy](testing/strategy.md)                                    | Test pyramid and quality gates              |
| [Compose smoke profile](smoke-profile.md)                               | Smoke test stack used in CI                 |
| [UX metrics harness](ux-metrics.md)                                     | Playwright layout and interaction metrics   |
| [README assets](readme-assets.md)                                       | Logo and README preview tooling             |
| [Landing site publishing](landing-github-pages.md)                      | Building and publishing docuvate.de         |
