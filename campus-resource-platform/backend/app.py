import json
import os
import uuid
from datetime import datetime
from pathlib import Path

import mysql.connector
from dotenv import load_dotenv
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from mysql.connector import pooling
from werkzeug.security import check_password_hash, generate_password_hash
from werkzeug.utils import secure_filename

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
ALLOWED_EXTENSIONS = {"pdf", "png", "jpg", "jpeg", "doc", "docx"}

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}, r"/uploads/*": {"origins": "*"}})

pool = pooling.MySQLConnectionPool(
    pool_name="campushub_pool",
    pool_size=8,
    host=os.getenv("DB_HOST", "localhost"),
    port=int(os.getenv("DB_PORT", "3306")),
    user=os.getenv("DB_USER", "root"),
    password=os.getenv("DB_PASSWORD", ""),
    database=os.getenv("DB_NAME", "campushub"),
    autocommit=False,
)


def now_iso() -> datetime:
    return datetime.utcnow()


def get_conn():
    return pool.get_connection()


def user_row_to_dict(row: dict) -> dict:
    return {
        "id": row["id"],
        "email": row["email"],
        "college_name": row["college_name"],
        "username": row["username"],
        "fullName": row["full_name"],
        "profilePicture": row["profile_picture"] or "",
        "branch": row["branch"],
        "semester": int(row["semester"] or 1),
        "bio": row["bio"] or "",
        "recognitionPoints": int(row["recognition_points"] or 0),
        "resourcesUploaded": int(row["resources_uploaded"] or 0),
        "resourcesDownloaded": int(row["resources_downloaded"] or 0),
        "createdAt": row["created_at"].isoformat() if row["created_at"] else datetime.utcnow().isoformat(),
        "updatedAt": row["updated_at"].isoformat() if row["updated_at"] else datetime.utcnow().isoformat(),
    }


def resource_row_to_dict(row: dict) -> dict:
    return {
        "id": row["id"],
        "title": row["title"],
        "description": row["description"],
        "subject": row["subject"],
        "semester": int(row["semester"]),
        "branch": row["branch"],
        "fileUrl": row["file_url"],
        "fileName": row["file_name"],
        "uploadedBy": row["uploaded_by"],
        "uploaderCollege": row["uploader_college"],
        "privacyStatus": row["privacy_status"],
        "createdAt": row["created_at"].isoformat() if row["created_at"] else datetime.utcnow().isoformat(),
        "updatedAt": row["updated_at"].isoformat() if row["updated_at"] else datetime.utcnow().isoformat(),
        "downloads": int(row["downloads"] or 0),
        "tags": json.loads(row["tags"] or "[]"),
        "fileType": row["file_type"],
        "size": int(row["size"] or 0),
    }


def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@app.get("/api/health")
def health():
    return jsonify({"ok": True})


@app.get("/uploads/<path:filename>")
def serve_upload(filename: str):
    return send_from_directory(UPLOAD_DIR, filename, as_attachment=False)


