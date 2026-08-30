"""
TrustMule end-to-end backend tests.
NOTE: xdist --dist loadscope pins one class to one worker, so all sequential
state-sharing tests are placed in a single class to share attributes.
"""
import os
import io
import time
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://trustmule.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

TS = int(time.time())
BUYER_EMAIL = f"buyer.pytest.{TS}@trustmule.app"
TRAVELER_EMAIL = f"traveler.pytest.{TS}@trustmule.app"
STRANGER_EMAIL = f"stranger.pytest.{TS}@trustmule.app"


def h(t):
    return {"Authorization": f"Bearer {t}"}


def login(name, email):
    r = requests.post(f"{API}/auth/login", json={"name": name, "email": email}, timeout=30)
    assert r.status_code == 200, r.text
    return r.json()


# ---- Auth & chain (independent) -----------------------------------------
class TestAuthAndChain:
    def test_login_creates_user_and_wallet(self):
        b = login("Pytest AuthCheck", f"auth.pytest.{TS}@trustmule.app")
        assert b["token"] and b["user"]["id"]
        assert b["user"]["walletAddress"].startswith("0x")

    def test_login_idempotent_same_email(self):
        email = f"idem.pytest.{TS}@trustmule.app"
        b1 = login("A", email)
        b2 = login("B", email)  # name change allowed, same user
        assert b1["user"]["id"] == b2["user"]["id"]

    def test_me_requires_auth(self):
        assert requests.get(f"{API}/auth/me").status_code == 401

    def test_me_returns_user(self):
        b = login("Me Test", f"me.pytest.{TS}@trustmule.app")
        r = requests.get(f"{API}/auth/me", headers=h(b["token"]))
        assert r.status_code == 200 and r.json()["email"] == f"me.pytest.{TS}@trustmule.app"

    def test_patch_profile(self):
        b = login("Patch Test", f"patch.pytest.{TS}@trustmule.app")
        r = requests.patch(f"{API}/users/me", headers=h(b["token"]), json={"bio": "I test."})
        assert r.status_code == 200 and r.json()["bio"] == "I test."

    def test_kyc(self):
        b = login("KYC Test", f"kyc.pytest.{TS}@trustmule.app")
        r = requests.post(f"{API}/users/kyc", headers=h(b["token"]))
        assert r.status_code == 200 and r.json()["kycStatus"] == "verified"

    def test_chain_config(self):
        r = requests.get(f"{API}/chain/config")
        assert r.status_code == 200
        data = r.json()
        assert data["chainId"] == 84532 and "live" in data


# ---- Requests catalog ---------------------------------------------------
class TestRequestsCatalog:
    def test_seeded(self):
        r = requests.get(f"{API}/requests")
        assert r.status_code == 200 and len(r.json()) >= 4

    def test_category_filter(self):
        r = requests.get(f"{API}/requests", params={"category": "Beauty"})
        assert r.status_code == 200
        for x in r.json():
            assert x["category"] == "Beauty"

    def test_search_q(self):
        r = requests.get(f"{API}/requests", params={"q": "Sony"})
        assert r.status_code == 200
        assert any("Sony" in x["title"] for x in r.json())


