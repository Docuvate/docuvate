#!/usr/bin/env python3
"""Bidirectional Kustomize vs Helm parity (homelab, cloud, dev) with semantic compare + allowlist."""
from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path
from typing import Any

import yaml

ROOT = Path(__file__).resolve().parents[2]
ALLOWLIST_PATH = ROOT / "deploy/scripts/parity-allowlist.yaml"

JOB_PREFIXES = (
    "docuvate-db-migrate-",
    "docuvate-minio-init-",
    "docuvate-ollama-init-",
)

SKIP_KINDS = frozenset({"Namespace", "Secret"})


def load_docs(path: Path) -> list[dict[str, Any]]:
    docs: list[dict[str, Any]] = []
    with path.open() as f:
        for doc in yaml.safe_load_all(f):
            if doc and doc.get("kind") and doc.get("metadata", {}).get("name"):
                docs.append(doc)
    return docs


def rid(doc: dict[str, Any]) -> str:
    name = doc["metadata"]["name"]
    for prefix in JOB_PREFIXES:
        if name.startswith(prefix):
            name = prefix.rstrip("-")
            break
    return f"{doc['kind']}/{name}"


def load_allowlist() -> set[tuple[str, str]]:
    if not ALLOWLIST_PATH.is_file():
        return set()
    data = yaml.safe_load(ALLOWLIST_PATH.read_text(encoding="utf-8")) or {}
    out: set[tuple[str, str]] = set()
    for entry in data.get("entries") or []:
        for profile in entry.get("profiles") or []:
            out.add((profile, entry["resource"]))
    return out


def norm_image(img: str | None) -> str:
    if not img:
        return ""
    base = img.split("/")[-1]
    base = re.sub(r"^(docuvate-(api|web|worker)):", r"ghcr.io/docuvate/\1:", base)
    digest = ""
    if "@" in base:
        base, digest = base.split("@", 1)
    if ":" in base:
        name, tag = base.rsplit(":", 1)
        if re.match(r"^\d+\.\d+\.\d+$", tag):
            tag = f"v{tag}"
        base = f"{name}:{tag}"
    if digest:
        base = f"{base}@{digest}"
    return base


def norm_env(env_list: list[dict[str, Any]] | None) -> list[Any]:
    rows: list[Any] = []
    for e in env_list or []:
        name = e.get("name")
        if not name:
            continue
        if "value" in e:
            rows.append((name, "value", e.get("value")))
        elif e.get("valueFrom"):
            rows.append((name, "valueFrom", json.dumps(e["valueFrom"], sort_keys=True)))
    return sorted(rows)


def norm_probes(c: dict[str, Any]) -> dict[str, Any]:
    out: dict[str, Any] = {}
    for key in ("startupProbe", "readinessProbe", "livenessProbe"):
        if key not in c:
            continue
        p = c[key]
        if "httpGet" in p:
            out[key] = {
                "httpGet": p["httpGet"],
                "periodSeconds": p.get("periodSeconds"),
                "timeoutSeconds": p.get("timeoutSeconds"),
                "failureThreshold": p.get("failureThreshold"),
                "initialDelaySeconds": p.get("initialDelaySeconds"),
            }
        elif "exec" in p:
            out[key] = {"exec": p["exec"], "periodSeconds": p.get("periodSeconds")}
    return out


def norm_command(cmd: list[Any] | None) -> str:
    if not cmd:
        return ""
    text = " ".join(str(x) for x in cmd).strip()
    text = re.sub(r"\s+", " ", text)
    text = text.replace('"${OLLAMA_MODEL}"', '"$OLLAMA_MODEL"')
    return text


def norm_container(c: dict[str, Any]) -> dict[str, Any]:
    return {
        "name": c.get("name"),
        "image": norm_image(c.get("image")),
        "env": norm_env(c.get("env")),
        "envFrom": sorted(
            json.dumps(x, sort_keys=True) for x in (c.get("envFrom") or [])
        ),
        "resources": json.dumps(c.get("resources") or {}, sort_keys=True),
        "securityContext": json.dumps(c.get("securityContext") or {}, sort_keys=True),
        "probes": norm_probes(c),
        "command": norm_command(c.get("command")),
    }


def norm_pod_template(tpl: dict[str, Any]) -> dict[str, Any]:
    spec = tpl.get("spec") or {}
    pod_sc = spec.get("securityContext") or {}
    return {
        "podSecurityContext": {
            k: pod_sc.get(k)
            for k in (
                "runAsNonRoot",
                "runAsUser",
                "runAsGroup",
                "fsGroup",
                "seccompProfile",
            )
            if k in pod_sc
        },
        "containers": sorted(
            (norm_container(c) for c in (spec.get("containers") or [])),
            key=lambda x: x["name"] or "",
        ),
        "initContainers": sorted(
            (norm_container(c) for c in (spec.get("initContainers") or [])),
            key=lambda x: x["name"] or "",
        ),
    }


