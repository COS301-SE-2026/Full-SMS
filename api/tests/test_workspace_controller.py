import pytest
from fastapi import HTTPException
from unittest.mock import patch
from controllers.workspace_controller import (get_workspace_members_controller, add_workspace_member_controller)

class TestAddWorkspaceMemberController:
    def test_add_member_success(self):
        with patch("controllers.workspace_controller.get_user_by_email") as mock_get_user, \
            patch("controllers.workspace_controller.add_workspace_member") as mock_add_member,\
            patch("controllers.workspace_controller.get_user_profile") as mock_get_profile, \
            patch("controllers.workspace_controller.add_notification") as mock_add_notification:
            mock_get_user.return_value = {"id": "user-uuid-1"}
            mock_add_member.return_value = {"id":"workspace1", "member_ids": ["user-uuid-1"], "already_member": False, "name": "Test Workspace"}
            mock_get_profile.return_value = {"username": "Owner", "email": "owner@example.com"}

            from controllers.workspace_controller import add_workspace_member_controller

            result = add_workspace_member_controller("workspace1", "owner-id-1", "user@example.com")

            assert result["success"] is True
            assert result["workspace"]["member_ids"] == ["user-uuid-1"]
            mock_add_notification.assert_called_once()

    def test_add_member_not_found(self):
        with patch("controllers.workspace_controller.get_user_by_email") as mock_get_user:
            mock_get_user.side_effect = ValueError("User not found")

            from controllers.workspace_controller import add_workspace_member_controller

            with pytest.raises(HTTPException) as mock_exception:
                add_workspace_member_controller("workspace1", "owner-id-1", "invalid@example.com")

            assert mock_exception.value.status_code == 404

    def test_add_member_server_error(self):
        with patch("controllers.workspace_controller.get_user_by_email") as mock_get_user:
            mock_get_user.side_effect = RuntimeError("")

            from controllers.workspace_controller import add_workspace_member_controller

            with pytest.raises(HTTPException) as mock_exception:
                add_workspace_member_controller("workspace1", "user-uuid-1","user@example.com")

            assert mock_exception.value.status_code == 500


class TestGetWorkspaceMemberController:
    def test_get_members_success(self):
        with patch("controllers.workspace_controller.get_workspace_members") as mock_get_members:
            mock_get_members.return_value = [{"id": "member1"}, {"id": "member2"}]

            from controllers.workspace_controller import get_workspace_members_controller

            result = get_workspace_members_controller("workspace-1", "user-id-1")

            assert result["success"] is True
            assert result["members"] == [{"id":"member1"},{"id":"member2"}]

    def test_get_members_not_found(self):
        with patch("controllers.workspace_controller.get_workspace_members") as mock_get_members:
            mock_get_members.side_effect = ValueError("Workspace not found")

            from controllers.workspace_controller import get_workspace_members_controller

            with pytest.raises(HTTPException) as mock_exception:
                get_workspace_members_controller("workspace1", "user-id-1")

            assert mock_exception.value.status_code == 404

    def test_get_members_server_error(self):
        with patch("controllers.workspace_controller.get_workspace_members") as mock_get_members:
                mock_get_members.side_effect = RuntimeError("")
        
                from controllers.workspace_controller import get_workspace_members_controller
        
                with pytest.raises(HTTPException) as mock_exception:
                    get_workspace_members_controller("workspace1", "user-id-1")
    
                assert mock_exception.value.status_code == 500
        