# ---- Full escrow lifecycle (single class = single worker) ---------------
class TestFullEscrowFlow:
    """Sequential tests sharing class attributes; all run on one worker."""

    def test_00_setup_accounts(self):
        cls = TestFullEscrowFlow
        cls.buyer = login("Pytest Buyer", BUYER_EMAIL)
        cls.traveler = login("Pytest Traveler", TRAVELER_EMAIL)
        cls.stranger = login("Pytest Stranger", STRANGER_EMAIL)
        assert cls.buyer["user"]["walletAddress"].startswith("0x")

    def test_01_deposit_faucet(self):
        cls = TestFullEscrowFlow
        rb = requests.post(f"{API}/wallet/deposit", headers=h(cls.buyer["token"]), json={"amount": 2000})
        rt = requests.post(f"{API}/wallet/deposit", headers=h(cls.traveler["token"]), json={"amount": 500})
        assert rb.status_code == 200 and rb.json()["balance"] >= 2000
        assert rt.status_code == 200 and rt.json()["balance"] >= 500

    def test_02_create_request(self):
        cls = TestFullEscrowFlow
        r = requests.post(f"{API}/requests", headers=h(cls.buyer["token"]), json={
            "title": "TEST_iPad Pro 11", "description": "test", "category": "Electronics",
            "itemPrice": 800, "maxItemPrice": 850, "reward": 100,
            "fromCountry": "US", "toCountry": "SG", "toCity": "Singapore"})
        assert r.status_code == 200
        cls.request_id = r.json()["id"]
        assert r.json()["status"] == "open"

    def test_03_mine_and_detail(self):
        cls = TestFullEscrowFlow
        rm = requests.get(f"{API}/requests/mine", headers=h(cls.buyer["token"]))
        assert any(x["id"] == cls.request_id for x in rm.json())
        rd = requests.get(f"{API}/requests/{cls.request_id}")
        assert rd.status_code == 200 and rd.json()["title"] == "TEST_iPad Pro 11"

    def test_04_buyer_cannot_accept_own(self):
        cls = TestFullEscrowFlow
        r = requests.post(f"{API}/orders/accept", headers=h(cls.buyer["token"]),
                          json={"requestId": cls.request_id, "proposedFee": 100})
        assert r.status_code == 400

    def test_05_traveler_accepts(self):
        cls = TestFullEscrowFlow
        r = requests.post(f"{API}/orders/accept", headers=h(cls.traveler["token"]),
                          json={"requestId": cls.request_id, "proposedFee": 100, "note": "ok"})
        assert r.status_code == 200, r.text
        data = r.json()
        cls.order_id = data["id"]
        assert data["status"] == "offered"
        assert data["stake"] == round(800 * 0.15, 2)

    def test_06_buyer_accepts_offer(self):
        cls = TestFullEscrowFlow
        r = requests.post(f"{API}/orders/{cls.order_id}/respond", headers=h(cls.buyer["token"]),
                          json={"action": "accept"})
        assert r.status_code == 200 and r.json()["status"] == "agreed"

    def test_07_only_traveler_can_stake(self):
        cls = TestFullEscrowFlow
        r = requests.post(f"{API}/orders/{cls.order_id}/stake", headers=h(cls.buyer["token"]))
        assert r.status_code == 403

    def test_08_traveler_stakes(self):
        cls = TestFullEscrowFlow
        before = requests.get(f"{API}/wallet", headers=h(cls.traveler["token"])).json()
        r = requests.post(f"{API}/orders/{cls.order_id}/stake", headers=h(cls.traveler["token"]))
        assert r.status_code == 200
        after = requests.get(f"{API}/wallet", headers=h(cls.traveler["token"])).json()
        stake = round(800 * 0.15, 2)
        assert round(before["balance"] - after["balance"], 2) == stake
        assert round(after["locked"] - before["locked"], 2) == stake

    def test_09_only_buyer_can_fund(self):
        cls = TestFullEscrowFlow
        r = requests.post(f"{API}/orders/{cls.order_id}/fund", headers=h(cls.traveler["token"]))
        assert r.status_code == 403

    def test_10_buyer_funds(self):
        cls = TestFullEscrowFlow
        before = requests.get(f"{API}/wallet", headers=h(cls.buyer["token"])).json()
        r = requests.post(f"{API}/orders/{cls.order_id}/fund", headers=h(cls.buyer["token"]))
        assert r.status_code == 200 and r.json()["status"] == "funded"
        after = requests.get(f"{API}/wallet", headers=h(cls.buyer["token"])).json()
        total = 800 + 100
        assert round(before["balance"] - after["balance"], 2) == total
        assert round(after["locked"] - before["locked"], 2) == total

    def test_11_traveler_purchased(self):
        cls = TestFullEscrowFlow
        r = requests.post(f"{API}/orders/{cls.order_id}/purchased", headers=h(cls.traveler["token"]),
                          json={"receiptUrl": "https://example.com/rcpt.jpg"})
        assert r.status_code == 200 and r.json()["status"] == "purchased"
        assert r.json()["receiptHash"]

    def test_12_transit(self):
        cls = TestFullEscrowFlow
        r = requests.post(f"{API}/orders/{cls.order_id}/transit", headers=h(cls.traveler["token"]))
        assert r.status_code == 200 and r.json()["status"] == "in_transit"

    def test_13_arrived(self):
        cls = TestFullEscrowFlow
        r = requests.post(f"{API}/orders/{cls.order_id}/arrived", headers=h(cls.traveler["token"]))
        assert r.status_code == 200 and r.json()["status"] == "arrived"

    def test_14_qr_only_buyer(self):
        cls = TestFullEscrowFlow
        r = requests.post(f"{API}/orders/{cls.order_id}/qr", headers=h(cls.traveler["token"]))
        assert r.status_code == 403

    def test_15_buyer_generates_qr(self):
        cls = TestFullEscrowFlow
        r = requests.post(f"{API}/orders/{cls.order_id}/qr", headers=h(cls.buyer["token"]))
        assert r.status_code == 200
        data = r.json()
        assert data["secret"] and data["payload"].startswith("TRUSTMULE:")
        cls.secret = data["secret"]
        cls.payload = data["payload"]

    def test_16_complete_bad_code(self):
        cls = TestFullEscrowFlow
        r = requests.post(f"{API}/orders/{cls.order_id}/complete", headers=h(cls.traveler["token"]),
                          json={"secret": "bogus"})
        assert r.status_code == 400

    def test_17_complete_releases_funds(self):
        cls = TestFullEscrowFlow
        b_before = requests.get(f"{API}/wallet", headers=h(cls.buyer["token"])).json()
        t_before = requests.get(f"{API}/wallet", headers=h(cls.traveler["token"])).json()
        r = requests.post(f"{API}/orders/{cls.order_id}/complete", headers=h(cls.traveler["token"]),
                          json={"secret": cls.payload})
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["status"] == "completed"
        total = 800 + 100
        expected_fee = round(total * 0.03, 2)
        expected_payout = round(total - expected_fee, 2)
        assert data["platformFee"] == expected_fee
        assert data["payout"] == expected_payout
        b_after = requests.get(f"{API}/wallet", headers=h(cls.buyer["token"])).json()
        t_after = requests.get(f"{API}/wallet", headers=h(cls.traveler["token"])).json()
        assert round(b_before["locked"] - b_after["locked"], 2) == total
        stake = round(800 * 0.15, 2)
        assert round(t_after["balance"] - t_before["balance"], 2) == round(stake + expected_payout, 2)
        assert round(t_before["locked"] - t_after["locked"], 2) == stake

    def test_18_review_updates_reputation(self):
        cls = TestFullEscrowFlow
        r = requests.post(f"{API}/reviews", headers=h(cls.buyer["token"]),
                          json={"orderId": cls.order_id, "rating": 5, "comment": "Great!"})
        assert r.status_code == 200
        r2 = requests.get(f"{API}/users/{cls.traveler['user']['id']}")
        assert r2.json()["reputation"] == 5.0
        # duplicate rejected
        r3 = requests.post(f"{API}/reviews", headers=h(cls.buyer["token"]),
                           json={"orderId": cls.order_id, "rating": 4, "comment": "dup"})
        assert r3.status_code == 400
        rr = requests.get(f"{API}/users/{cls.traveler['user']['id']}/reviews")
        assert len(rr.json()) >= 1

    def test_19_chat_participants_only(self):
        cls = TestFullEscrowFlow
        r1 = requests.post(f"{API}/orders/{cls.order_id}/messages", headers=h(cls.buyer["token"]),
                           json={"text": "hi from buyer"})
        r2 = requests.post(f"{API}/orders/{cls.order_id}/messages", headers=h(cls.traveler["token"]),
                           json={"text": "hi from traveler"})
        assert r1.status_code == 200 and r2.status_code == 200
        r3 = requests.get(f"{API}/orders/{cls.order_id}/messages", headers=h(cls.buyer["token"]))
        assert r3.status_code == 200 and len(r3.json()) >= 2
        r4 = requests.get(f"{API}/orders/{cls.order_id}/messages", headers=h(cls.stranger["token"]))
        assert r4.status_code == 403

    def test_20_stranger_cannot_view_order(self):
        cls = TestFullEscrowFlow
        r = requests.get(f"{API}/orders/{cls.order_id}", headers=h(cls.stranger["token"]))
        assert r.status_code == 403


