from fastapi import FastAPI, APIRouter, Depends, HTTPException, Header, UploadFile, File
from fastapi.responses import Response
from fastapi.concurrency import run_in_threadpool
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import hashlib
import uuid
import secrets as pysecrets
import requests
from pathlib import Path
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Object storage (Emergent managed)
# ---------------------------------------------------------------------------
STORAGE_BASE = (os.environ.get("INTEGRATION_PROXY_URL") or "").strip() or "https://integrations.emergentagent.com"
STORAGE_URL = STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "trustmule"
_storage_key = None


def init_storage():
    global _storage_key
    if _storage_key:
        return _storage_key
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
    resp.raise_for_status()
    _storage_key = resp.json()["storage_key"]
    return _storage_key


def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    resp = requests.put(f"{STORAGE_URL}/objects/{path}",
                        headers={"X-Storage-Key": key, "Content-Type": content_type}, data=data, timeout=120)
    resp.raise_for_status()
    return resp.json()


def get_object(path: str):
    key = init_storage()
    resp = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=60)
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def now_iso():
    return datetime.now(timezone.utc).isoformat()


def new_id():
    return str(uuid.uuid4())


def gen_wallet_address():
    return "0x" + pysecrets.token_hex(20)


def clean(doc: dict) -> dict:
    if doc and "_id" in doc:
        doc = {k: v for k, v in doc.items() if k != "_id"}
    return doc


PLATFORM_FEE_PCT = 0.03
STAKE_PCT = 0.15
STARTING_TEST_BALANCE = 0.0

CATEGORY_IMAGES = {
    "Beauty": "https://images.unsplash.com/photo-1458538977777-0549b2370168?crop=entropy&cs=srgb&fm=jpg&q=85&w=800",
    "Electronics": "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?crop=entropy&cs=srgb&fm=jpg&q=85&w=800",
    "Fashion": "https://images.unsplash.com/photo-1600269452121-4f2416e55c28?crop=entropy&cs=srgb&fm=jpg&q=85&w=800",
    "Other": "https://images.unsplash.com/photo-1553619948-505cc1cdc320?crop=entropy&cs=srgb&fm=jpg&q=85&w=800",
}


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------
async def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Not authenticated")
    token = authorization.split(" ", 1)[1].strip()
    user = await db.users.find_one({"token": token})
    if not user:
        raise HTTPException(401, "Invalid session")
    return clean(user)


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------
class LoginBody(BaseModel):
    name: str
    email: str


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    avatar: Optional[str] = None
    bio: Optional[str] = None


class RequestCreate(BaseModel):
    title: str
    description: str = ""
    category: str = "Other"
    image: Optional[str] = None
    itemPrice: float
    maxItemPrice: float
    reward: float
    fromCountry: str
    fromCity: str = ""
    toCountry: str
    toCity: str = ""
    deadline: Optional[str] = None


class AcceptBody(BaseModel):
    requestId: str
    proposedFee: float
    note: str = ""


class RespondBody(BaseModel):
    action: str


class PurchasedBody(BaseModel):
    receiptUrl: str


class CompleteBody(BaseModel):
    secret: str


class MessageBody(BaseModel):
    text: str = ""
    imageUrl: Optional[str] = None


class ReviewBody(BaseModel):
    orderId: str
    rating: int
    comment: str = ""


class DisputeBody(BaseModel):
    orderId: str
    reason: str
    evidence: List[str] = []


class DepositBody(BaseModel):
    amount: float


class TravelPlanCreate(BaseModel):
    fromCountry: str
    fromCity: str = ""
    toCountry: str
    toCity: str = ""
    departDate: Optional[str] = None
    returnDate: Optional[str] = None
    note: str = ""
    capacity: int = 1


# ---------------------------------------------------------------------------
# Serializers
# ---------------------------------------------------------------------------
def public_user(u: dict) -> dict:
    return {
        "id": u["id"],
        "name": u.get("name"),
        "email": u.get("email"),
        "avatar": u.get("avatar"),
        "bio": u.get("bio", ""),
        "walletAddress": u.get("walletAddress"),
        "kycStatus": u.get("kycStatus", "unverified"),
        "reputation": round(u.get("reputation", 0.0), 2),
        "reviewsCount": u.get("reviewsCount", 0),
        "ordersCompleted": u.get("ordersCompleted", 0),
        "tripsCompleted": u.get("tripsCompleted", 0),
        "createdAt": u.get("createdAt"),
    }


async def record_tx(user_id: str, tx_type: str, amount: float, order_id: str = None, note: str = ""):
    doc = {
        "id": new_id(), "userId": user_id, "type": tx_type, "amount": round(amount, 2),
        "orderId": order_id, "note": note, "createdAt": now_iso(),
    }
    await db.transactions.insert_one(doc)


