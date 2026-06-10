import json
import queue
import threading
from datetime import datetime


class StreamEvent:
    def __init__(self, agent: str, event_type: str, content: str, data: dict = None):
        self.agent = agent
        self.event_type = event_type
        self.content = content
        self.data = data or {}
        self.timestamp = datetime.utcnow().isoformat()

    def to_sse(self) -> str:
        payload = {
            "agent": self.agent,
            "type": self.event_type,
            "content": self.content,
            "data": self.data,
            "timestamp": self.timestamp
        }
        return f"data: {json.dumps(payload)}\n\n"


class EventBus:
    """Thread-safe event bus with history buffer so late/reconnecting SSE clients
    receive all events even if they connect after the pipeline has started or finished."""

    def __init__(self):
        self._queues: dict = {}
        self._history: dict = {}   # job_id -> list[StreamEvent]
        self._closed: set = set()  # job_ids whose pipeline is complete
        self._lock = threading.Lock()

    def subscribe(self, job_id: str) -> queue.Queue:
        """Create a new listener queue. Replays full history immediately so
        reconnecting clients catch up with no gaps."""
        with self._lock:
            q = queue.Queue(maxsize=1000)
            self._queues[job_id] = q
            history = list(self._history.get(job_id, []))
            already_done = job_id in self._closed

        # Replay history into the fresh queue (outside the lock)
        for event in history:
            try:
                q.put_nowait(event)
            except queue.Full:
                break

        # If the pipeline already finished, add the sentinel now
        if already_done:
            q.put(None)

        return q

    def publish(self, job_id: str, event: StreamEvent):
        with self._lock:
            self._history.setdefault(job_id, []).append(event)
            q = self._queues.get(job_id)
        if q:
            try:
                q.put_nowait(event)
            except queue.Full:
                pass

    def close(self, job_id: str):
        """Signal end-of-stream. Marks job as done so future subscribers get
        history + sentinel immediately."""
        with self._lock:
            self._closed.add(job_id)
            q = self._queues.get(job_id)
        if q:
            q.put(None)

    def stream(self, job_id: str):
        """Generator for Flask SSE response. Blocks on the queue until sentinel."""
        with self._lock:
            q = self._queues.get(job_id)
        if not q:
            yield 'data: {"type": "done"}\n\n'
            return
        while True:
            try:
                event = q.get(timeout=30)
                if event is None:
                    yield 'data: {"type": "done"}\n\n'
                    break
                yield event.to_sse()
            except queue.Empty:
                yield ": heartbeat\n\n"

    def cleanup(self, job_id: str):
        """Remove history for a job to free memory (call after client disconnects)."""
        with self._lock:
            self._queues.pop(job_id, None)


event_bus = EventBus()
