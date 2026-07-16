from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_search_filters_facilities_and_returns_freshness() -> None:
    response = client.get(
        "/api/v1/facilities",
        params={"service": "fisioterapi", "accepts_bpjs": True},
    )

    assert response.status_code == 200
    assert [item["id"] for item in response.json()["items"]] == ["fcl_bandung_01"]
    assert response.json()["items"][0]["stale"] is False


def test_search_by_radius_and_distance_sort() -> None:
    response = client.get(
        "/api/v1/facilities",
        params={
            "latitude": -6.2,
            "longitude": 106.83,
            "radius_km": 100,
            "sort": "distance",
        },
    )

    assert response.status_code == 200
    assert [item["id"] for item in response.json()["items"]] == ["fcl_jakarta_01"]
    assert response.json()["items"][0]["distance_km"] < 5


def test_search_rejects_radius_over_100_km() -> None:
    response = client.get("/api/v1/facilities", params={"radius_km": 101})

    assert response.status_code == 422


def test_search_rejects_invalid_cursor() -> None:
    response = client.get("/api/v1/facilities", params={"cursor": "not-a-cursor"})

    assert response.status_code == 422


def test_facility_detail_marks_expired_source_as_stale() -> None:
    response = client.get("/api/v1/facilities/fcl_denpasar_01")

    assert response.status_code == 200
    assert response.json()["stale"] is True


def test_unknown_facility_returns_not_found() -> None:
    response = client.get("/api/v1/facilities/missing")

    assert response.status_code == 404
