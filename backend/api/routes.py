import os
import uuid
import json
from flask import Blueprint, request, jsonify, Response, stream_with_context
from werkzeug.utils import secure_filename
from models.database import create_job, get_job_results, get_all_jobs, get_connection
from agents.orchestrator import Orchestrator
from agents.query_agent import QueryAgent
from services.streaming import event_bus
from config import UPLOAD_FOLDER, ALLOWED_EXTENSIONS

bp = Blueprint("api", __name__, url_prefix="/api")


def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@bp.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "clarity-from-chaos"})


@bp.route("/upload", methods=["POST"])
def upload_files():
    """Upload files, start the pipeline, return job_id immediately."""
    if "files" not in request.files:
        return jsonify({"error": "No files provided"}), 400

    files = request.files.getlist("files")
    if not files or all(f.filename == "" for f in files):
        return jsonify({"error": "No files selected"}), 400

    job_id = str(uuid.uuid4())
    job_dir = os.path.join(UPLOAD_FOLDER, job_id)
    os.makedirs(job_dir, exist_ok=True)

    saved_paths = []
    saved_names = []
    for f in files:
        if f and allowed_file(f.filename):
            filename = secure_filename(f.filename)
            path = os.path.join(job_dir, filename)
            f.save(path)
            saved_paths.append(path)
            saved_names.append(filename)

    if not saved_paths:
        return jsonify({"error": "No valid files uploaded"}), 400

    create_job(job_id, len(saved_paths))

    # Subscribe BEFORE starting the pipeline so no events are missed
    event_bus.subscribe(job_id)
    Orchestrator(job_id).run_async(saved_paths)

    return jsonify({
        "job_id": job_id,
        "files": saved_names,
        "file_count": len(saved_paths),
        "message": f"Processing {len(saved_paths)} file(s)."
    }), 202


@bp.route("/stream/<job_id>", methods=["GET"])
def stream_events(job_id: str):
    """SSE endpoint. Safe to call multiple times — history is replayed on reconnect."""
    def generate():
        # subscribe() replays history + adds sentinel if job is already done
        event_bus.subscribe(job_id)
        try:
            yield from event_bus.stream(job_id)
        finally:
            event_bus.cleanup(job_id)

    return Response(
        stream_with_context(generate()),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        }
    )


@bp.route("/jobs", methods=["GET"])
def list_jobs():
    return jsonify(get_all_jobs())


@bp.route("/jobs/<job_id>", methods=["GET"])
def get_job(job_id: str):
    results = get_job_results(job_id)
    if not results["job"]:
        return jsonify({"error": "Job not found"}), 404
    return jsonify(results)


@bp.route("/jobs/<job_id>/status", methods=["GET"])
def get_job_status(job_id: str):
    """Lightweight status check — used by frontend to poll when SSE is unavailable."""
    conn = get_connection()
    row = conn.execute("SELECT id, status, error, file_count, created_at, updated_at FROM jobs WHERE id=?", (job_id,)).fetchone()
    conn.close()
    if not row:
        return jsonify({"error": "Job not found"}), 404
    return jsonify(dict(row))


@bp.route("/jobs/<job_id>/insights", methods=["GET"])
def get_insights(job_id: str):
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM insights WHERE job_id=? ORDER BY confidence DESC", (job_id,)
    ).fetchall()
    conn.close()
    result = []
    for r in rows:
        d = dict(r)
        # evidence is stored as JSON string
        try:
            d["evidence"] = json.loads(d.get("evidence") or "[]")
        except (json.JSONDecodeError, TypeError):
            d["evidence"] = []
        result.append(d)
    return jsonify(result)


@bp.route("/jobs/<job_id>/report", methods=["GET"])
def get_report(job_id: str):
    conn = get_connection()
    report = conn.execute("SELECT * FROM reports WHERE job_id=?", (job_id,)).fetchone()
    conn.close()
    if not report:
        return jsonify({"error": "Report not ready yet"}), 404
    r = dict(report)
    try:
        r["sections"] = json.loads(r.get("sections") or "[]")
    except (json.JSONDecodeError, TypeError):
        r["sections"] = []
    try:
        r["chart_data"] = json.loads(r.get("chart_data") or "{}")
    except (json.JSONDecodeError, TypeError):
        r["chart_data"] = {}
    return jsonify(r)


@bp.route("/jobs/<job_id>/graph", methods=["GET"])
def get_graph(job_id: str):
    conn = get_connection()
    edges = conn.execute("SELECT * FROM graph_edges WHERE job_id=?", (job_id,)).fetchall()
    entities = conn.execute("SELECT * FROM entities WHERE job_id=?", (job_id,)).fetchall()
    conn.close()

    nodes = [
        {
            "id": e["canonical_name"],
            "label": e["canonical_name"][:25],
            "type": e["entity_type"]
        }
        for e in entities
    ]
    links = [
        {
            "source": e["source_entity"],
            "target": e["target_entity"],
            "relationship": e["relationship"],
            "weight": e["weight"]
        }
        for e in edges
    ]
    return jsonify({"nodes": nodes, "links": links})


@bp.route("/jobs/<job_id>/conflicts", methods=["GET"])
def get_conflicts(job_id: str):
    conn = get_connection()
    rows = conn.execute("SELECT * FROM conflicts WHERE job_id=?", (job_id,)).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


@bp.route("/jobs/<job_id>/entities", methods=["GET"])
def get_entities(job_id: str):
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM entities WHERE job_id=? ORDER BY entity_type", (job_id,)
    ).fetchall()
    conn.close()
    result = []
    for e in rows:
        d = dict(e)
        try:
            d["aliases"] = json.loads(d.get("aliases") or "[]")
        except (json.JSONDecodeError, TypeError):
            d["aliases"] = []
        try:
            d["source_docs"] = json.loads(d.get("source_docs") or "[]")
        except (json.JSONDecodeError, TypeError):
            d["source_docs"] = []
        result.append(d)
    return jsonify(result)


@bp.route("/jobs/<job_id>/facts", methods=["GET"])
def get_facts(job_id: str):
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM facts WHERE job_id=? ORDER BY confidence DESC", (job_id,)
    ).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


@bp.route("/query", methods=["POST"])
def query():
    """Natural language query against a job's indexed documents via RAG."""
    body = request.get_json()
    if not body or "query" not in body or "job_id" not in body:
        return jsonify({"error": "Provide 'query' and 'job_id'"}), 400

    agent = QueryAgent(body["job_id"])
    result = agent.run({"query": body["query"], "job_id": body["job_id"]})
    return jsonify({
        "answer": result.get("answer", ""),
        "sources": result.get("sources", [])
    })
