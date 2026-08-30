"""
TrustMule — New feature backend tests (Iteration 2)
Covers: travel plans, matching inbox, route availability, city metadata, public
profile & reviews, plus a light regression on escrow completing → past availability.
"""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://trustmule.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

TS = int(time.time())


def h(t):
    return {"Authorization": f"Bearer {t}"}


def login(name, email):
    r = requests.post(f"{API}/auth/login", json={"name": name, "email": email}, timeout=30)
    assert r.status_code == 200, r.text
    return r.json()


def deposit(token, amount):
    r = requests.post(f"{API}/wallet/deposit", headers=h(token), json={"amount": amount}, timeout=30)
    assert r.status_code == 200, r.text


# ---- Travel plans & matching -------------------------------------------
class TestTravelPlansAndInbox:
    """Uses a fresh Singapore->India route with unique buyers so counts are deterministic."""

    def test_00_setup(self):
        cls = TestTravelPlansAndInbox
        cls.buyerA = login("PT Buyer A", f"tp.buyerA.{TS}@trustmule.app")
        cls.travB = login("PT Traveler B", f"tp.travB.{TS}@trustmule.app")
        cls.travC = login("PT Traveler C", f"tp.travC.{TS}@trustmule.app")
        deposit(cls.buyerA["token"], 2000)
        deposit(cls.travB["token"], 500)
        deposit(cls.travC["token"], 500)
        # Unique route (unlikely to have prior data): Indonesia -> Fiji
        cls.fromCountry = f"Indonesia_{TS}"
        cls.toCountry = f"Fiji_{TS}"

    def test_01_create_request_with_cities(self):
        cls = TestTravelPlansAndInbox
        r = requests.post(f"{API}/requests", headers=h(cls.buyerA["token"]), json={
            "title": "TEST_TP Bali item", "description": "d", "category": "Other",
            "itemPrice": 100, "maxItemPrice": 110, "reward": 20,
            "fromCountry": cls.fromCountry, "fromCity": "Denpasar (Bali)",
            "toCountry": cls.toCountry, "toCity": "Suva",
        })
        assert r.status_code == 200, r.text
        d = r.json()
        cls.request_id = d["id"]
        # City metadata persisted
        assert d["fromCity"] == "Denpasar (Bali)"
        assert d["toCity"] == "Suva"

    def test_02_get_request_shows_cities(self):
        cls = TestTravelPlansAndInbox
        r = requests.get(f"{API}/requests/{cls.request_id}")
        assert r.status_code == 200
        assert r.json()["fromCity"] == "Denpasar (Bali)"

    def test_03_traveler_plan_returns_matchCount(self):
        cls = TestTravelPlansAndInbox
        r = requests.post(f"{API}/travel-plans", headers=h(cls.travB["token"]), json={
            "fromCountry": cls.fromCountry, "fromCity": "Denpasar (Bali)",
            "toCountry": cls.toCountry, "toCity": "Suva",
            "departDate": "2026-05-01", "note": "test", "capacity": 2,
        })
        assert r.status_code == 200, r.text
        d = r.json()
        cls.planB_id = d["id"]
        assert d["status"] == "active"
        assert d["matchCount"] == 1, f"Expected 1 open matching request, got {d['matchCount']}"

    def test_04_buyer_creates_own_plan_excludes_own_requests(self):
        cls = TestTravelPlansAndInbox
        # BuyerA also plans the same route -> should NOT count their own request
        r = requests.post(f"{API}/travel-plans", headers=h(cls.buyerA["token"]), json={
            "fromCountry": cls.fromCountry, "toCountry": cls.toCountry,
        })
        assert r.status_code == 200
        assert r.json()["matchCount"] == 0

    def test_05_my_travel_plans_lists_active_with_matchcount(self):
        cls = TestTravelPlansAndInbox
        r = requests.get(f"{API}/travel-plans/mine", headers=h(cls.travB["token"]))
        assert r.status_code == 200
        mine = r.json()
        assert any(p["id"] == cls.planB_id and p["matchCount"] == 1 for p in mine)

    def test_06_plan_matches_endpoint(self):
        cls = TestTravelPlansAndInbox
        r = requests.get(f"{API}/travel-plans/{cls.planB_id}/matches", headers=h(cls.travB["token"]))
        assert r.status_code == 200
        matches = r.json()
        assert any(m["id"] == cls.request_id for m in matches)

    def test_07_plan_matches_403_for_other_user(self):
        cls = TestTravelPlansAndInbox
        r = requests.get(f"{API}/travel-plans/{cls.planB_id}/matches", headers=h(cls.travC["token"]))
        assert r.status_code == 403

    def test_08_inbox_contains_request_with_matched_route(self):
        cls = TestTravelPlansAndInbox
        r = requests.get(f"{API}/inbox", headers=h(cls.travB["token"]))
        assert r.status_code == 200
        items = r.json()
        hit = next((x for x in items if x["id"] == cls.request_id), None)
        assert hit is not None, "matching request missing from inbox"
        assert hit["matchedPlanId"] == cls.planB_id
        assert hit["matchedRoute"] == f"{cls.fromCountry} → {cls.toCountry}"

    def test_09_availability_excludes_requesting_user(self):
        cls = TestTravelPlansAndInbox
        # As travB (who has the plan) — planned should EXCLUDE self.
        # buyerA also created a plan (test_04), so planned=1 from travB's view.
        r = requests.get(f"{API}/availability", headers=h(cls.travB["token"]),
                         params={"fromCountry": cls.fromCountry, "toCountry": cls.toCountry})
        assert r.status_code == 200
        d = r.json()
        assert d["planned"] == 1 and d["past"] == 0 and d["total"] == 1

        # As travC (no plan on this route) — planned should include travB + buyerA => 2
        r2 = requests.get(f"{API}/availability", headers=h(cls.travC["token"]),
                          params={"fromCountry": cls.fromCountry, "toCountry": cls.toCountry})
        assert r2.status_code == 200
        d2 = r2.json()
        assert d2["planned"] == 2 and d2["total"] == 2

    def test_10_request_availability_excludes_buyer(self):
        cls = TestTravelPlansAndInbox
        # Request-scoped availability excludes buyerA. BuyerA has a plan too but is excluded.
        r = requests.get(f"{API}/requests/{cls.request_id}/availability", headers=h(cls.travC["token"]))
        assert r.status_code == 200
        d = r.json()
        # Only travB's plan should count (buyerA's plan is excluded because they are the buyer)
        assert d["planned"] == 1
        assert d["past"] == 0
        assert d["total"] == 1

    def test_11_cancel_plan_owner_only(self):
        cls = TestTravelPlansAndInbox
        # Non-owner
        r = requests.post(f"{API}/travel-plans/{cls.planB_id}/cancel", headers=h(cls.travC["token"]))
        assert r.status_code == 403

    def test_12_cancel_plan_removes_from_mine_and_inbox(self):
        cls = TestTravelPlansAndInbox
        r = requests.post(f"{API}/travel-plans/{cls.planB_id}/cancel", headers=h(cls.travB["token"]))
        assert r.status_code == 200
        mine = requests.get(f"{API}/travel-plans/mine", headers=h(cls.travB["token"])).json()
        assert all(p["id"] != cls.planB_id for p in mine)
        inbox = requests.get(f"{API}/inbox", headers=h(cls.travB["token"])).json()
        assert all(x["id"] != cls.request_id for x in inbox)


