from fastapi.testclient import TestClient
import pytest

import src.app as appmod

client = TestClient(appmod.app)


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    # Expect at least one known activity
    assert "Chess Club" in data


def test_signup_and_duplicate_signup_and_unregister():
    activity = "Chess Club"
    email = "pytest_user@example.com"

    # Ensure not already present by trying to unregister first (ignore 404)
    client.delete(f"/activities/{activity}/unregister?email={email}")

    # Sign up
    resp = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp.status_code == 200
    assert "Signed up" in resp.json().get("message", "")

    # Duplicate signup should fail with 400
    dup = client.post(f"/activities/{activity}/signup?email={email}")
    assert dup.status_code == 400

    # Unregister should succeed
    u = client.delete(f"/activities/{activity}/unregister?email={email}")
    assert u.status_code == 200
    assert "Unregistered" in u.json().get("message", "")

    # Unregister again should 404
    u2 = client.delete(f"/activities/{activity}/unregister?email={email}")
    assert u2.status_code == 404


def test_signup_nonexistent_activity():
    resp = client.post("/activities/NoSuchActivity/signup?email=foo@example.com")
    assert resp.status_code == 404


def test_unregister_nonexistent_activity():
    resp = client.delete("/activities/NoSuchActivity/unregister?email=foo@example.com")
    assert resp.status_code == 404
