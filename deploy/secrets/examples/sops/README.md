# SOPS (age) example

1. Install [age](https://github.com/FiloSottile/age) and [sops](https://github.com/getsops/sops).
2. Generate a key: `age-keygen -o age.key` (store in CI or password manager, never commit).
3. Create `.sops.yaml` in your GitOps repo:

```yaml
creation_rules:
  - path_regex: secrets/.*\.enc\.yaml$
    encrypted_regex: ^(data|stringData)$
    age: age1REPLACE_PUBLIC_KEY
```

4. Encrypt a Secret manifest:

```bash
sops --encrypt --in-place deploy/secrets/examples/sops/docuvate-secrets.enc.yaml.template
```

5. Configure Argo CD / Flux with the SOPS decryption key (KSOPS plugin or Flux SOPS decryption).

Template: `docuvate-secrets.enc.yaml.template` (placeholder data only).