# ---- End-to-end: past-delivery availability regression ----------------
class TestPastDeliveryAvailability:
    """After a completed delivery, the traveler shows up in 'past' for that route."""

    def test_00_full_flow_completes_and_past_reflects(self):
        buyer = login("PT PastBuyer", f"pt.pb.{TS}@trustmule.app")
        trav = login("PT PastTrav", f"pt.pt.{TS}@trustmule.app")
        third = login("PT PastThird", f"pt.pth.{TS}@trustmule.app")
        deposit(buyer["token"], 2000)
        deposit(trav["token"], 500)
        route_from = f"Singapore_{TS}"
        route_to = f"India_{TS}"

        rq = requests.post(f"{API}/requests", headers=h(buyer["token"]), json={
            "title": "TEST_Past Delivery", "description": "d", "category": "Other",
            "itemPrice": 200, "maxItemPrice": 210, "reward": 40,
            "fromCountry": route_from, "fromCity": "Singapore",
            "toCountry": route_to, "toCity": "Mumbai",
        }).json()
        rid = rq["id"]

        # Baseline availability from third (buyer excluded from route-avail)
        base = requests.get(f"{API}/availability", headers=h(third["token"]),
                            params={"fromCountry": route_from, "toCountry": route_to}).json()
        assert base["past"] == 0

        # Escrow lifecycle
        ro = requests.post(f"{API}/orders/accept", headers=h(trav["token"]),
                           json={"requestId": rid, "proposedFee": 40}).json()
        oid = ro["id"]
        requests.post(f"{API}/orders/{oid}/respond", headers=h(buyer["token"]), json={"action": "accept"})
        requests.post(f"{API}/orders/{oid}/stake", headers=h(trav["token"]))
        requests.post(f"{API}/orders/{oid}/fund", headers=h(buyer["token"]))
        requests.post(f"{API}/orders/{oid}/purchased", headers=h(trav["token"]),
                      json={"receiptUrl": "https://example.com/r.jpg"})
        requests.post(f"{API}/orders/{oid}/transit", headers=h(trav["token"]))
        requests.post(f"{API}/orders/{oid}/arrived", headers=h(trav["token"]))
        qr = requests.post(f"{API}/orders/{oid}/qr", headers=h(buyer["token"])).json()
        done = requests.post(f"{API}/orders/{oid}/complete", headers=h(trav["token"]),
                             json={"secret": qr["payload"]})
        assert done.status_code == 200 and done.json()["status"] == "completed"

        # 'past' now counts trav for that route (excluding third)
        avail = requests.get(f"{API}/availability", headers=h(third["token"]),
                             params={"fromCountry": route_from, "toCountry": route_to}).json()
        assert avail["past"] >= 1, avail
        assert avail["total"] >= 1


# ---- Public 5-star profile + reviews list -----------------------------
class TestPublicProfileAndReviews:
    def test_public_user_and_reviews_endpoints(self):
        # Reuse seeded demo buyer (has reputation and reviews via seed data)
        # First find a user id via /requests
        reqs = requests.get(f"{API}/requests").json()
        assert reqs, "no seeded requests"
        uid = reqs[0]["buyer"]["id"]
        u = requests.get(f"{API}/users/{uid}")
        assert u.status_code == 200
        prof = u.json()
        assert prof["id"] == uid
        for k in ("name", "reputation", "reviewsCount"):
            assert k in prof
        rr = requests.get(f"{API}/users/{uid}/reviews")
        assert rr.status_code == 200
        assert isinstance(rr.json(), list)

    def test_public_user_404(self):
        r = requests.get(f"{API}/users/does-not-exist")
        assert r.status_code == 404
