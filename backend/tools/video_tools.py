import cv2
import os
import base64
import io
import uuid
from PIL import Image


def extract_keyframes(video_path: str, max_frames: int = 20) -> list:
    """Extract evenly-spaced keyframes. Returns list of {timestamp, b64, frame_num}."""
    cap = cv2.VideoCapture(video_path)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30

    step = max(1, total_frames // max_frames)
    frames = []

    for frame_idx in range(0, total_frames, step):
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
        ret, frame = cap.read()
        if not ret:
            continue

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        img = Image.fromarray(rgb)
        img.thumbnail((768, 768))

        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=75)
        b64 = base64.b64encode(buf.getvalue()).decode("utf-8")

        timestamp = frame_idx / fps
        frames.append({
            "frame_num": frame_idx,
            "timestamp": timestamp,
            "timestamp_str": f"{int(timestamp // 60):02d}:{int(timestamp % 60):02d}",
            "b64": b64,
            "mime": "image/jpeg"
        })

    cap.release()
    return frames[:max_frames]


def extract_audio(video_path: str, output_dir: str) -> str:
    """Extract audio to WAV. Returns path or None."""
    try:
        from moviepy.editor import VideoFileClip
        audio_path = os.path.join(output_dir, f"{uuid.uuid4()}.wav")
        clip = VideoFileClip(video_path)
        if clip.audio:
            clip.audio.write_audiofile(audio_path, verbose=False, logger=None)
            clip.close()
            return audio_path
        clip.close()
    except Exception:
        pass
    return None


def transcribe_audio(audio_path: str) -> list:
    """Transcribe using faster-whisper (tiny model, CPU). Returns list of {start, end, text}."""
    try:
        from faster_whisper import WhisperModel
        model = WhisperModel("tiny", device="cpu", compute_type="int8")
        segments, _ = model.transcribe(audio_path, beam_size=1)
        return [{"start": s.start, "end": s.end, "text": s.text.strip()} for s in segments]
    except Exception as e:
        return [{"start": 0, "end": 0, "text": f"Transcription unavailable: {e}"}]