# ---- Dispute, cancel, upload (all class-local state) -------------------
class TestDisputeAndCancel:
    def test_00_setup(self):
        cls = TestDisputeAndCancel
        cls.buyer = login("Pytest DBuyer", f"dbuyer.pytest.{TS}@trustmule.app")
        cls.traveler = login("Pytest DTraveler", f"dtraveler.pytest.{TS}@trustmule.app")
        requests.post(f"{API}/wallet/deposit", headers=h(cls.buyer["token"]), json={"amount": 1000})
        requests.post(f"{API}/wallet/deposit", headers=h(cls.traveler["token"]), json={"amount": 300})

    def test_01_dispute_flow(self):
        cls = TestDisputeAndCancel
        rq = requests.post(f"{API}/requests", headers=h(cls.buyer["token"]), json={
            "title": "TEST_Dispute", "description": "d", "category": "Other",
            "itemPrice": 100, "maxItemPrice": 105, "reward": 20,
            "fromCountry": "US", "toCountry": "IN", "toCity": "Mumbai"}).json()
        ro = requests.post(f"{API}/orders/accept", headers=h(cls.traveler["token"]),
                           json={"requestId": rq["id"], "proposedFee": 20}).json()
        oid = ro["id"]
        rd = requests.post(f"{API}/disputes", headers=h(cls.buyer["token"]),
                           json={"orderId": oid, "reason": "test", "evidence": []})
        assert rd.status_code == 200
        got = requests.get(f"{API}/orders/{oid}", headers=h(cls.buyer["token"])).json()
        assert got["status"] == "disputed"
        rm = requests.get(f"{API}/disputes/mine", headers=h(cls.buyer["token"]))
        assert any(d["orderId"] == oid for d in rm.json())

    def test_02_cancel_after_funded_refunds(self):
        cls = TestDisputeAndCancel
        rq = requests.post(f"{API}/requests", headers=h(cls.buyer["token"]), json={
            "title": "TEST_Cancel", "description": "c", "category": "Other",
            "itemPrice": 100, "maxItemPrice": 105, "reward": 15,
            "fromCountry": "US", "toCountry": "IN", "toCity": "Delhi"}).json()
        ro = requests.post(f"{API}/orders/accept", headers=h(cls.traveler["token"]),
                           json={"requestId": rq["id"], "proposedFee": 15}).json()
        oid = ro["id"]
        requests.post(f"{API}/orders/{oid}/respond", headers=h(cls.buyer["token"]), json={"action": "accept"})
        requests.post(f"{API}/orders/{oid}/stake", headers=h(cls.traveler["token"]))
        requests.post(f"{API}/orders/{oid}/fund", headers=h(cls.buyer["token"]))
        b_before = requests.get(f"{API}/wallet", headers=h(cls.buyer["token"])).json()
        t_before = requests.get(f"{API}/wallet", headers=h(cls.traveler["token"])).json()
        rc = requests.post(f"{API}/orders/{oid}/cancel", headers=h(cls.buyer["token"]))
        assert rc.status_code == 200 and rc.json()["status"] == "cancelled"
        b_after = requests.get(f"{API}/wallet", headers=h(cls.buyer["token"])).json()
        t_after = requests.get(f"{API}/wallet", headers=h(cls.traveler["token"])).json()
        assert round(b_after["balance"] - b_before["balance"], 2) == 115
        assert round(t_after["balance"] - t_before["balance"], 2) == 15


class TestUpload:
    def test_upload_and_serve(self):
        b = login("Uploader", f"upl.pytest.{TS}@trustmule.app")
        png = b"\x89PNG\r\n\x1a\n" + b"\x00" * 32
        r = requests.post(f"{API}/upload", headers={"Authorization": f"Bearer {b['token']}"},
                          files={"file": ("t.png", io.BytesIO(png), "image/png")}, timeout=60)
        if r.status_code != 200:
            pytest.skip(f"Object storage unavailable: {r.status_code} {r.text[:200]}")
        path = r.json()["path"]
        r2 = requests.get(f"{API}/files/{path}", timeout=60)
        assert r2.status_code == 200