def norm_service(spec: dict[str, Any] | None) -> dict[str, Any]:
    spec = spec or {}
    stype = spec.get("type") or "ClusterIP"
    ports = spec.get("ports") or []
    norm_ports = sorted(
        (
            {
                "name": p.get("name"),
                "port": p.get("port"),
                "targetPort": p.get("targetPort"),
                "protocol": p.get("protocol", "TCP"),
            }
            for p in ports
        ),
        key=lambda x: (x.get("name"), x.get("port")),
    )
    out: dict[str, Any] = {"type": stype, "ports": norm_ports}
    if spec.get("clusterIP") == "None":
        out["clusterIP"] = "None"
    return out


def norm_netpol(spec: dict[str, Any] | None) -> str:
    return json.dumps(spec or {}, sort_keys=True)


def norm_pdb(spec: dict[str, Any] | None) -> str:
    spec = spec or {}
    return json.dumps(
        {
            "maxUnavailable": spec.get("maxUnavailable"),
            "minAvailable": spec.get("minAvailable"),
            "selector": spec.get("selector"),
        },
        sort_keys=True,
    )


def workload_semantic(doc: dict[str, Any]) -> dict[str, Any]:
    kind = doc["kind"]
    if kind == "Job":
        tpl = doc.get("spec", {}).get("template", {})
    else:
        tpl = doc.get("spec", {}).get("template", {})
    return norm_pod_template(tpl)


def compare_profiles(
    k_path: Path,
    h_path: Path,
    profile: str,
    allowlist: set[tuple[str, str]],
    report: list[str],
    allowed_notes: list[str],
) -> bool:
    k_docs = {rid(d): d for d in load_docs(k_path) if d["kind"] not in SKIP_KINDS}
    h_docs = {rid(d): d for d in load_docs(h_path) if d["kind"] not in SKIP_KINDS}
    ok = True
    for side, keys in (("Kustomize", sorted(set(k_docs) - set(h_docs))), ("Helm", sorted(set(h_docs) - set(k_docs)))):
        for key in keys:
            if (profile, key) in allowlist:
                allowed_notes.append(f"[{profile}] allowlist: only in {side}: {key}")
                continue
            ok = False
            report.append(f"[{profile}] only in {side}: {key}")

    for key in sorted(set(k_docs) & set(h_docs)):
        if (profile, key) in allowlist:
            allowed_notes.append(f"[{profile}] allowlist: {key}")
            continue
        kd, hd = k_docs[key], h_docs[key]
        kind = kd["kind"]
        if kind in ("Deployment", "StatefulSet", "Job"):
            if workload_semantic(kd) != workload_semantic(hd):
                ok = False
                report.append(f"[{profile}] {key} semantic pod template mismatch")
        elif kind == "Service":
            if norm_service(kd.get("spec")) != norm_service(hd.get("spec")):
                ok = False
                report.append(f"[{profile}] {key} service spec mismatch")
        elif kind == "NetworkPolicy":
            if norm_netpol(kd.get("spec")) != norm_netpol(hd.get("spec")):
                ok = False
                report.append(f"[{profile}] {key} networkpolicy mismatch")
        elif kind == "PodDisruptionBudget":
            if norm_pdb(kd.get("spec")) != norm_pdb(hd.get("spec")):
                ok = False
                report.append(f"[{profile}] {key} pdb mismatch")
    return ok


def main() -> int:
    tmp = Path("/tmp/docuvate-parity")
    tmp.mkdir(exist_ok=True)
    allowlist = load_allowlist()
    report: list[str] = []
    allowed_notes: list[str] = []
    profiles = [
        ("homelab", "deploy/kustomize/overlays/homelab", "values-homelab.yaml"),
        ("cloud", "deploy/kustomize/overlays/cloud", "values-cloud.yaml"),
        ("dev", "deploy/kustomize/overlays/dev", "values-dev.yaml"),
    ]
    chart = ROOT / "deploy/helm/docuvate"
    all_ok = True
    for name, k_overlay, values in profiles:
        k_out = tmp / f"k-{name}.yaml"
        h_out = tmp / f"h-{name}.yaml"
        subprocess.run(["kustomize", "build", str(ROOT / k_overlay)], check=True, stdout=k_out.open("w"))
        subprocess.run(
            ["helm", "template", "docuvate", str(chart), "-f", str(chart / values), "-n", "docuvate"],
            check=True,
            stdout=h_out.open("w"),
        )
        if not compare_profiles(k_out, h_out, name, allowlist, report, allowed_notes):
            all_ok = False

    out = ROOT / "deploy/artifacts/parity-report.txt"
    out.parent.mkdir(parents=True, exist_ok=True)
    lines = ["Docuvate Kustomize vs Helm parity report (semantic + allowlist)", ""]
    if allowed_notes:
        lines.append("Allowlisted (documented):")
        lines.extend(allowed_notes)
        lines.append("")
    if report:
        lines.append("Unexpected diffs:")
        lines.extend(report)
    else:
        lines.append("No unexpected diffs for homelab/cloud/dev.")
    text = "\n".join(lines) + "\n"
    out.write_text(text, encoding="utf-8")
    print(text)
    return 0 if all_ok else 1


if __name__ == "__main__":
    sys.exit(main())
