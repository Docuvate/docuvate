from docuvate_worker.application.retrain import run_retrain_stub


def test_retrain_stub_improves_field_metric() -> None:
    result = run_retrain_stub(job_id="job-12345678", family_id="heuristic-fields", correction_count=250)
    assert result.version_tag.startswith("stub-")
    assert "field_f1" in result.metrics
    assert result.metrics["field_f1"] >= 0.66
    assert result.row_count == 250


def test_resolve_active_model_defaults() -> None:
    from docuvate_worker.infrastructure.ml.registry import resolve_active_model

    resolved = resolve_active_model("fastembed-minilm")
    assert resolved.family_id == "fastembed-minilm"
    assert resolved.version_tag
    assert resolved.source == "env"
