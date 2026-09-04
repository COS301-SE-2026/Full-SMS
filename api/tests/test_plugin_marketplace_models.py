import pytest
from pydantic import ValidationError
from api.models.plugin_marketplace_models import (
    ApprovePluginRequest,
    RejectPluginRequest,
)


class TestApprovePluginRequest:
    def test_approve_plugin_with_feedback(self):
        request = ApprovePluginRequest(
            feedback="This is a very good plugin Pprof Kruger keep it up"
        )
        assert request.feedback == "This is a very good plugin Pprof Kruger keep it up"

    def test_approve_plugin_without_feedback(self):
        request = ApprovePluginRequest()
        assert request.feedback is None

    def test_approve_plugin_with_short_feedback(self):
        with pytest.raises(ValidationError) as exc_info:
            ApprovePluginRequest(feedback="hiii")

        errors = exc_info.value.errors()
        assert any("at least 10 characters" in str(error) for error in errors)


class TestRejectPluginRequest:
    def test_reject_plugin_with_valid_feedback(self):
        feedback = "wakanda plugin is this?? Abeg do better woo"
        request = RejectPluginRequest(feedback=feedback)
        assert request.feedback == feedback

    def test_reject_plugin_feedback_required(self):
        with pytest.raises(ValidationError) as exc_info:
            RejectPluginRequest()

        errors = exc_info.value.errors()
        assert any(error["loc"] == ("feedback",) for error in errors)

    def test_reject_plugin_with_short_feedback(self):
        with pytest.raises(ValidationError) as exc_info:
            RejectPluginRequest(feedback="kkk")

        errors = exc_info.value.errors()
        assert any("at least 10 characters" in str(error) for error in errors)