@app.post("/api/auth/register")
def register():
    body = request.get_json(force=True) or {}
    email = (body.get("email") or "").strip().lower()
    password = body.get("password") or ""
    user_data = body.get("userData") or {}
    if not email or not password:
        return jsonify({"message": "Email and password are required"}), 400

    conn = get_conn()
    cur = conn.cursor(dictionary=True)
    try:
        cur.execute("SELECT id FROM users WHERE email = %s", (email,))
        if cur.fetchone():
            return jsonify({"message": "Email already exists"}), 409

        user_id = str(uuid.uuid4())
        now = now_iso()
        cur.execute(
            """
            INSERT INTO users (
                id, email, password_hash, college_name, username, full_name,
                profile_picture, branch, semester, bio, recognition_points,
                resources_uploaded, resources_downloaded, created_at, updated_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                user_id,
                email,
                generate_password_hash(password),
                user_data.get("college_name", ""),
                user_data.get("username", ""),
                user_data.get("fullName", ""),
                user_data.get("profilePicture", ""),
                user_data.get("branch", ""),
                int(user_data.get("semester", 1)),
                user_data.get("bio", ""),
                0,
                0,
                0,
                now,
                now,
            ),
        )
        conn.commit()
        cur.execute("SELECT * FROM users WHERE id = %s", (user_id,))
        user = cur.fetchone()
        return jsonify({"userId": user_id, "user": user_row_to_dict(user)})
    finally:
        cur.close()
        conn.close()


@app.post("/api/auth/login")
def login():
    body = request.get_json(force=True) or {}
    email = (body.get("email") or "").strip().lower()
    password = body.get("password") or ""

    conn = get_conn()
    cur = conn.cursor(dictionary=True)
    try:
        cur.execute("SELECT * FROM users WHERE email = %s", (email,))
        user = cur.fetchone()
        if not user or not check_password_hash(user["password_hash"], password):
            return jsonify({"message": "Invalid email or password"}), 401
        return jsonify({"userId": user["id"], "user": user_row_to_dict(user)})
    finally:
        cur.close()
        conn.close()


@app.get("/api/auth/me/<user_id>")
def me(user_id: str):
    conn = get_conn()
    cur = conn.cursor(dictionary=True)
    try:
        cur.execute("SELECT * FROM users WHERE id = %s", (user_id,))
        user = cur.fetchone()
        if not user:
            return jsonify({"message": "User not found"}), 404
        return jsonify(user_row_to_dict(user))
    finally:
        cur.close()
        conn.close()


@app.put("/api/users/<user_id>")
def update_user(user_id: str):
    updates = request.get_json(force=True) or {}
    conn = get_conn()
    cur = conn.cursor(dictionary=True)
    try:
        cur.execute("SELECT * FROM users WHERE id = %s", (user_id,))
        user = cur.fetchone()
        if not user:
            return jsonify({"message": "User not found"}), 404

        cur.execute(
            """
            UPDATE users SET
                full_name=%s,
                profile_picture=%s,
                branch=%s,
                semester=%s,
                bio=%s,
                college_name=%s,
                username=%s,
                updated_at=%s
            WHERE id=%s
            """,
            (
                updates.get("fullName", user["full_name"]),
                updates.get("profilePicture", user["profile_picture"]),
                updates.get("branch", user["branch"]),
                int(updates.get("semester", user["semester"])),
                updates.get("bio", user["bio"]),
                updates.get("college_name", user["college_name"]),
                updates.get("username", user["username"]),
                now_iso(),
                user_id,
            ),
        )
        conn.commit()
        cur.execute("SELECT * FROM users WHERE id = %s", (user_id,))
        return jsonify(user_row_to_dict(cur.fetchone()))
    finally:
        cur.close()
        conn.close()


@app.patch("/api/users/<user_id>/recognition")
def increment_recognition(user_id: str):
    points = int((request.get_json(force=True) or {}).get("points", 0))
    conn = get_conn()
    cur = conn.cursor(dictionary=True)
    try:
        cur.execute(
            "UPDATE users SET recognition_points = recognition_points + %s, updated_at=%s WHERE id=%s",
            (points, now_iso(), user_id),
        )
        conn.commit()
        cur.execute("SELECT * FROM users WHERE id = %s", (user_id,))
        user = cur.fetchone()
        if not user:
            return jsonify({"message": "User not found"}), 404
        return jsonify(user_row_to_dict(user))
    finally:
        cur.close()
        conn.close()


@app.get("/api/resources/public")
def list_public_resources():
    conn = get_conn()
    cur = conn.cursor(dictionary=True)
    try:
        cur.execute("SELECT * FROM resources WHERE privacy_status='Public' ORDER BY created_at DESC")
        rows = cur.fetchall()
        return jsonify([resource_row_to_dict(row) for row in rows])
    finally:
        cur.close()
        conn.close()


@app.get("/api/resources/search")
def search_resources():
    subject = request.args.get("subject", "").strip()
    semester = request.args.get("semester", "").strip()
    branch = request.args.get("branch", "").strip()
    search_term = request.args.get("searchTerm", "").strip().lower()

    query = "SELECT * FROM resources WHERE privacy_status='Public'"
    params = []
    if subject:
        query += " AND subject=%s"
        params.append(subject)
    if semester:
        query += " AND semester=%s"
        params.append(int(semester))
    if branch:
        query += " AND branch=%s"
        params.append(branch)
    query += " ORDER BY created_at DESC"

    conn = get_conn()
    cur = conn.cursor(dictionary=True)
    try:
        cur.execute(query, tuple(params))
        resources = [resource_row_to_dict(row) for row in cur.fetchall()]
        if search_term:
            resources = [
                r for r in resources
                if search_term in r["title"].lower()
                or search_term in r["description"].lower()
                or any(search_term in tag.lower() for tag in r["tags"])
            ]
        return jsonify(resources)
    finally:
        cur.close()
        conn.close()


@app.get("/api/resources/<resource_id>")
def get_resource(resource_id: str):
    user_college = request.args.get("userCollegeName", "").strip()
    conn = get_conn()
    cur = conn.cursor(dictionary=True)
    try:
        cur.execute("SELECT * FROM resources WHERE id=%s", (resource_id,))
        row = cur.fetchone()
        if not row:
            return jsonify({"message": "Resource not found"}), 404
        resource = resource_row_to_dict(row)
        if resource["privacyStatus"] == "Private" and user_college != resource["uploaderCollege"]:
            return jsonify({"message": "Access denied: Resource is private and available only to your college"}), 403
        return jsonify(resource)
    finally:
        cur.close()
        conn.close()


@app.post("/api/resources")
def create_resource():
    body = request.get_json(force=True) or {}
    resource_id = str(uuid.uuid4())
    tags = json.dumps(body.get("tags", []))
    now = now_iso()

    conn = get_conn()
    cur = conn.cursor(dictionary=True)
    try:
        cur.execute(
            """
            INSERT INTO resources (
                id, title, description, subject, semester, branch, file_url, file_name, uploaded_by,
                uploader_college, privacy_status, created_at, updated_at, downloads, tags, file_type, size
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                resource_id,
                body.get("title", ""),
                body.get("description", ""),
                body.get("subject", ""),
                int(body.get("semester", 0)),
                body.get("branch", ""),
                body.get("fileUrl", ""),
                body.get("fileName", ""),
                body.get("uploadedBy", ""),
                body.get("uploaderCollege", ""),
                body.get("privacyStatus", "Public"),
                now,
                now,
                int(body.get("downloads", 0)),
                tags,
                body.get("fileType", "Document"),
                int(body.get("size", 0)),
            ),
        )
        cur.execute(
            "UPDATE users SET resources_uploaded = resources_uploaded + 1, updated_at = %s WHERE full_name = %s",
            (now, body.get("uploadedBy", "")),
        )
        conn.commit()
        return jsonify({"id": resource_id})
    finally:
        cur.close()
        conn.close()