async def enrich_order(o: dict) -> dict:
    buyer = await db.users.find_one({"id": o["buyerId"]})
    traveler = await db.users.find_one({"id": o["travelerId"]}) if o.get("travelerId") else None
    req = await db.requests.find_one({"id": o["requestId"]})
    o = clean(o)
    o["buyer"] = public_user(buyer) if buyer else None
    o["traveler"] = public_user(traveler) if traveler else None
    o["request"] = clean(req) if req else None
    return o


# ---------------------------------------------------------------------------
# Auth routes
# ---------------------------------------------------------------------------
@api_router.get("/")
async def root():
    return {"message": "TrustMule API"}


@api_router.get("/chain/config")
async def chain_config():
    return {
        "chainId": int(os.environ.get("CHAIN_ID", "84532")),
        "chainName": os.environ.get("CHAIN_NAME", "Base Sepolia"),
        "usdcAddress": os.environ.get("USDC_ADDRESS", ""),
        "escrowAddress": os.environ.get("ESCROW_ADDRESS", ""),
        "rpcUrl": os.environ.get("RPC_URL", ""),
        "reownProjectId": os.environ.get("REOWN_PROJECT_ID", ""),
        "live": bool(os.environ.get("ESCROW_ADDRESS", "").strip()),
    }


@api_router.post("/auth/login")
async def login(body: LoginBody):
    email = body.email.strip().lower()
    user = await db.users.find_one({"email": email})
    if not user:
        token = new_id()
        user = {
            "id": new_id(), "name": body.name.strip() or "Traveler", "email": email,
            "avatar": None, "bio": "", "walletAddress": gen_wallet_address(),
            "kycStatus": "unverified", "reputation": 0.0, "reviewsCount": 0,
            "ordersCompleted": 0, "tripsCompleted": 0,
            "usdcBalance": STARTING_TEST_BALANCE, "lockedBalance": 0.0,
            "token": token, "createdAt": now_iso(),
        }
        await db.users.insert_one(user)
    else:
        token = user.get("token") or new_id()
        await db.users.update_one({"id": user["id"]}, {"$set": {"token": token, "name": body.name.strip() or user["name"]}})
        user["token"] = token
    return {"token": token, "user": public_user(user)}


@api_router.get("/auth/me")
async def me(user=Depends(get_current_user)):
    return public_user(user)


@api_router.patch("/users/me")
async def update_me(body: ProfileUpdate, user=Depends(get_current_user)):
    updates = {k: v for k, v in body.dict().items() if v is not None}
    if updates:
        await db.users.update_one({"id": user["id"]}, {"$set": updates})
    fresh = await db.users.find_one({"id": user["id"]})
    return public_user(fresh)


@api_router.post("/users/kyc")
async def submit_kyc(user=Depends(get_current_user)):
    await db.users.update_one({"id": user["id"]}, {"$set": {"kycStatus": "verified"}})
    fresh = await db.users.find_one({"id": user["id"]})
    return public_user(fresh)


@api_router.get("/users/{user_id}")
async def get_user(user_id: str):
    u = await db.users.find_one({"id": user_id})
    if not u:
        raise HTTPException(404, "User not found")
    return public_user(u)


@api_router.get("/users/{user_id}/reviews")
async def user_reviews(user_id: str):
    revs = await db.reviews.find({"revieweeId": user_id}).sort("createdAt", -1).to_list(200)
    out = []
    for r in revs:
        reviewer = await db.users.find_one({"id": r["reviewerId"]})
        r = clean(r)
        r["reviewer"] = public_user(reviewer) if reviewer else None
        out.append(r)
    return out


# ---------------------------------------------------------------------------
# Upload
# ---------------------------------------------------------------------------
@api_router.post("/upload")
async def upload(file: UploadFile = File(...), user=Depends(get_current_user)):
    data = await file.read()
    ext = (file.filename or "img.jpg").split(".")[-1].lower()
    if ext not in ("jpg", "jpeg", "png", "webp", "heic"):
        ext = "jpg"
    path = f"{APP_NAME}/uploads/{user['id']}/{new_id()}.{ext}"
    ct = file.content_type or "image/jpeg"
    await run_in_threadpool(put_object, path, data, ct)
    await db.uploads.insert_one({"id": new_id(), "ownerId": user["id"], "path": path, "createdAt": now_iso()})
    return {"path": path, "url": f"/api/files/{path}"}


@api_router.get("/files/{path:path}")
async def files(path: str):
    try:
        content, ct = await run_in_threadpool(get_object, path)
    except Exception:
        raise HTTPException(404, "File not found")
    return Response(content=content, media_type=ct)


