"""
Iteration-3 backend feature tests for TrustMule.

Scope:
- acceptedTerms via POST /api/auth/login (+ GET /auth/me)
- topTraveller flag: seeded demo users vs new users
- Route alerts: buyer request UK->US + traveller plan UK->US -> notification
- Requests carry optional 'deadline'
- /inbox items carry matchedPlanId + matchedRoute + dedupe
- /orders/{id}/handoff-spot participant-only, 403 for stranger, persisted in GET /orders/{id}
- Light escrow-regression is covered by test_trustmule_backend.py; not re-run here
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


def login(name, email, accepted=False):
    r = requests.post(f"{API}/auth/login",
                      json={"name": name, "email": email, "acceptedTerms": accepted}, timeout=30)
    assert r.status_code == 200, r.text
    return r.json()


# ---- acceptedTerms ----------------------------------------------------------
class TestAcceptedTerms:
    def test_login_without_terms_flag_false(self):
        b = login("NoTerms", f"noterms.{TS}@trustmule.app", accepted=False)
        assert b["user"]["acceptedTerms"] is False
        me = requests.get(f"{API}/auth/me", headers=h(b["token"])).json()
        assert me["acceptedTerms"] is False

    def test_login_with_terms_flag_true(self):
        b = login("YesTerms", f"yesterms.{TS}@trustmule.app", accepted=True)
        assert b["user"]["acceptedTerms"] is True
        me = requests.get(f"{API}/auth/me", headers=h(b["token"])).json()
        assert me["acceptedTerms"] is True

    def test_relogin_upgrades_terms(self):
        email = f"upgrade.{TS}@trustmule.app"
        b1 = login("Upg", email, accepted=False)
        assert b1["user"]["acceptedTerms"] is False
        b2 = login("Upg", email, accepted=True)
        assert b2["user"]["acceptedTerms"] is True


# ---- Top Traveller flag -----------------------------------------------------
class TestTopTraveller:
    def test_seeded_demos_are_top_traveller(self):
        # Ensure seed exists by hitting requests list first (seeded on startup, but idempotent)
        requests.get(f"{API}/requests")
        for email in ["aisha.demo@trustmule.app", "kenji.demo@trustmule.app", "sofia.demo@trustmule.app"]:
            # We need the user id - fetch via requests list buyer field.
            pass
        # Find aisha id from any seeded request's buyer
        seeded = requests.get(f"{API}/requests").json()
        found = {}
        for r in seeded:
            if r.get("buyer") and r["buyer"].get("email") in {
                "aisha.demo@trustmule.app", "kenji.demo@trustmule.app", "sofia.demo@trustmule.app"}:
                found[r["buyer"]["email"]] = r["buyer"]
        assert len(found) >= 1, "No seeded demo buyers found"
        for email, u in found.items():
            assert u["topTraveller"] is True, f"{email} should be topTraveller: {u}"

    def test_new_user_is_not_top_traveller(self):
        b = login("Fresh", f"fresh.{TS}@trustmule.app", accepted=True)
        assert b["user"]["topTraveller"] is False


# ---- Route alerts (notifications) ------------------------------------------
class TestRouteAlerts:
    def test_00_setup_and_alert_created(self):
        cls = TestRouteAlerts
        cls.buyer = login("Alert Buyer", f"alertb.{TS}@trustmule.app", accepted=True)
        cls.traveler = login("Alert Traveler", f"alertt.{TS}@trustmule.app", accepted=True)
        # buyer posts UK->US request
        r = requests.post(f"{API}/requests", headers=h(cls.buyer["token"]), json={
            "title": f"TEST_RouteAlert_{TS}", "description": "d", "category": "Other",
            "itemPrice": 50, "maxItemPrice": 55, "reward": 10,
            "fromCountry": f"UK_{TS}", "toCountry": f"US_{TS}", "toCity": "NYC",
        })
        assert r.status_code == 200, r.text
        cls.request_id = r.json()["id"]

        # Snapshot buyer's unread count before
        before = requests.get(f"{API}/notifications/unread-count", headers=h(cls.buyer["token"])).json()["count"]

        # Traveler posts matching plan
        p = requests.post(f"{API}/travel-plans", headers=h(cls.traveler["token"]), json={
            "fromCountry": f"UK_{TS}", "toCountry": f"US_{TS}",
            "departDate": "2030-01-01", "capacity": 1,
        })
        assert p.status_code == 200, p.text
        assert p.json()["matchCount"] >= 1

        # Buyer should now have +1 unread
        after = requests.get(f"{API}/notifications/unread-count", headers=h(cls.buyer["token"])).json()
        assert after["count"] >= before + 1
        cls.before, cls.after = before, after["count"]

    def test_01_list_notifications(self):
        cls = TestRouteAlerts
        notifs = requests.get(f"{API}/notifications", headers=h(cls.buyer["token"])).json()
        matching = [n for n in notifs if n.get("requestId") == cls.request_id]
        assert len(matching) >= 1
        n = matching[0]
        assert n["type"] == "traveller_match"
        assert n["read"] is False
        assert "Alert Traveler" in n["body"]

    def test_02_read_all_marks_read(self):
        cls = TestRouteAlerts
        r = requests.post(f"{API}/notifications/read-all", headers=h(cls.buyer["token"]))
        assert r.status_code == 200 and r.json()["ok"] is True
        cnt = requests.get(f"{API}/notifications/unread-count", headers=h(cls.buyer["token"])).json()["count"]
        assert cnt == 0

    def test_03_no_self_alert(self):
        # A traveller who posts a plan on a route where THEY are also the buyer
        # should not be notified (exclude_buyer=user in match query).
        me = login("Self Alert", f"selfalert.{TS}@trustmule.app", accepted=True)
        # own request
        r = requests.post(f"{API}/requests", headers=h(me["token"]), json={
            "title": f"TEST_Self_{TS}", "description": "d", "category": "Other",
            "itemPrice": 10, "maxItemPrice": 12, "reward": 3,
            "fromCountry": f"SELFA_{TS}", "toCountry": f"SELFB_{TS}", "toCity": "X",
        })
        assert r.status_code == 200
        before = requests.get(f"{API}/notifications/unread-count", headers=h(me["token"])).json()["count"]
        # own plan on same route
        p = requests.post(f"{API}/travel-plans", headers=h(me["token"]), json={
            "fromCountry": f"SELFA_{TS}", "toCountry": f"SELFB_{TS}",
            "departDate": "2030-01-01", "capacity": 1,
        })
        assert p.status_code == 200
        after = requests.get(f"{API}/notifications/unread-count", headers=h(me["token"])).json()["count"]
        assert after == before, "Self should not receive route alert for own plan"


# ---- Request deadline -------------------------------------------------------
class TestRequestDeadline:
    def test_deadline_stored_and_returned(self):
        b = login("DL", f"dl.{TS}@trustmule.app", accepted=True)
        r = requests.post(f"{API}/requests", headers=h(b["token"]), json={
            "title": f"TEST_Deadline_{TS}", "description": "d", "category": "Other",
            "itemPrice": 20, "maxItemPrice": 25, "reward": 5,
            "fromCountry": f"DLF_{TS}", "toCountry": f"DLT_{TS}", "toCity": "X",
            "deadline": "2030-06-15",
        })
        assert r.status_code == 200 and r.json()["deadline"] == "2030-06-15"
        rid = r.json()["id"]
        got = requests.get(f"{API}/requests/{rid}").json()
        assert got["deadline"] == "2030-06-15"

    def test_deadline_optional(self):
        b = login("DL2", f"dl2.{TS}@trustmule.app", accepted=True)
        r = requests.post(f"{API}/requests", headers=h(b["token"]), json={
            "title": f"TEST_NoDeadline_{TS}", "description": "d", "category": "Other",
            "itemPrice": 20, "maxItemPrice": 25, "reward": 5,
            "fromCountry": f"DLNF_{TS}", "toCountry": f"DLNT_{TS}", "toCity": "X",
        })
        assert r.status_code == 200 and r.json().get("deadline") is None


# ---- Inbox aggregation ------------------------------------------------------
class TestInboxAggregation:
    def test_inbox_carries_matchedPlanId_and_route_and_dedupes(self):
        buyer = login("IB Buyer", f"ibb.{TS}@trustmule.app", accepted=True)
        traveler = login("IB Trav", f"ibt.{TS}@trustmule.app", accepted=True)
        FC, TC = f"IBF_{TS}", f"IBT_{TS}"
        # Buyer creates a request on the route
        r = requests.post(f"{API}/requests", headers=h(buyer["token"]), json={
            "title": f"TEST_Inbox_{TS}", "description": "d", "category": "Other",
            "itemPrice": 30, "maxItemPrice": 35, "reward": 5,
            "fromCountry": FC, "toCountry": TC, "toCity": "X",
            "deadline": "2030-05-01",
        })
        assert r.status_code == 200, r.text
        req_id = r.json()["id"]

        # Traveller creates TWO plans on the SAME route (should dedupe in inbox)
        for dep in ("2030-02-01", "2030-03-01"):
            p = requests.post(f"{API}/travel-plans", headers=h(traveler["token"]), json={
                "fromCountry": FC, "toCountry": TC, "departDate": dep, "capacity": 1,
            })
            assert p.status_code == 200

        inbox = requests.get(f"{API}/inbox", headers=h(traveler["token"])).json()
        hits = [x for x in inbox if x["id"] == req_id]
        assert len(hits) == 1, f"Inbox should dedupe across plans, got {len(hits)}"
        it = hits[0]
        assert it["matchedPlanId"]
        assert it["matchedRoute"] == f"{FC} → {TC}"
        assert it["deadline"] == "2030-05-01"


# ---- Handoff spot -----------------------------------------------------------
class TestHandoffSpot:
    def test_00_setup(self):
        cls = TestHandoffSpot
        cls.buyer = login("HS Buyer", f"hsb.{TS}@trustmule.app", accepted=True)
        cls.trav = login("HS Trav", f"hst.{TS}@trustmule.app", accepted=True)
        cls.stranger = login("HS Str", f"hstr.{TS}@trustmule.app", accepted=True)
        r = requests.post(f"{API}/requests", headers=h(cls.buyer["token"]), json={
            "title": f"TEST_HS_{TS}", "description": "d", "category": "Other",
            "itemPrice": 40, "maxItemPrice": 45, "reward": 8,
            "fromCountry": f"HSF_{TS}", "toCountry": f"HST_{TS}", "toCity": "X",
        })
        assert r.status_code == 200
        cls.req_id = r.json()["id"]
        o = requests.post(f"{API}/orders/accept", headers=h(cls.trav["token"]),
                          json={"requestId": cls.req_id, "proposedFee": 8}).json()
        cls.order_id = o["id"]

    def test_01_stranger_forbidden(self):
        cls = TestHandoffSpot
        r = requests.post(f"{API}/orders/{cls.order_id}/handoff-spot",
                          headers=h(cls.stranger["token"]),
                          json={"name": "Cafe X", "address": "1 Main St"})
        assert r.status_code == 403

    def test_02_buyer_can_set_spot(self):
        cls = TestHandoffSpot
        r = requests.post(f"{API}/orders/{cls.order_id}/handoff-spot",
                          headers=h(cls.buyer["token"]),
                          json={"name": "Cafe Buyer", "address": "42 Oak Rd", "lat": 1.0, "lng": 2.0})
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["handoffSpot"]["name"] == "Cafe Buyer"
        assert data["handoffSpot"]["address"] == "42 Oak Rd"
        assert data["handoffSpot"]["setByName"] == "HS Buyer"

    def test_03_traveler_can_overwrite(self):
        cls = TestHandoffSpot
        r = requests.post(f"{API}/orders/{cls.order_id}/handoff-spot",
                          headers=h(cls.trav["token"]),
                          json={"name": "Cafe Trav", "address": "9 Pine Ave"})
        assert r.status_code == 200
        assert r.json()["handoffSpot"]["setByName"] == "HS Trav"

    def test_04_get_order_returns_spot(self):
        cls = TestHandoffSpot
        got = requests.get(f"{API}/orders/{cls.order_id}", headers=h(cls.buyer["token"])).json()
        assert got["handoffSpot"]["name"] == "Cafe Trav"
