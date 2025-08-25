from faster_whisper import WhisperModel
import torch

# Check for CUDA availability and fallback to CPU
device = "cuda" if torch.cuda.is_available() else "cpu"
compute_type = "float16" if device == "cuda" else "int8"

model = WhisperModel("medium", device=device, compute_type=compute_type)

def transcribe_audio(file_path: str):
    segments, info = model.transcribe(file_path)
    transcription = " ".join([seg.text for seg in segments])
    return transcription