# ---------------------------------------------------------------------------
# Requests
# ---------------------------------------------------------------------------
@api_router.post("/requests")
async def create_request(body: RequestCreate, user=Depends(get_current_user)):
    image = body.image or CATEGORY_IMAGES.get(body.category, CATEGORY_IMAGES["Other"])
    doc = {
        "id": new_id(), "buyerId": user["id"], "title": body.title, "description": body.description,
        "category": body.category, "image": image, "itemPrice": round(body.itemPrice, 2),
        "maxItemPrice": round(body.maxItemPrice, 2), "reward": round(body.reward, 2),
        "fromCountry": body.fromCountry, "toCountry": body.toCountry, "toCity": body.toCity,
        "fromCity": body.fromCity,
        "deadline": body.deadline, "status": "open", "createdAt": now_iso(), "deletedAt": None,
    }
    await db.requests.insert_one(doc)
    return clean(doc)


@api_router.get("/requests")
async def list_requests(category: Optional[str] = None, toCountry: Optional[str] = None,
                        fromCountry: Optional[str] = None, q: Optional[str] = None):
    query = {"status": "open", "deletedAt": None}
    if category and category != "All":
        query["category"] = category
    if toCountry:
        query["toCountry"] = toCountry
    if fromCountry:
        query["fromCountry"] = fromCountry
    if q:
        query["title"] = {"$regex": q, "$options": "i"}
    reqs = await db.requests.find(query).sort("createdAt", -1).to_list(200)
    out = []
    for r in reqs:
        buyer = await db.users.find_one({"id": r["buyerId"]})
        r = clean(r)
        r["buyer"] = public_user(buyer) if buyer else None
        out.append(r)
    return out


@api_router.get("/requests/mine")
async def my_requests(user=Depends(get_current_user)):
    reqs = await db.requests.find({"buyerId": user["id"], "deletedAt": None}).sort("createdAt", -1).to_list(200)
    return [clean(r) for r in reqs]


@api_router.get("/requests/{req_id}")
async def get_request(req_id: str):
    r = await db.requests.find_one({"id": req_id})
    if not r:
        raise HTTPException(404, "Request not found")
    buyer = await db.users.find_one({"id": r["buyerId"]})
    r = clean(r)
    r["buyer"] = public_user(buyer) if buyer else None
    offers = await db.orders.find({"requestId": req_id}).to_list(100)
    r["offers"] = [clean(o) for o in offers]
    return r


# ---------------------------------------------------------------------------
# Travel plans, inbox matching & delivery availability
# ---------------------------------------------------------------------------
async def _requests_matching(from_country: str, to_country: str, exclude_buyer: str = None):
    q = {"status": "open", "deletedAt": None, "fromCountry": from_country, "toCountry": to_country}
    if exclude_buyer:
        q["buyerId"] = {"$ne": exclude_buyer}
    reqs = await db.requests.find(q).sort("createdAt", -1).to_list(200)
    out = []
    for r in reqs:
        buyer = await db.users.find_one({"id": r["buyerId"]})
        r = clean(r)
        r["buyer"] = public_user(buyer) if buyer else None
        out.append(r)
    return out


async def _route_availability(from_country: str, to_country: str, exclude_user: str = None):
    plan_q = {"status": "active", "fromCountry": from_country, "toCountry": to_country}
    if exclude_user:
        plan_q["userId"] = {"$ne": exclude_user}
    plans = await db.travel_plans.find(plan_q).to_list(500)
    planned_ids = set(p["userId"] for p in plans)
    completed = await db.orders.find({"status": "completed"}).to_list(1000)
    past_ids = set()
    for o in completed:
        if exclude_user and o["travelerId"] == exclude_user:
            continue
        r = await db.requests.find_one({"id": o["requestId"]})
        if r and r.get("fromCountry") == from_country and r.get("toCountry") == to_country:
            past_ids.add(o["travelerId"])
    total = planned_ids | past_ids
    return {"planned": len(planned_ids), "past": len(past_ids), "total": len(total)}


@api_router.get("/availability")
async def availability(fromCountry: str, toCountry: str, user=Depends(get_current_user)):
    return await _route_availability(fromCountry, toCountry, exclude_user=user["id"])


@api_router.get("/requests/{req_id}/availability")
async def request_availability(req_id: str, user=Depends(get_current_user)):
    r = await db.requests.find_one({"id": req_id})
    if not r:
        raise HTTPException(404, "Request not found")
    return await _route_availability(r["fromCountry"], r["toCountry"], exclude_user=r["buyerId"])


@api_router.post("/travel-plans")
async def create_travel_plan(body: TravelPlanCreate, user=Depends(get_current_user)):
    doc = {
        "id": new_id(), "userId": user["id"], "fromCountry": body.fromCountry, "fromCity": body.fromCity,
        "toCountry": body.toCountry, "toCity": body.toCity, "departDate": body.departDate,
        "returnDate": body.returnDate, "note": body.note, "capacity": max(1, body.capacity),
        "status": "active", "createdAt": now_iso(),
    }
    await db.travel_plans.insert_one(doc)
    matches = await _requests_matching(body.fromCountry, body.toCountry, exclude_buyer=user["id"])
    out = clean(doc)
    out["matchCount"] = len(matches)
    return out


