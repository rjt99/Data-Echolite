import uuid
from services.streaming import StreamEvent, event_bus


class BaseAgent:
    name: str = "base"

    def __init__(self, job_id: str):
        self.job_id = job_id
        self.bus = event_bus

    def emit(self, event_type: str, content: str, data: dict = None):
        event = StreamEvent(self.name, event_type, content, data or {})
        self.bus.publish(self.job_id, event)

    def thinking(self, content: str):
        self.emit("thinking", content)

    def action(self, content: str, data: dict = None):
        self.emit("action", content, data)

    def result(self, content: str, data: dict = None):
        self.emit("result", content, data)

    def progress(self, content: str, percent: int = 0):
        self.emit("progress", content, {"percent": percent})

    def error(self, content: str):
        self.emit("error", content)

    def complete(self, content: str, data: dict = None):
        self.emit("complete", content, data or {})

    def stream_llm(self, prompt: str, system: str = "") -> str:
        """Stream an LLM call token-by-token, emitting each chunk as a 'token' event.
        Returns the full accumulated response string."""
        from langchain_core.messages import HumanMessage, SystemMessage
        from services.llm_service import get_text_llm

        llm = get_text_llm()
        messages = []
        if system:
            messages.append(SystemMessage(content=system))
        messages.append(HumanMessage(content=prompt))

        stream_key = str(uuid.uuid4())[:8]
        full_response = ""
        try:
            for chunk in llm.stream(messages):
                token = chunk.content if hasattr(chunk, "content") else ""
                if token:
                    full_response += token
                    self.emit("token", token, {"key": stream_key})
        except Exception as e:
            # Fall back to non-streaming invoke on stream error
            self.action(f"Streaming unavailable, falling back ({e})")
            from services.llm_service import simple_llm_call
            full_response = simple_llm_call(prompt, system)
        return full_response

    def run(self, context: dict) -> dict:
        raise NotImplementedError
