"""Public event and registration API backed by Supabase."""

import os

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from postgrest import APIError
from supabase import Client, create_client

load_dotenv()

app = Flask(__name__)

supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_PUBLISHABLE_KEY")
if not supabase_url or not supabase_key:
    raise RuntimeError("Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in the environment.")

supabase: Client = create_client(supabase_url, supabase_key)


@app.after_request
def add_cors_headers(response):
    """Allow browser clients hosted on any origin to call this public API."""
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    return response


@app.errorhandler(APIError)
def handle_database_error(error):
    # Avoid returning database internals or credentials in API responses.
    return jsonify(error="Database request failed", details=getattr(error, "message", str(error))), 500


@app.get("/")
def index():
    return jsonify(message="Events API", endpoints=[
        "GET /api/events",
        "GET /api/events/<id>",
        "GET /api/users?role=student|admin|organizer",
        "POST /api/registrations",
        "GET /api/me/registrations?user_id=<uuid>",
        "GET /api/events/<id>/registrations",
    ])


@app.get("/api/events")
def list_events():
    response = supabase.table("events").select("id,organizer_id,title,capacity,status").execute()
    return jsonify(response.data)


@app.get("/api/users")
def list_users():
    """List public user IDs for a selected role; this route has no auth checks."""
    role = (request.args.get("role") or "").strip().lower()
    role_values = {
        "student": ["student", "students"],
        "admin": ["admin", "administrator"],
        "organizer": ["organizer", "organiser"],
    }
    if role not in role_values:
        return jsonify(error="role must be student, admin, or organizer"), 400

    response = (
        supabase.table("users")
        .select("id,email,role")
        .in_("role", role_values[role])
        .order("email")
        .execute()
    )
    return jsonify(response.data)


@app.get("/api/events/<event_id>")
def get_event(event_id):
    response = (
        supabase.table("events")
        .select("id,organizer_id,title,capacity,status")
        .eq("id", event_id)
        .maybe_single()
        .execute()
    )
    if response.data is None:
        return jsonify(error="Event not found"), 404
    return jsonify(response.data)


@app.post("/api/registrations")
def create_registration():
    body = request.get_json(silent=True)
    if not isinstance(body, dict):
        return jsonify(error="Request body must be a JSON object"), 400

    user_id = body.get("user_id")
    event_id = body.get("event_id")
    if not user_id or not event_id:
        return jsonify(error="user_id and event_id are required"), 400

    event_response = (
        supabase.table("events")
        .select("id,capacity")
        .eq("id", event_id)
        .maybe_single()
        .execute()
    )
    event = event_response.data
    if event is None:
        return jsonify(error="Event not found"), 404

    existing = (
        supabase.table("registrations")
        .select("id")
        .eq("user_id", user_id)
        .eq("event_id", event_id)
        .limit(1)
        .execute()
    )
    if existing.data:
        return jsonify(error="User is already registered for this event"), 409

    registrations = (
        supabase.table("registrations")
        .select("id", count="exact")
        .eq("event_id", event_id)
        .execute()
    )
    if event.get("capacity") is not None and (registrations.count or 0) >= event["capacity"]:
        return jsonify(error="Event is at capacity"), 409

    created = (
        supabase.table("registrations")
        .insert({"user_id": user_id, "event_id": event_id})
        .execute()
    )
    return jsonify(created.data[0] if created.data else {"user_id": user_id, "event_id": event_id}), 201


@app.get("/api/me/registrations")
def my_registrations():
    # There is intentionally no identity verification per request; callers choose the user_id.
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify(error="user_id query parameter is required"), 400

    response = (
        supabase.table("registrations")
        .select("id,user_id,event_id,created_at,events(id,title,capacity,status)")
        .eq("user_id", user_id)
        .execute()
    )
    return jsonify(response.data)


@app.get("/api/events/<event_id>/registrations")
def event_registrations(event_id):
    # Public because authorization is explicitly disabled for this API.
    event = supabase.table("events").select("id").eq("id", event_id).maybe_single().execute()
    if event.data is None:
        return jsonify(error="Event not found"), 404

    response = (
        supabase.table("registrations")
        .select("id,user_id,event_id,created_at,users(id,email,role)")
        .eq("event_id", event_id)
        .execute()
    )
    return jsonify(response.data)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "5000")), debug=False)