@api_router.get("/travel-plans/mine")
async def my_travel_plans(user=Depends(get_current_user)):
    plans = await db.travel_plans.find({"userId": user["id"], "status": "active"}).sort("createdAt", -1).to_list(200)
    out = []
    for p in plans:
        matches = await _requests_matching(p["fromCountry"], p["toCountry"], exclude_buyer=user["id"])
        p = clean(p)
        p["matchCount"] = len(matches)
        out.append(p)
    return out


@api_router.post("/travel-plans/{plan_id}/cancel")
async def cancel_travel_plan(plan_id: str, user=Depends(get_current_user)):
    p = await db.travel_plans.find_one({"id": plan_id})
    if not p or p["userId"] != user["id"]:
        raise HTTPException(403, "Not your travel plan")
    await db.travel_plans.update_one({"id": plan_id}, {"$set": {"status": "cancelled"}})
    return {"ok": True}


@api_router.get("/travel-plans/{plan_id}/matches")
async def travel_plan_matches(plan_id: str, user=Depends(get_current_user)):
    p = await db.travel_plans.find_one({"id": plan_id})
    if not p or p["userId"] != user["id"]:
        raise HTTPException(403, "Not your travel plan")
    return await _requests_matching(p["fromCountry"], p["toCountry"], exclude_buyer=user["id"])


@api_router.get("/inbox")
async def inbox(user=Depends(get_current_user)):
    plans = await db.travel_plans.find({"userId": user["id"], "status": "active"}).to_list(200)
    seen = set()
    out = []
    for p in plans:
        reqs = await _requests_matching(p["fromCountry"], p["toCountry"], exclude_buyer=user["id"])
        for r in reqs:
            if r["id"] in seen:
                continue
            seen.add(r["id"])
            r["matchedPlanId"] = p["id"]
            r["matchedRoute"] = f"{p['fromCountry']} → {p['toCountry']}"
            out.append(r)
    return out


# ---------------------------------------------------------------------------
# Orders / escrow
# ---------------------------------------------------------------------------
@api_router.post("/orders/accept")
async def accept_request(body: AcceptBody, user=Depends(get_current_user)):
    req = await db.requests.find_one({"id": body.requestId})
    if not req:
        raise HTTPException(404, "Request not found")
    if req["buyerId"] == user["id"]:
        raise HTTPException(400, "You cannot accept your own request")
    if req["status"] != "open":
        raise HTTPException(400, "Request is no longer open")
    existing = await db.orders.find_one({"requestId": body.requestId, "travelerId": user["id"],
                                         "status": {"$in": ["offered", "agreed", "funded", "purchased", "in_transit", "arrived"]}})
    if existing:
        raise HTTPException(400, "You already have an active offer on this request")
    stake = round(req["itemPrice"] * STAKE_PCT, 2)
    order = {
        "id": new_id(), "requestId": body.requestId, "buyerId": req["buyerId"], "travelerId": user["id"],
        "itemPrice": req["itemPrice"], "reward": req["reward"], "proposedFee": round(body.proposedFee, 2),
        "serviceFee": round(body.proposedFee, 2), "stake": stake,
        "platformFeePct": PLATFORM_FEE_PCT, "note": body.note,
        "status": "offered", "buyerFunded": False, "travelerStaked": False,
        "receiptUrl": None, "receiptHash": None, "qrHash": None, "platformFee": 0.0, "payout": 0.0,
        "timeline": [{"status": "offered", "at": now_iso()}], "createdAt": now_iso(),
    }
    await db.orders.insert_one(order)
    return await enrich_order(order)


@api_router.post("/orders/{order_id}/respond")
async def respond_offer(order_id: str, body: RespondBody, user=Depends(get_current_user)):
    o = await db.orders.find_one({"id": order_id})
    if not o:
        raise HTTPException(404, "Order not found")
    if o["buyerId"] != user["id"]:
        raise HTTPException(403, "Only the buyer can respond")
    if o["status"] != "offered":
        raise HTTPException(400, "Offer already handled")
    if body.action == "accept":
        await db.orders.update_one({"id": order_id}, {"$set": {"status": "agreed", "serviceFee": o["proposedFee"]},
                                    "$push": {"timeline": {"status": "agreed", "at": now_iso()}}})
        await db.requests.update_one({"id": o["requestId"]}, {"$set": {"status": "matched"}})
        await db.orders.update_many({"requestId": o["requestId"], "id": {"$ne": order_id}, "status": "offered"},
                                    {"$set": {"status": "rejected"}})
    else:
        await db.orders.update_one({"id": order_id}, {"$set": {"status": "rejected"}})
    fresh = await db.orders.find_one({"id": order_id})
    return await enrich_order(fresh)


