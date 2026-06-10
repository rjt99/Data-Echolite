import sqlite3
import json
from datetime import datetime
from config import SQLITE_DB_PATH


def get_connection():
    conn = sqlite3.connect(SQLITE_DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def init_db():
    conn = get_connection()
    c = conn.cursor()
    c.executescript("""
        CREATE TABLE IF NOT EXISTS jobs (
            id TEXT PRIMARY KEY,
            status TEXT DEFAULT 'pending',
            created_at TEXT,
            updated_at TEXT,
            file_count INTEGER DEFAULT 0,
            error TEXT
        );

        CREATE TABLE IF NOT EXISTS documents (
            id TEXT PRIMARY KEY,
            job_id TEXT,
            filename TEXT,
            file_type TEXT,
            file_path TEXT,
            page_count INTEGER DEFAULT 0,
            has_images INTEGER DEFAULT 0,
            has_tables INTEGER DEFAULT 0,
            has_video INTEGER DEFAULT 0,
            created_at TEXT,
            FOREIGN KEY (job_id) REFERENCES jobs(id)
        );

        CREATE TABLE IF NOT EXISTS chunks (
            id TEXT PRIMARY KEY,
            doc_id TEXT,
            job_id TEXT,
            content TEXT,
            chunk_type TEXT,
            page_number INTEGER,
            metadata TEXT,
            embedding_id TEXT,
            created_at TEXT,
            FOREIGN KEY (doc_id) REFERENCES documents(id)
        );

        CREATE TABLE IF NOT EXISTS entities (
            id TEXT PRIMARY KEY,
            job_id TEXT,
            canonical_name TEXT,
            entity_type TEXT,
            aliases TEXT,
            source_docs TEXT,
            created_at TEXT
        );

        CREATE TABLE IF NOT EXISTS facts (
            id TEXT PRIMARY KEY,
            job_id TEXT,
            subject TEXT,
            attribute TEXT,
            value TEXT,
            date_ref TEXT,
            source_doc TEXT,
            source_chunk TEXT,
            confidence REAL DEFAULT 1.0,
            created_at TEXT
        );

        CREATE TABLE IF NOT EXISTS conflicts (
            id TEXT PRIMARY KEY,
            job_id TEXT,
            fact_a_id TEXT,
            fact_b_id TEXT,
            conflict_type TEXT,
            description TEXT,
            resolution TEXT,
            confidence REAL,
            created_at TEXT
        );

        CREATE TABLE IF NOT EXISTS insights (
            id TEXT PRIMARY KEY,
            job_id TEXT,
            insight_type TEXT,
            title TEXT,
            description TEXT,
            evidence TEXT,
            confidence REAL,
            recommended_action TEXT,
            created_at TEXT
        );

        CREATE TABLE IF NOT EXISTS graph_edges (
            id TEXT PRIMARY KEY,
            job_id TEXT,
            source_entity TEXT,
            target_entity TEXT,
            relationship TEXT,
            weight REAL DEFAULT 1.0,
            source_doc TEXT,
            created_at TEXT
        );

        CREATE TABLE IF NOT EXISTS reports (
            id TEXT PRIMARY KEY,
            job_id TEXT,
            executive_summary TEXT,
            sections TEXT,
            chart_data TEXT,
            created_at TEXT
        );
    """)
    conn.commit()
    conn.close()


def create_job(job_id: str, file_count: int) -> dict:
    conn = get_connection()
    now = datetime.utcnow().isoformat()
    conn.execute(
        "INSERT INTO jobs (id, status, created_at, updated_at, file_count) VALUES (?, ?, ?, ?, ?)",
        (job_id, "running", now, now, file_count)
    )
    conn.commit()
    conn.close()
    return {"id": job_id, "status": "running", "created_at": now}


def update_job_status(job_id: str, status: str, error: str = None):
    conn = get_connection()
    conn.execute(
        "UPDATE jobs SET status=?, updated_at=?, error=? WHERE id=?",
        (status, datetime.utcnow().isoformat(), error, job_id)
    )
    conn.commit()
    conn.close()


def save_document(doc: dict):
    conn = get_connection()
    conn.execute(
        """INSERT OR REPLACE INTO documents
           (id, job_id, filename, file_type, file_path, page_count, has_images, has_tables, has_video, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (doc["id"], doc["job_id"], doc["filename"], doc["file_type"],
         doc["file_path"], doc.get("page_count", 0),
         int(doc.get("has_images", False)),
         int(doc.get("has_tables", False)),
         int(doc.get("has_video", False)),
         datetime.utcnow().isoformat())
    )
    conn.commit()
    conn.close()


def save_entity(entity: dict):
    conn = get_connection()
    conn.execute(
        """INSERT OR REPLACE INTO entities
           (id, job_id, canonical_name, entity_type, aliases, source_docs, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        (entity["id"], entity["job_id"], entity["canonical_name"],
         entity["entity_type"],
         json.dumps(entity.get("aliases", [])),
         json.dumps(entity.get("source_docs", [])),
         datetime.utcnow().isoformat())
    )
    conn.commit()
    conn.close()


def save_fact(fact: dict):
    conn = get_connection()
    conn.execute(
        """INSERT OR REPLACE INTO facts
           (id, job_id, subject, attribute, value, date_ref, source_doc, source_chunk, confidence, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (fact["id"], fact["job_id"], fact["subject"], fact["attribute"],
         fact["value"], fact.get("date_ref"), fact.get("source_doc"),
         fact.get("source_chunk"), fact.get("confidence", 1.0),
         datetime.utcnow().isoformat())
    )
    conn.commit()
    conn.close()


def save_conflict(conflict: dict):
    conn = get_connection()
    conn.execute(
        """INSERT OR REPLACE INTO conflicts
           (id, job_id, fact_a_id, fact_b_id, conflict_type, description, resolution, confidence, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (conflict["id"], conflict["job_id"], conflict.get("fact_a_id"),
         conflict.get("fact_b_id"), conflict["conflict_type"],
         conflict["description"], conflict.get("resolution"),
         conflict.get("confidence", 0.8),
         datetime.utcnow().isoformat())
    )
    conn.commit()
    conn.close()


def save_insight(insight: dict):
    conn = get_connection()
    conn.execute(
        """INSERT OR REPLACE INTO insights
           (id, job_id, insight_type, title, description, evidence, confidence, recommended_action, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (insight["id"], insight["job_id"], insight["insight_type"],
         insight["title"], insight["description"],
         json.dumps(insight.get("evidence", [])),
         insight.get("confidence", 0.8),
         insight.get("recommended_action", ""),
         datetime.utcnow().isoformat())
    )
    conn.commit()
    conn.close()


def get_job_results(job_id: str) -> dict:
    conn = get_connection()
    job = conn.execute("SELECT * FROM jobs WHERE id=?", (job_id,)).fetchone()
    docs = conn.execute("SELECT * FROM documents WHERE job_id=?", (job_id,)).fetchall()
    entities = conn.execute("SELECT * FROM entities WHERE job_id=?", (job_id,)).fetchall()
    facts = conn.execute("SELECT * FROM facts WHERE job_id=?", (job_id,)).fetchall()
    conflicts = conn.execute("SELECT * FROM conflicts WHERE job_id=?", (job_id,)).fetchall()
    insights = conn.execute("SELECT * FROM insights WHERE job_id=?", (job_id,)).fetchall()
    graph_edges = conn.execute("SELECT * FROM graph_edges WHERE job_id=?", (job_id,)).fetchall()
    report = conn.execute("SELECT * FROM reports WHERE job_id=?", (job_id,)).fetchone()
    conn.close()
    return {
        "job": dict(job) if job else None,
        "documents": [dict(d) for d in docs],
        "entities": [dict(e) for e in entities],
        "facts": [dict(f) for f in facts],
        "conflicts": [dict(c) for c in conflicts],
        "insights": [dict(i) for i in insights],
        "graph_edges": [dict(e) for e in graph_edges],
        "report": dict(report) if report else None,
    }


def get_all_jobs():
    conn = get_connection()
    jobs = conn.execute("SELECT * FROM jobs ORDER BY created_at DESC LIMIT 50").fetchall()
    conn.close()
    return [dict(j) for j in jobs]
