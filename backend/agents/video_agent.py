import os
from agents.base_agent import BaseAgent
from services.llm_service import vision_llm_call
from tools.video_tools import extract_keyframes, extract_audio, transcribe_audio
from config import UPLOAD_FOLDER

FRAME_PROMPT = (
    "This is a frame from a video at {ts}. "
    "Describe what is shown: any text on screen, charts, people, diagrams, or important visual information."
)


class VideoAgent(BaseAgent):
    name = "VideoAgent"

    def run(self, context: dict) -> dict:
        parsed_docs = context.get("parsed_docs", [])

        for doc in parsed_docs:
            video_blocks = [b for b in doc.get("blocks", []) if b["type"] == "video_file"]
            if not video_blocks:
                continue

            for block in video_blocks:
                video_path = block["file_path"]
                self.thinking(f"Processing video '{doc['filename']}'...")

                # Keyframe extraction + visual analysis
                frame_descriptions = []
                try:
                    self.action("Extracting keyframes...")
                    frames = extract_keyframes(video_path, max_frames=15)
                    self.progress(f"Extracted {len(frames)} keyframes", 30)

                    for frame in frames[:8]:
                        desc = vision_llm_call(
                            FRAME_PROMPT.format(ts=frame["timestamp_str"]),
                            frame["b64"], frame["mime"]
                        )
                        frame_descriptions.append({"timestamp": frame["timestamp_str"], "description": desc})
                        self.action(f"Frame {frame['timestamp_str']} analyzed")
                except Exception as e:
                    self.error(f"Keyframe analysis failed: {e}")

                # Audio transcription
                transcript_segments = []
                try:
                    self.action("Extracting and transcribing audio...")
                    audio_path = extract_audio(video_path, UPLOAD_FOLDER)
                    if audio_path:
                        transcript_segments = transcribe_audio(audio_path)
                        os.remove(audio_path)
                        self.progress(f"Transcribed {len(transcript_segments)} segments", 80)
                except Exception as e:
                    self.error(f"Audio transcription failed: {e}")

                # Append as text blocks for embedding
                if transcript_segments:
                    full_transcript = " ".join(s["text"] for s in transcript_segments)
                    doc["blocks"].append({
                        "type": "text",
                        "content": f"[Video Transcript — {doc['filename']}]\n{full_transcript}",
                        "source": doc["filename"],
                        "derived_from": "video_transcript"
                    })

                if frame_descriptions:
                    frame_text = "\n".join(
                        f"[{fd['timestamp']}] {fd['description']}" for fd in frame_descriptions
                    )
                    doc["blocks"].append({
                        "type": "text",
                        "content": f"[Video Visual Content — {doc['filename']}]\n{frame_text}",
                        "source": doc["filename"],
                        "derived_from": "video_vision"
                    })

                block["type"] = "video_processed"
                block["frame_descriptions"] = frame_descriptions
                block["transcript_segments"] = transcript_segments

                self.result(
                    f"Video processed: {len(transcript_segments)} transcript segments, {len(frame_descriptions)} visual frames",
                    {"transcript_count": len(transcript_segments), "frame_count": len(frame_descriptions)}
                )

        self.complete("Video processing complete")
        return context