async def _maybe_fund(order_id: str):
    o = await db.orders.find_one({"id": order_id})
    if o["buyerFunded"] and o["travelerStaked"] and o["status"] == "agreed":
        await db.orders.update_one({"id": order_id}, {"$set": {"status": "funded"},
                                   "$push": {"timeline": {"status": "funded", "at": now_iso()}}})


@api_router.post("/orders/{order_id}/stake")
async def stake_order(order_id: str, user=Depends(get_current_user)):
    o = await db.orders.find_one({"id": order_id})
    if not o:
        raise HTTPException(404, "Order not found")
    if o["travelerId"] != user["id"]:
        raise HTTPException(403, "Only the traveler can stake")
    if o["status"] != "agreed" or o["travelerStaked"]:
        raise HTTPException(400, "Cannot stake now")
    traveler = await db.users.find_one({"id": user["id"]})
    if traveler["usdcBalance"] < o["stake"]:
        raise HTTPException(400, "Insufficient USDC balance for collateral")
    await db.users.update_one({"id": user["id"]}, {"$inc": {"usdcBalance": -o["stake"], "lockedBalance": o["stake"]}})
    await db.orders.update_one({"id": order_id}, {"$set": {"travelerStaked": True}})
    await record_tx(user["id"], "stake_lock", -o["stake"], order_id, "Collateral staked in escrow")
    await _maybe_fund(order_id)
    fresh = await db.orders.find_one({"id": order_id})
    return await enrich_order(fresh)


@api_router.post("/orders/{order_id}/fund")
async def fund_order(order_id: str, user=Depends(get_current_user)):
    o = await db.orders.find_one({"id": order_id})
    if not o:
        raise HTTPException(404, "Order not found")
    if o["buyerId"] != user["id"]:
        raise HTTPException(403, "Only the buyer can fund escrow")
    if o["status"] != "agreed" or o["buyerFunded"]:
        raise HTTPException(400, "Cannot fund now")
    total = round(o["itemPrice"] + o["serviceFee"], 2)
    buyer = await db.users.find_one({"id": user["id"]})
    if buyer["usdcBalance"] < total:
        raise HTTPException(400, "Insufficient USDC balance to fund escrow")
    await db.users.update_one({"id": user["id"]}, {"$inc": {"usdcBalance": -total, "lockedBalance": total}})
    await db.orders.update_one({"id": order_id}, {"$set": {"buyerFunded": True}})
    await record_tx(user["id"], "escrow_lock", -total, order_id, "Payment locked in escrow")
    await _maybe_fund(order_id)
    fresh = await db.orders.find_one({"id": order_id})
    return await enrich_order(fresh)


@api_router.post("/orders/{order_id}/purchased")
async def mark_purchased(order_id: str, body: PurchasedBody, user=Depends(get_current_user)):
    o = await db.orders.find_one({"id": order_id})
    if not o:
        raise HTTPException(404, "Order not found")
    if o["travelerId"] != user["id"]:
        raise HTTPException(403, "Only the traveler can update this")
    if o["status"] != "funded":
        raise HTTPException(400, "Escrow must be funded first")
    receipt_hash = hashlib.sha256(body.receiptUrl.encode()).hexdigest()
    await db.orders.update_one({"id": order_id}, {"$set": {"status": "purchased", "receiptUrl": body.receiptUrl,
                               "receiptHash": receipt_hash},
                               "$push": {"timeline": {"status": "purchased", "at": now_iso()}}})
    fresh = await db.orders.find_one({"id": order_id})
    return await enrich_order(fresh)


@api_router.post("/orders/{order_id}/transit")
async def mark_transit(order_id: str, user=Depends(get_current_user)):
    o = await db.orders.find_one({"id": order_id})
    if not o or o["travelerId"] != user["id"]:
        raise HTTPException(403, "Only the traveler can update this")
    if o["status"] != "purchased":
        raise HTTPException(400, "Item must be purchased first")
    await db.orders.update_one({"id": order_id}, {"$set": {"status": "in_transit"},
                               "$push": {"timeline": {"status": "in_transit", "at": now_iso()}}})
    fresh = await db.orders.find_one({"id": order_id})
    return await enrich_order(fresh)


@api_router.post("/orders/{order_id}/arrived")
async def mark_arrived(order_id: str, user=Depends(get_current_user)):
    o = await db.orders.find_one({"id": order_id})
    if not o or o["travelerId"] != user["id"]:
        raise HTTPException(403, "Only the traveler can update this")
    if o["status"] != "in_transit":
        raise HTTPException(400, "Item must be in transit first")
    await db.orders.update_one({"id": order_id}, {"$set": {"status": "arrived"},
                               "$push": {"timeline": {"status": "arrived", "at": now_iso()}}})
    fresh = await db.orders.find_one({"id": order_id})
    return await enrich_order(fresh)