@app.put("/api/resources/<resource_id>")
def update_resource(resource_id: str):
    updates = request.get_json(force=True) or {}
    conn = get_conn()
    cur = conn.cursor(dictionary=True)
    try:
        cur.execute("SELECT * FROM resources WHERE id=%s", (resource_id,))
        current = cur.fetchone()
        if not current:
            return jsonify({"message": "Resource not found"}), 404

        merged = resource_row_to_dict(current)
        merged.update(updates)
        cur.execute(
            """
            UPDATE resources SET
                title=%s, description=%s, subject=%s, semester=%s, branch=%s,
                privacy_status=%s, tags=%s, updated_at=%s
            WHERE id=%s
            """,
            (
                merged["title"],
                merged["description"],
                merged["subject"],
                int(merged["semester"]),
                merged["branch"],
                merged["privacyStatus"],
                json.dumps(merged.get("tags", [])),
                now_iso(),
                resource_id,
            ),
        )
        conn.commit()
        return jsonify({"ok": True})
    finally:
        cur.close()
        conn.close()


@app.delete("/api/resources/<resource_id>")
def delete_resource(resource_id: str):
    conn = get_conn()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM resources WHERE id=%s", (resource_id,))
        conn.commit()
        return jsonify({"ok": True})
    finally:
        cur.close()
        conn.close()


@app.get("/api/resources/user/<path:uploaded_by>")
def resources_by_user(uploaded_by: str):
    conn = get_conn()
    cur = conn.cursor(dictionary=True)
    try:
        cur.execute("SELECT * FROM resources WHERE uploaded_by=%s ORDER BY created_at DESC", (uploaded_by,))
        rows = cur.fetchall()
        return jsonify([resource_row_to_dict(row) for row in rows])
    finally:
        cur.close()
        conn.close()


@app.post("/api/resources/<resource_id>/increment-download")
def increment_download(resource_id: str):
    conn = get_conn()
    cur = conn.cursor(dictionary=True)
    try:
        cur.execute("SELECT uploaded_by FROM resources WHERE id=%s", (resource_id,))
        row = cur.fetchone()
        if not row:
            return jsonify({"message": "Resource not found"}), 404
        now = now_iso()
        cur.execute("UPDATE resources SET downloads = downloads + 1, updated_at=%s WHERE id=%s", (now, resource_id))
        cur.execute(
            "UPDATE users SET resources_downloaded = resources_downloaded + 1, updated_at=%s WHERE full_name=%s",
            (now, row["uploaded_by"]),
        )
        conn.commit()
        return jsonify({"ok": True})
    finally:
        cur.close()
        conn.close()


@app.post("/api/files/upload")
def upload_file():
    if "file" not in request.files:
        return jsonify({"message": "No file provided"}), 400
    file = request.files["file"]
    if not file.filename:
        return jsonify({"message": "Empty filename"}), 400
    if not allowed_file(file.filename):
        return jsonify({"message": "File type not allowed"}), 400

    resource_id = request.form.get("resourceId", "general")
    safe_name = secure_filename(file.filename)
    unique_name = f"{resource_id}_{uuid.uuid4().hex}_{safe_name}"
    file_path = UPLOAD_DIR / unique_name
    file.save(file_path)
    file_url = f"http://localhost:5000/uploads/{unique_name}"
    return jsonify({"fileUrl": file_url})


@app.delete("/api/files")
def delete_file():
    body = request.get_json(force=True) or {}
    file_url = body.get("fileUrl", "")
    filename = file_url.split("/uploads/")[-1] if "/uploads/" in file_url else ""
    if not filename:
        return jsonify({"message": "Invalid file URL"}), 400
    target = UPLOAD_DIR / filename
    if target.exists():
        target.unlink()
    return jsonify({"ok": True})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