@api_router.post("/orders/{order_id}/qr")
async def generate_qr(order_id: str, user=Depends(get_current_user)):
    o = await db.orders.find_one({"id": order_id})
    if not o:
        raise HTTPException(404, "Order not found")
    if o["buyerId"] != user["id"]:
        raise HTTPException(403, "Only the buyer generates the handoff code")
    if o["status"] != "arrived":
        raise HTTPException(400, "Item must have arrived first")
    secret = pysecrets.token_hex(16)
    qr_hash = hashlib.sha256(secret.encode()).hexdigest()
    await db.orders.update_one({"id": order_id}, {"$set": {"qrHash": qr_hash}})
    payload = f"TRUSTMULE:{order_id}:{secret}"
    return {"secret": secret, "payload": payload}


async def _settle(order_id: str):
    o = await db.orders.find_one({"id": order_id})
    total = round(o["itemPrice"] + o["serviceFee"], 2)
    platform_fee = round(total * o["platformFeePct"], 2)
    payout = round(total - platform_fee, 2)
    await db.users.update_one({"id": o["buyerId"]}, {"$inc": {"lockedBalance": -total}})
    await db.users.update_one({"id": o["travelerId"]}, {"$inc": {"lockedBalance": -o["stake"],
                              "usdcBalance": o["stake"] + payout, "tripsCompleted": 1}})
    await db.users.update_one({"id": o["buyerId"]}, {"$inc": {"ordersCompleted": 1}})
    await record_tx(o["travelerId"], "escrow_release", payout, order_id, "Payout released from escrow")
    await record_tx(o["travelerId"], "stake_return", o["stake"], order_id, "Collateral returned")
    await record_tx(o["buyerId"], "platform_fee", -platform_fee, order_id, "Platform service fee")
    await db.orders.update_one({"id": order_id}, {"$set": {"status": "completed", "platformFee": platform_fee,
                               "payout": payout}, "$push": {"timeline": {"status": "completed", "at": now_iso()}}})
    await db.requests.update_one({"id": o["requestId"]}, {"$set": {"status": "completed"}})


@api_router.post("/orders/{order_id}/complete")
async def complete_delivery(order_id: str, body: CompleteBody, user=Depends(get_current_user)):
    o = await db.orders.find_one({"id": order_id})
    if not o:
        raise HTTPException(404, "Order not found")
    if o["travelerId"] != user["id"]:
        raise HTTPException(403, "Only the traveler completes the handoff by scanning")
    if o["status"] != "arrived":
        raise HTTPException(400, "Item must have arrived first")
    secret = body.secret
    if secret.startswith("TRUSTMULE:"):
        secret = secret.split(":")[-1]
    if not o.get("qrHash") or hashlib.sha256(secret.encode()).hexdigest() != o["qrHash"]:
        raise HTTPException(400, "Invalid handoff code")
    await _settle(order_id)
    fresh = await db.orders.find_one({"id": order_id})
    return await enrich_order(fresh)


@api_router.post("/orders/{order_id}/confirm")
async def buyer_confirm(order_id: str, user=Depends(get_current_user)):
    o = await db.orders.find_one({"id": order_id})
    if not o:
        raise HTTPException(404, "Order not found")
    if o["buyerId"] != user["id"]:
        raise HTTPException(403, "Only the buyer can confirm receipt")
    if o["status"] != "arrived":
        raise HTTPException(400, "Item must have arrived first")
    await _settle(order_id)
    fresh = await db.orders.find_one({"id": order_id})
    return await enrich_order(fresh)


@api_router.post("/orders/{order_id}/cancel")
async def cancel_order(order_id: str, user=Depends(get_current_user)):
    o = await db.orders.find_one({"id": order_id})
    if not o:
        raise HTTPException(404, "Order not found")
    if user["id"] not in (o["buyerId"], o["travelerId"]):
        raise HTTPException(403, "Not your order")
    if o["status"] in ("completed", "cancelled", "rejected"):
        raise HTTPException(400, "Cannot cancel now")
    if o["buyerFunded"]:
        total = round(o["itemPrice"] + o["serviceFee"], 2)
        await db.users.update_one({"id": o["buyerId"]}, {"$inc": {"lockedBalance": -total, "usdcBalance": total}})
        await record_tx(o["buyerId"], "escrow_refund", total, order_id, "Escrow refunded (cancelled)")
    if o["travelerStaked"]:
        if o["travelerId"] == user["id"] and o["status"] in ("funded", "purchased"):
            slash = round(o["stake"] * 0.5, 2)
            await db.users.update_one({"id": o["travelerId"]}, {"$inc": {"lockedBalance": -o["stake"], "usdcBalance": o["stake"] - slash}})
            await db.users.update_one({"id": o["buyerId"]}, {"$inc": {"usdcBalance": slash}})
            await record_tx(o["travelerId"], "stake_slash", -(slash), order_id, "Collateral partially slashed")
            await record_tx(o["buyerId"], "stake_comp", slash, order_id, "Compensation from traveler stake")
        else:
            await db.users.update_one({"id": o["travelerId"]}, {"$inc": {"lockedBalance": -o["stake"], "usdcBalance": o["stake"]}})
            await record_tx(o["travelerId"], "stake_return", o["stake"], order_id, "Collateral returned (cancelled)")
    await db.orders.update_one({"id": order_id}, {"$set": {"status": "cancelled"},
                               "$push": {"timeline": {"status": "cancelled", "at": now_iso()}}})
    await db.requests.update_one({"id": o["requestId"]}, {"$set": {"status": "open"}})
    fresh = await db.orders.find_one({"id": order_id})
    return await enrich_order(fresh)


@api_router.get("/orders/mine")
async def my_orders(user=Depends(get_current_user)):
    orders = await db.orders.find({"$or": [{"buyerId": user["id"]}, {"travelerId": user["id"]}]}).sort("createdAt", -1).to_list(200)
    return [await enrich_order(o) for o in orders]


@api_router.get("/orders/{order_id}")
async def get_order(order_id: str, user=Depends(get_current_user)):
    o = await db.orders.find_one({"id": order_id})
    if not o:
        raise HTTPException(404, "Order not found")
    if user["id"] not in (o["buyerId"], o["travelerId"]):
        raise HTTPException(403, "Not your order")
    return await enrich_order(o)


# ---------------------------------------------------------------------------
# Chat
# ---------------------------------------------------------------------------
@api_router.get("/orders/{order_id}/messages")
async def get_messages(order_id: str, user=Depends(get_current_user)):
    o = await db.orders.find_one({"id": order_id})
    if not o or user["id"] not in (o["buyerId"], o["travelerId"]):
        raise HTTPException(403, "Not your conversation")
    msgs = await db.messages.find({"orderId": order_id}).sort("createdAt", 1).to_list(1000)
    return [clean(m) for m in msgs]


@api_router.post("/orders/{order_id}/messages")
async def send_message(order_id: str, body: MessageBody, user=Depends(get_current_user)):
    o = await db.orders.find_one({"id": order_id})
    if not o or user["id"] not in (o["buyerId"], o["travelerId"]):
        raise HTTPException(403, "Not your conversation")
    doc = {"id": new_id(), "orderId": order_id, "senderId": user["id"], "text": body.text,
           "imageUrl": body.imageUrl, "createdAt": now_iso()}
    await db.messages.insert_one(doc)
    return clean(doc)


# ---------------------------------------------------------------------------
# Reviews
# ---------------------------------------------------------------------------
@api_router.post("/reviews")
async def create_review(body: ReviewBody, user=Depends(get_current_user)):
    o = await db.orders.find_one({"id": body.orderId})
    if not o or user["id"] not in (o["buyerId"], o["travelerId"]):
        raise HTTPException(403, "Not your order")
    if o["status"] != "completed":
        raise HTTPException(400, "Can only review completed orders")
    reviewee = o["travelerId"] if user["id"] == o["buyerId"] else o["buyerId"]
    existing = await db.reviews.find_one({"orderId": body.orderId, "reviewerId": user["id"]})
    if existing:
        raise HTTPException(400, "Already reviewed")
    rating = max(1, min(5, body.rating))
    doc = {"id": new_id(), "orderId": body.orderId, "reviewerId": user["id"], "revieweeId": reviewee,
           "rating": rating, "comment": body.comment, "createdAt": now_iso()}
    await db.reviews.insert_one(doc)
    all_revs = await db.reviews.find({"revieweeId": reviewee}).to_list(1000)
    avg = sum(r["rating"] for r in all_revs) / len(all_revs)
    await db.users.update_one({"id": reviewee}, {"$set": {"reputation": avg, "reviewsCount": len(all_revs)}})
    return clean(doc)


# ---------------------------------------------------------------------------
# Disputes
# ---------------------------------------------------------------------------
@api_router.post("/disputes")
async def create_dispute(body: DisputeBody, user=Depends(get_current_user)):
    o = await db.orders.find_one({"id": body.orderId})
    if not o or user["id"] not in (o["buyerId"], o["travelerId"]):
        raise HTTPException(403, "Not your order")
    doc = {"id": new_id(), "orderId": body.orderId, "raisedById": user["id"], "reason": body.reason,
           "evidence": body.evidence, "status": "open", "resolution": None, "createdAt": now_iso()}
    await db.disputes.insert_one(doc)
    await db.orders.update_one({"id": body.orderId}, {"$set": {"status": "disputed"},
                               "$push": {"timeline": {"status": "disputed", "at": now_iso()}}})
    return clean(doc)


@api_router.get("/disputes/mine")
async def my_disputes(user=Depends(get_current_user)):
    disp = await db.disputes.find({"raisedById": user["id"]}).sort("createdAt", -1).to_list(200)
    return [clean(d) for d in disp]


# ---------------------------------------------------------------------------
# Wallet
# ---------------------------------------------------------------------------
@api_router.get("/wallet")
async def wallet(user=Depends(get_current_user)):
    u = await db.users.find_one({"id": user["id"]})
    txs = await db.transactions.find({"userId": user["id"]}).sort("createdAt", -1).to_list(200)
    return {
        "balance": round(u.get("usdcBalance", 0.0), 2),
        "locked": round(u.get("lockedBalance", 0.0), 2),
        "walletAddress": u.get("walletAddress"),
        "transactions": [clean(t) for t in txs],
    }


@api_router.post("/wallet/deposit")
async def deposit(body: DepositBody, user=Depends(get_current_user)):
    amt = round(max(0.0, body.amount), 2)
    await db.users.update_one({"id": user["id"]}, {"$inc": {"usdcBalance": amt}})
    await record_tx(user["id"], "deposit", amt, None, "Test USDC deposit (faucet)")
    u = await db.users.find_one({"id": user["id"]})
    return {"balance": round(u.get("usdcBalance", 0.0), 2), "locked": round(u.get("lockedBalance", 0.0), 2)}


# ---------------------------------------------------------------------------
# Seed
# ---------------------------------------------------------------------------
SEED_REQUESTS = [
    {"title": "Le Labo Santal 33 EDP 100ml", "category": "Beauty", "itemPrice": 240, "reward": 45,
     "fromCountry": "Singapore", "toCountry": "India", "toCity": "Mumbai",
     "description": "Only available at the ION Orchard boutique. Please keep the receipt for customs."},
    {"title": "Sony WH-1000XM5 Headphones", "category": "Electronics", "itemPrice": 320, "reward": 60,
     "fromCountry": "Japan", "toCountry": "Australia", "toCity": "Sydney",
     "description": "Cheaper in Japan. Silver colour preferred, black is fine too."},
    {"title": "Nike Air Force 1 '07 (US 9)", "category": "Fashion", "itemPrice": 130, "reward": 30,
     "fromCountry": "United States", "toCountry": "United Kingdom", "toCity": "London",
     "description": "Triple white, size US 9. From any Nike store."},
    {"title": "Aesop Resurrection Hand Balm x3", "category": "Beauty", "itemPrice": 95, "reward": 25,
     "fromCountry": "France", "toCountry": "Singapore", "toCity": "Singapore",
     "description": "Three tubes please, gift wrapped if possible."},
]


@app.on_event("startup")
async def startup():
    try:
        await run_in_threadpool(init_storage)
        logger.info("Object storage initialised")
    except Exception as e:
        logger.warning(f"Object storage init failed: {e}")
    count = await db.requests.count_documents({})
    if count == 0:
        demo_buyers = [
            {"name": "Aisha Rahman", "email": "aisha.demo@trustmule.app", "rep": 4.9, "kyc": "verified", "reviews": 23},
            {"name": "Kenji Tanaka", "email": "kenji.demo@trustmule.app", "rep": 4.7, "kyc": "verified", "reviews": 15},
            {"name": "Sofia Alvarez", "email": "sofia.demo@trustmule.app", "rep": 5.0, "kyc": "verified", "reviews": 8},
        ]
        buyer_ids = []
        for b in demo_buyers:
            existing = await db.users.find_one({"email": b["email"]})
            if existing:
                buyer_ids.append(existing["id"])
                continue
            uid = new_id()
            await db.users.insert_one({
                "id": uid, "name": b["name"], "email": b["email"], "avatar": None, "bio": "",
                "walletAddress": gen_wallet_address(), "kycStatus": b["kyc"], "reputation": b["rep"],
                "reviewsCount": b["reviews"], "ordersCompleted": b["reviews"], "tripsCompleted": 3,
                "usdcBalance": 5000.0, "lockedBalance": 0.0, "token": new_id(), "createdAt": now_iso(),
            })
            buyer_ids.append(uid)
        for i, r in enumerate(SEED_REQUESTS):
            await db.requests.insert_one({
                "id": new_id(), "buyerId": buyer_ids[i % len(buyer_ids)], "title": r["title"],
                "description": r["description"], "category": r["category"],
                "image": CATEGORY_IMAGES.get(r["category"], CATEGORY_IMAGES["Other"]),
                "itemPrice": float(r["itemPrice"]), "maxItemPrice": float(r["itemPrice"]) * 1.05,
                "reward": float(r["reward"]), "fromCountry": r["fromCountry"], "toCountry": r["toCountry"],
                "toCity": r["toCity"], "deadline": None, "status": "open", "createdAt": now_iso(), "deletedAt": None,
            })
        logger.info("Seeded demo requests")


app.include_router(api_router)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
